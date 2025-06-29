const puppeteer = require('puppeteer')

let browser

async function initializeBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    // Cleanup on exit
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  }
  return browser
}

async function shutdown() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

async function getPage() {
  if (!browser) {
    await initializeBrowser()
  }
  return browser.newPage()
}

module.exports = {
  initializeBrowser,
  getPage,
  shutdown
}