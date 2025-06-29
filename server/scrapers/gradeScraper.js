const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
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

    // Take screenshot for debugging
    await page.screenshot({ path: 'grades-page.png' });

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

    for (const courseCode of coursesToCheck) {
      try {
        // Find all course rows
        const rows = await page.$$('table#tblActivityGradesMidterm tbody tr');
        
        for (const row of rows) {
          // Check if this is a lecture row for the course
          const subtype = await row.$eval(
            'td[data-label="Subtype"] span',
            el => el.textContent.trim()
          );
          
          if (subtype !== 'Lecture') continue;
          
          const courseText = await row.$eval(
            'td[data-label="Course"] a span',
            el => el.textContent.trim()
          );
          
          if (!courseText.includes(courseCode)) continue;
          
          const finalGrade = await row.$eval(
            'td[data-label="Final Grade"] span',
            el => el.textContent.trim()
          );

          // Extract course name from course text
          const courseName = courseText.split(':')[1]?.trim() || courseText;
          
          // Only cache if grade exists
          if (finalGrade) {
            const courseData = {
              code: courseCode,
              name: courseName,
              grade: finalGrade
            }
            gradesCache[courseCode] = courseData
            newGrades.push(courseData)
          }
          
          // Break since we found the lecture row for this course
          break;
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
    const courses = trackedCourses.map(code => gradesCache[code] || {
      code,
      name: `Course ${code}`,
      grade: null
    })

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