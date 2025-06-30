const express = require('express');

const { getPage } = require('./../browserInstance');

const router = express.Router();

const LOGIN_URL = 'https://register.nu.edu.eg/PowerCampusSelfService/Home/LogIn';

/**
 * @route POST /login
 * @group Authentication - University login operations
 * @param {string} username.body.required - University username
 * @param {string} password.body.required - University password
 * @returns {object} 200 - Success response with session cookies
 * @returns {object} 400 - Missing credentials error
 * @returns {object} 401 - Authentication failure
 * @returns {object} 500 - Server error
 * @description Authenticates with the university site using provided credentials.
 * Uses Puppeteer to simulate user login flow and returns session cookies on success.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  let page;
  try {
    page = await getPage();
    
    console.log('Navigating to login page...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' }); // Wait until network is mostly idle

    // Phase 1: Username submission
    console.log('Entering username...');
    await page.type('#txtUsername', username);

    console.log('Clicking next...');
    await page.click('#btnNext');
    
    // Wait for either password field or error message to appear
    console.log('Waiting for password field or error message...');
    try {
      await page.waitForSelector('#txtPassword, [role="alertdialog"]', { timeout: 20000 });
    } catch (error) {
      console.log('Login timeout. Please try again.');
      await browser.close();
      return res.status(401).json({ error: 'Login timeout. Please try again.' });
    }

    // Check for username validation errors
    console.log('Checking for username error...');
    const usernameError = await page.$('[role="alertdialog"] .jss826');
    if (usernameError) {
      const errorText = await page.evaluate(el => el.textContent, usernameError);
      console.log(`Username error: ${errorText}`);
      return res.status(401).json({ error: errorText.includes('exist') ? 
        'Username does not exist.' : errorText });
    }

    // Only proceed with password if we found the password field
    const passwordField = await page.$('#txtPassword');
    if (!passwordField) {
      console.log('Password field not found after username submission');
      return res.status(401).json({ error: 'Username does not exist.' });
    }

    // Phase 2: Password submission
    console.log('Entering password...');
    await page.type('#txtPassword', password);

    console.log('Submitting login...');
    await page.click('#btnSignIn');
    
    // Wait for either successful navigation or error message
    console.log('Waiting for navigation or error message...');
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.waitForSelector('[role="alertdialog"]', { timeout: 20000 })
      ]);
    } catch (error) {
      console.log('Login timeout. Please try again.');
      return res.status(401).json({ error: 'Login timeout. Please try again.' });
    }

    // Check for password validation errors
    console.log('Checking for password error...');
    const passwordError = await page.$('[role="alertdialog"]');
    if (passwordError) {
      const errorText = await page.evaluate(el => el.textContent, passwordError);
      console.log(`Password error: ${errorText}`);
      return res.status(401).json({ error: errorText.includes('Invalid') ? 
        'Invalid password' : errorText });
    }

    // Final verification - check if we're still on login page
    console.log('Checking if login was successful...');
    const currentUrl = page.url();
    if (currentUrl.includes('LogIn')) {
      console.log('Login failed. Please try again.');
      return res.status(401).json({ error: 'Login failed. Please try again.' });
    }

    // Extract session cookies for future authenticated requests
    console.log('Getting cookies for session...');
    const cookies = await page.cookies();
    
    res.json({ 
      success: true,
      cookies 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  } finally {
    // Ensure page is always closed to prevent resource leaks
    if (page && !page.isClosed()) await page.close();
  }
});

module.exports = router;
