const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const notifier = require('node-notifier')
const { getPage } = require('./../browserInstance')

const GRADES_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Grades/GradeReport'
const CACHE_PATH = path.join(__dirname, '../../grades_cache.json')

// Load or initialize cache
let gradesCache = {}
if (fs.existsSync(CACHE_PATH)) {
  gradesCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
}

// Save cache to file
function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(gradesCache, null, 2))
}

// Send desktop notification
function sendNotification(course) {
  notifier.notify({
    title: 'New Grade Available!',
    message: `${course.code}: ${course.grade}`,
    icon: path.join(__dirname, '../../public/a+.png'),
    sound: true, // Play system sound
    wait: true // Keep notification visible until dismissed
  })
}

router.post('/fetch', async (req, res) => {
  const { cookies, trackedCourses } = req.body

  if (!cookies || !trackedCourses) {
    return res.status(400).json({ error: 'Cookies and tracked courses are required' })
  }

  let page
  try {
    page = await getPage()
    
    // Set cookies for authenticated session
    await page.setCookie(...cookies)
    
    console.log('Navigating to grades page...')
    await page.goto(GRADES_URL, { waitUntil: 'networkidle2' })

    // Check if we're still logged in
    if (page.url().includes('LogIn')) {
      return res.status(401).json({ error: 'Session expired. Please login again.' })
    }

    // Scrape overall GPA using structure-based selector
    const gpa = await page.evaluate(() => {
      const gridItems = Array.from(document.querySelectorAll('div.grid-item'));
      const overallItem = gridItems.find(item => 
        item.querySelector('span')?.textContent?.includes('Overall')
      );
      return parseFloat(overallItem?.querySelector('h3')?.textContent || '0');
    });

    // Scrape total credit hours using structure-based selector
    const creditHours = await page.evaluate(() => {
      const gridItems = Array.from(document.querySelectorAll('div.grid-item'));
      const earnedItem = gridItems.find(item => 
        item.querySelector('span')?.textContent?.includes('Earned')
      );
      return parseFloat(earnedItem?.querySelector('h3')?.textContent || '0');
    });

    // Scrape grades for tracked courses that aren't in cache yet
    const newGrades = []
    const coursesToCheck = trackedCourses.filter(code => !gradesCache[code])

    // Get all course rows
    const rows = await page.$$('table#tblActivityGradesMidterm tbody tr');
    
    // Create a map to store course names for all courses
    const courseNames = new Map();
    
    // First pass: collect all course names
    for (const row of rows) {
      try {
        const courseText = await row.$eval(
          'td[data-label="Course"] a span',
          el => el.textContent.trim()
        );
        
        // Extract course code and name
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
    
    // Second pass: process courses to check
    for (const courseCode of coursesToCheck) {
      try {
        let found = false;
        
        // Find the row for this course (Lecture only)
        for (const row of rows) {
          const subtype = await row.$eval(
            'td[data-label="Subtype"] span',
            el => el.textContent.trim()
          );
          
          // Skip non-lecture rows
          if (subtype !== 'Lecture') continue;
          
          const courseText = await row.$eval(
            'td[data-label="Course"] a span',
            el => el.textContent.trim()
          );
          
          // Check if this is the row for our course
          if (courseText.includes(courseCode)) {
            found = true;
            
            // Get the final grade
            const finalGrade = await row.$eval(
              'td[data-label="Final Grade"] span',
              el => el.textContent.trim()
            );

            // Get course name from our map or default
            const courseName = courseNames.get(courseCode) || 
                             courseText.split(':')[1]?.trim() || 
                             `Course ${courseCode}`;

            // Only cache if grade exists
            if (finalGrade) {
              const courseData = {
                code: courseCode,
                name: courseName,
                grade: finalGrade
              }
              gradesCache[courseCode] = courseData
              newGrades.push(courseData)
              
              // Send desktop notification for new grade
              sendNotification(courseData)
            }
            
            break; // Found the course, break inner loop
          }
        }
        
        // If we didn't find the course in any row
        if (!found) {
          console.log(`Course ${courseCode} not found in grade report`);
        }
      } catch (error) {
        console.log(`Error scraping ${courseCode}:`, error.message)
      }
    }

    // Save updated cache
    if (newGrades.length > 0) {
      saveCache()
    }

    // Get all tracked courses from cache (including previously stored ones)
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
    })

  } catch (error) {
    console.error('Grade scraping error:', error)
    res.status(500).json({ error: 'Failed to fetch grades. Please try again.' })
  } finally {
    if (page) await page.close()
  }
})

module.exports = router