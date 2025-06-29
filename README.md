# Grade Checker - NU Grades Monitoring System

## Overview
Grade Tracker is a personal web application that automatically monitors your NU grades by scraping your student PowerCampus. It provides real-time notifications when new grades are posted so you don't have to check yourself.

Key features:
- Secure authentication flow
- Automatic grade scraping every set interval
- Desktop notifications for new grades
- Cumulative GPA and credit hour tracking

## Installation
### Prerequisites:
- Node.js (v22+)
- npm (v11+)
- git

### Steps:
**1. Clone the repository:**
```bash
git clone https://github.com/AbdelRahmanRahal/Grade-Checker
cd Grade-Checker
```

**2. Install frontend dependencies:**
```bash
cd client
npm install
```

**3. Install backend dependencies:**
```bash
cd ../server
npm install
```

## Usage
### Running the Application
**1. Start the backend server:**
```bash
cd server
node server.js
```

**2. Start the frontend in a separate shell:**
```bash
cd client
npm run dev
```

**3. Access the application:**

Open your browser and navigate to http://localhost:5173

### Using the Application
**1. Login:**

Enter your NU username and password credentials

**2. Add Courses:**
- Enter course codes (e.g., CSCI101) to track
- Courses are saved in local storage

**3. View Grades:**
- Current GPA and credit hours are displayed
- Tracked courses show their current grades
- New grades trigger desktop notifications

**4. Automatic Updates:**
- The app checks for new grades every set interval
- You can set the interval between each check
- You can manually refresh at any time

## Technical Stack
**Frontend:**
- React + Vite
- Tailwind CSS
- react-toastify

**Backend:**
- Node.js + Express
- Puppeteer (for web scraping)

**Other:**
- node-notifier (for desktop notifications)
- Local storage (for course tracking)
- JSON file caching (for grade persistence)

## Security Note
Your university credentials are:
- Never stored on disk
- Only kept in memory during your session
- Not sent to any external servers
- Used solely for scraping your grades from the university portal

## License
This project is licensed under the BSD-3-Clause License - see the [LICENSE](https://github.com/AbdelRahmanRahal/Grade-Checker/blob/main/LICENSE) file for details.

## Support
For issues or feature requests, please open an issue on [GitHub](https://github.com/AbdelRahmanRahal/Grade-Checker/issues) or submit a pull request with your contributions.