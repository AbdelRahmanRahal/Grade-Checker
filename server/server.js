const express = require('express')
const cors = require('cors')
const authRouter = require('./scrapers/authScraper')

const app = express()
const PORT = 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

app.use('/auth', authRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})