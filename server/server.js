const express = require('express')
const cors = require('cors')
const authRouter = require('./scrapers/authScraper')
const gradeRouter = require('./scrapers/gradeScraper')
const { initializeBrowser } = require('./browserInstance')

const app = express()
const PORT = 3001

// Initialize browser when server starts
initializeBrowser()
  .then(() => {
    console.log('Browser instance initialized')
    
    app.use(cors())
    app.use(express.json())

    app.use('/auth', authRouter)
    app.use('/grades', gradeRouter)

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('Failed to initialize browser:', err)
    process.exit(1)
  })