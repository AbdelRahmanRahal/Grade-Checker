const puppeteer = require('puppeteer');

// Singleton browser instance
let browser;

/**
 * Initializes and manages a Puppeteer browser instance.
 * @async
 * @function initializeBrowser
 * @returns {Promise<puppeteer.Browser>} The initialized browser instance
 * @description Launches a headless browser with security sandbox disabled for container compatibility.
 * Also sets up cleanup handlers for process termination signals.
 */
async function initializeBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for running in Docker/container environments
    });
    
    // Cleanup on exit to prevent orphaned browser processes
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
  return browser;
}

/**
 * Gracefully shuts down the browser instance.
 * @async
 * @function shutdown
 * @description Closes the browser and clears the reference to allow for fresh initialization.
 */
async function shutdown() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Retrieves a new page from the browser instance.
 * @async
 * @function getPage
 * @returns {Promise<puppeteer.Page>} A new browser page
 * @description Initializes the browser if not already done, then creates a new page.
 */
async function getPage() {
  if (!browser) {
    await initializeBrowser();
  }
  return browser.newPage();
}

module.exports = {
  initializeBrowser,
  getPage,
  shutdown
};
