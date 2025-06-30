const cors = require('cors');
const express = require('express');

const { initializeBrowser } = require('./browserInstance');
const authRouter = require('./scrapers/authScraper');
const gradeRouter = require('./scrapers/gradeScraper');

const app = express();
const PORT = 3001;

/**
 * Initializes the Express server with API routes.
 * @description Sets up CORS, JSON parsing, and routes for authentication and grade scraping.
 * Also initializes the Puppeteer browser instance before starting the server.
 */
initializeBrowser()
  .then(() => {
    console.log('Browser instance initialized');
    
    // Middleware setup
    app.use(cors()); // Enable CORS for all routes
    app.use(express.json()); // Parse JSON request bodies

    // Route handlers
    app.use('/auth', authRouter); // Authentication endpoints
    app.use('/grades', gradeRouter); // Grade scraping endpoints

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize browser:', err);
    process.exit(1); // Exit with error if browser can't be initialized
  });