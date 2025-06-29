const express = require('express')
const puppeteer = require('puppeteer')
const router = express.Router()

const LOGIN_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Home/LogIn'
const GRADES_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Grades/GradeReport'

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' })

    // Enter username and click next
    await page.type('#txtUsername', username)
    await page.click('#btnNext')
    await page.waitForNetworkIdle()

    // Enter password and submit
    await page.type('#txtPassword', password)
    await page.click('#btnSignIn')
    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    // Check if login was successful
    const currentUrl = page.url()
    if (currentUrl.includes('LogIn')) {
      await browser.close()
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Get cookies for session
    const cookies = await page.cookies()
    await browser.close()

    res.json({ 
      success: true,
      cookies 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed. Please try again later.' })
  }
})

module.exports = router