const fs = require('fs');
const path = require('path');

const express = require('express');
const notifier = require('node-notifier');

const { getPage } = require('./../browserInstance');

const router = express.Router();

// Constants for configuration
const GRADES_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Grades/GradeReport'
const CACHE_PATH = path.join(__dirname, '../../grades_cache.json')
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

// Load or initialize grades cache from file
let gradesCache = {};
if (fs.existsSync(CACHE_PATH)) {
  gradesCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
}

/**
 * Persists the current grades cache to disk.
 * @function saveCache
 */
function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(gradesCache, null, 2));
}

/**
 * Sends a desktop notification for a new grade.
 * @function sendNotification
 * @param {Object} course - The course with new grade
 * @param {string} course.code - Course code
 * @param {string} course.grade - Grade received
 */
function sendNotification(course) {
  notifier.notify({
    title: 'New Grade Available!',
    message: `${course.code}: ${course.grade}`,
    icon: path.join(__dirname, '../../public/a+.png'),
    sound: true, // Play system sound
    wait: true // Keep notification visible until dismissed
  });
}

/**
 * Retries a function until it succeeds or reaches max attempts.
 * @async
 * @function withRetry
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise<any>} Result of the successful function call
 * @throws {Error} If all attempts fail
 */
async function withRetry(fn, maxAttempts = MAX_RETRIES) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts} failed: ${error.message}`);
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff could be implemented here if needed
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/**
 * @route POST /fetch
 * @group Grades - University grade operations
 * @param {Array} cookies.body.required - Session cookies from authentication
 * @param {Array<string>} trackedCourses.body.required - Course codes to track
 * @returns {object} 200 - Success response with grades data
 * @returns {object} 400 - Missing parameters error
 * @returns {object} 401 - Session expired error
 * @returns {object} 500 - Server error
 * @returns {object} 504 - Gateway timeout error
 * @description Fetches grades from university site, compares with cache, and notifies of new grades.
 * Implements retry logic for unreliable network conditions.
 */
router.post('/fetch', async (req, res) => {
  const { cookies, trackedCourses } = req.body;

  if (!cookies || !trackedCourses) {
    return res.status(400).json({ error: 'Cookies and tracked courses are required' });
  }

  let page;
  try {
    page = await getPage();
    await page.setCookie(...cookies); // Restore session
    
    // Wrap navigation in retry logic
    await withRetry(async (attempts = 0) => {
      console.log(`Navigating to grades page (attempt ${attempts + 1}/${MAX_RETRIES})...`);
      await page.goto(GRADES_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    });

    // Check if session is still valid
    if (page.url().includes('LogIn')) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // Scrape overall GPA using structure-based selector
    const gpa = await page.evaluate(() => {
      const gridItems = Array.from(document.querySelectorAll('div.grid-item'));
      const overallItem = gridItems.find(item => 
        item.querySelector('span')?.textContent?.includes('Overall')
      );
      return parseFloat(overallItem?.querySelector('h3')?.textContent || '0');
    });

    // Scrape total credit hours
    const creditHours = await page.evaluate(() => {
      const gridItems = Array.from(document.querySelectorAll('div.grid-item'));
      const earnedItem = gridItems.find(item => 
        item.querySelector('span')?.textContent?.includes('Earned')
      );
      return parseFloat(earnedItem?.querySelector('h3')?.textContent || '0');
    });

    // Only check courses that aren't already in cache
    const newGrades = [];
    const coursesToCheck = trackedCourses.filter(code => !gradesCache[code]);

    // Get all course rows from the table
    const rows = await page.$$('table#tblActivityGradesMidterm tbody tr');
    
    // Create a map to store course names for all courses
    const courseNames = new Map();
    
    // First pass: collect all course names for reference
    for (const row of rows) {
      try {
        const courseText = await row.$eval(
          'td[data-label="Course"] a span',
          el => el.textContent.trim()
        );
        
        // Extract course code and name using regex
        const match = courseText.match(/^([\w\/]+):\s*(.+)$/);
        if (match) {
          const code = match[1].trim();
          const name = match[2].trim();
          courseNames.set(code, name);
        }
      } catch (error) {
        // Skip if course text can't be extracted
      }
    }
    
    // Second pass: process courses we need to check
    for (const courseCode of coursesToCheck) {
      try {
        let found = false;
        
        // Find the row for this course (Lecture only)
        for (const row of rows) {
          const subtype = await row.$eval(
            'td[data-label="Subtype"] span',
            el => el.textContent.trim()
          );
          
          if (subtype !== 'Lecture') continue; // Skip labs/tutorials
          
          const courseText = await row.$eval(
            'td[data-label="Course"] a span',
            el => el.textContent.trim()
          );
          
          if (courseText.includes(courseCode)) {
            found = true;
            
            // Get the final grade
            const finalGrade = await row.$eval(
              'td[data-label="Final Grade"] span',
              el => el.textContent.trim()
            );

            // Get course name from our map or fall back to parsing
            const courseName = courseNames.get(courseCode) || 
                             courseText.split(':')[1]?.trim() || 
                             `Course ${courseCode}`;

            if (finalGrade) {
              const courseData = {
                code: courseCode,
                name: courseName,
                grade: finalGrade
              };
              gradesCache[courseCode] = courseData;
              newGrades.push(courseData);
              
              // Notify user of new grade
              sendNotification(courseData);
            }
            
            break; // Found the course, no need to check other rows
          }
        }
        
        if (!found) {
          console.log(`Course ${courseCode} not found in grade report`);
        }
      } catch (error) {
        console.log(`Error scraping ${courseCode}:`, error.message);
      }
    }

    // Persist cache if we found new grades
    if (newGrades.length > 0) {
      saveCache();
    }

    // Prepare response with all tracked courses
    const courses = trackedCourses.map(code => {
      if (gradesCache[code]) {
        return gradesCache[code];
      }
      
      // For courses without grades, use the name we collected if available
      const name = courseNames.get(code) || `Course ${code}`;
      
      return {
        code,
        name,
        grade: null
      };
    });

    res.json({
      success: true,
      gpa,
      creditHours,
      courses,
      newGrades
    });

  } catch (error) {
    console.error('Grade scraping error:', error);
    
    // Special handling for timeout errors
    if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
      return res.status(504).json({ error: 'University site is unreachable, likely due to a timeout or the site is down. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to fetch grades. Please try again.' });
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
});

module.exports = router;
