const express = require('express')
const router = express.Router()
const { getPage } = require('./../browserInstance')

const LOGIN_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Home/LogIn'

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  let page
  try {
    page = await getPage()
    
    console.log('Navigating to login page...')
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' })


    console.log('Entering username...')
    await page.type('#txtUsername', username)

    console.log('Clicking next...')
    await page.click('#btnNext')
    
    console.log('Waiting for password field or error message...')
    try {
      await page.waitForSelector('#txtPassword, [role="alertdialog"]', { timeout: 10000 })
    } catch (error) {
      console.log('Login timeout. Please try again.')
      await browser.close()
      return res.status(401).json({ error: 'Login timeout. Please try again.' })
    }

    console.log('Checking for username error...')
    const usernameError = await page.$('[role="alertdialog"] .jss826')
    if (usernameError) {
      const errorText = await page.evaluate(el => el.textContent, usernameError)
      console.log(`Username error: ${errorText}`)
      await browser.close()
      return res.status(401).json({ error: errorText.includes('exist') ? 
        'Username does not exist.' : errorText })
    }

    // Only proceed with password if we found the password field
    const passwordField = await page.$('#txtPassword')
    if (!passwordField) {
      console.log('Password field not found after username submission')
      await browser.close()
      return res.status(401).json({ error: 'Username does not exist.' })
    }

    console.log('Entering password...')
    await page.type('#txtPassword', password)

    console.log('Submitting login...')
    await page.click('#btnSignIn')
    
    console.log('Waiting for navigation or error message...')
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.waitForSelector('[role="alertdialog"]', { timeout: 10000 })
      ])
    } catch (error) {
      console.log('Login timeout. Please try again.')
      await browser.close()
      return res.status(401).json({ error: 'Login timeout. Please try again.' })
    }

    console.log('Checking for password error...')
    const passwordError = await page.$('[role="alertdialog"]')
    if (passwordError) {
      const errorText = await page.evaluate(el => el.textContent, passwordError)
      console.log(`Password error: ${errorText}`)
      await browser.close()
      return res.status(401).json({ error: errorText.includes('Invalid') ? 
        'Invalid password' : errorText })
    }

    console.log('Checking if login was successful...') // Ensuring we are not on the login page (kind of unnecessary but what the hell)
    const currentUrl = page.url()
    if (currentUrl.includes('LogIn')) {
      console.log('Login failed. Please try again.')
      await browser.close()
      return res.status(401).json({ error: 'Login failed. Please try again.' })
    }

     console.log('Getting cookies for session...')
    const cookies = await page.cookies()
    
    res.json({ 
      success: true,
      cookies 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed. Please try again later.' })
  } finally {
    if (page) await page.close()
  }
})

module.exports = router