# Snake Game

A modern Snake Game built with Next.js and React.

## About

This project is a browser-based version of the classic Snake game with:
- Responsive game board for desktop and mobile
- Keyboard controls and touch swipe support
- Pause and resume controls
- Best score saved in local storage
- Special big food with time-based bonus points

## Gameplay

- Move the snake to eat food and grow longer.
- Avoid walls and your own body.
- The game ends when a collision happens.

## Controls

### Keyboard
- Arrow keys or WASD to move
- Space to pause or resume

### Mobile
- Swipe on the game board to change direction
- Use on-screen direction buttons

## Scoring

- Normal food: +5 points each
- After every 5 normal foods, a big food appears for 8 seconds

Big food score by remaining time:
- 8 seconds: +40
- 7 seconds: +35
- 6 seconds: +30
- 5 seconds: +25
- 4 seconds: +20
- 3 seconds: +15
- 2 seconds: +10
- 1 second: +8

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS

## Run Locally

1. Install dependencies:
   npm install
2. Start development server:
   npm run dev
3. Open in browser:
   http://localhost:3000

## Deployment

This project is ready for Vercel deployment.

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Deploy.

## Author

Created by pk.
