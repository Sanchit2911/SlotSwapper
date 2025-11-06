SlotSwapper - Peer-to-Peer Time Slot Scheduling Application
A full-stack MERN application that allows users to swap calendar time slots with each other. Built with modern best practices, security measures, and a focus on the complex swap transaction logic. Includes dark mode / light mode support for better UX.

🎯 Overview
SlotSwapper enables users to:

Manage their calendar events with different statuses (BUSY, SWAPPABLE, SWAP_PENDING)

Browse available time slots from other users

Request to swap their slots with others

Accept or reject incoming swap requests

Toggle between dark mode and light mode

Have their calendars automatically updated upon successful swaps

🏗️ Architecture
Tech Stack
Backend:

Node.js + Express + TypeScript

MongoDB with Mongoose ODM

JWT Authentication (Bearer tokens)

bcrypt for password hashing

Helmet.js for security headers

express-rate-limit for API protection

Frontend:

React 18 + TypeScript

Vite (build tool)

TailwindCSS (styling)

React Router v6 (routing)

Axios (API calls)

date-fns (date formatting)

Dark Mode / Light Mode support with Tailwind

Database Schema
Users Collection:

JSON

{
"\_id": "ObjectId",
"name": "String",
"email": "String (unique, indexed)",
"password": "String (hashed)",
"createdAt": "Date",
"updatedAt": "Date"
}
Events Collection:

JSON

{
"\_id": "ObjectId",
"userId": "ObjectId (ref: User, indexed)",
"title": "String",
"startTime": "Date (indexed)",
"endTime": "Date",
"status": "Enum ['BUSY', 'SWAPPABLE', 'SWAP_PENDING']",
"swapRequestId": "ObjectId (ref: SwapRequest, optional)",
"createdAt": "Date",
"updatedAt": "Date"
}
SwapRequests Collection:

JSON

{
"\_id": "ObjectId",
"requesterId": "ObjectId (ref: User)",
"requesterSlotId": "ObjectId (ref: Event)",
"targetUserId": "ObjectId (ref: User, indexed)",
"targetSlotId": "ObjectId (ref: Event)",
"status": "Enum ['PENDING', 'ACCEPTED', 'REJECTED']",
"createdAt": "Date",
"updatedAt": "Date"
}

🔒 Security Features
Authentication:

JWT tokens with 7-day expiry

Passwords hashed with bcrypt (12 salt rounds)

Protected routes with auth middleware

Input Validation:

Server-side validation for all inputs

Mongoose schema validation

XSS protection via input sanitization

API Security:

Helmet.js for security headers

CORS configured for specific origin

Rate limiting on auth endpoints (100 requests/15 min)

MongoDB injection prevention with express-mongo-sanitize

Error Handling:

Custom error handler middleware

No stack trace exposure in production

Consistent error response format

🎯 Core Swap Logic Implementation
The swap logic is the heart of this application and uses MongoDB transactions to ensure ACID compliance:

Key Features:

Atomic Operations: All swap operations use MongoDB sessions to ensure atomicity

Status Locking: Slots are locked (SWAP_PENDING) when a swap is requested

Validation: Multiple validation checks prevent race conditions

Owner Exchange: The critical owner swap happens within a transaction

Rollback: Any failure triggers automatic transaction rollback

Swap Flow:

Creating a Swap Request:

Validate both slots exist and are SWAPPABLE

Verify requester owns their slot

Verify not swapping with self

Create swap request record

Lock both slots (set to SWAP_PENDING)

Link slots to swap request

Commit transaction

Accepting a Swap:

Verify swap request exists and is PENDING

Verify user is authorized (target user)

Lock both slots for reading

Verify both slots are SWAP_PENDING

Verify slots are locked for THIS swap

CRITICAL: Exchange userId between slots

Set both slots back to BUSY

Mark swap request as ACCEPTED

Commit transaction

Rejecting a Swap:

Verify swap request exists and is PENDING

Verify user is authorized

Mark swap as REJECTED

Unlock both slots (set back to SWAPPABLE)

Commit transaction

📁 Project Structure
slotswapper/
├── server/ # Backend
│ ├── coverage/ # Jest coverage reports
│ │ ├── clover.xml
│ │ ├── coverage-final.json
│ │ ├── lcov.info
│ │ └── lcov-report/
│ ├── logs/ # Server logs
│ │ ├── combined.log
│ │ └── error.log
│ ├── src/
│ │ ├── config/
│ │ │ └── database.ts # MongoDB connection
│ │ ├── controllers/
│ │ │ ├── auth.controller.ts
│ │ │ ├── event.controller.ts
│ │ │ └── swap.controller.ts
│ │ ├── middleware/
│ │ │ ├── auth.ts # JWT authentication
│ │ │ └── errorHandler.ts # Global error handler
│ │ ├── models/
│ │ │ ├── User.ts
│ │ │ ├── Event.ts
│ │ │ └── SwapRequest.ts
│ │ ├── routes/
│ │ │ ├── auth.routes.ts
│ │ │ ├── event.routes.ts
│ │ │ └── swap.routes.ts
│ │ ├── services/
│ │ │ └── swap.service.ts
│ │ ├── types/
│ │ │ └── index.ts
│ │ └── utils/ # Utility functions
│ ├── tests/ # Unit / integration tests
│ │ └── swapService.test.ts
│ ├── jest.config.ts
│ ├── package.json
│ └── tsconfig.json
├── client/ # Frontend
│ ├── public/
│ │ └── vite.svg
│ ├── src/
│ │ ├── assets/ # Images, icons, etc.
│ │ ├── components/ # UI components
│ │ │ ├── Navbar.tsx
│ │ │ └── ProtectedRoute.tsx
│ │ ├── context/ # React contexts
│ │ │ └── AuthContext.tsx
│ │ ├── hooks/ # Custom React hooks
│ │ ├── pages/ # App pages
│ │ │ ├── Login.tsx
│ │ │ ├── Signup.tsx
│ │ │ ├── Dashboard.tsx
│ │ │ ├── Marketplace.tsx
│ │ │ └── Requests.tsx
│ │ ├── schemas/ # Client-side validation schemas
│ │ ├── services/ # API clients
│ │ │ └── api.ts
│ │ ├── types/
│ │ │ └── index.ts
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── index.css # Includes dark mode / light mode
│ ├── eslint.config.js
│ ├── index.html
│ ├── .env.example
│ ├── package.json
│ ├── package-lock.json
│ ├── postcss.config.js
│ ├── tailwind.config.js
│ ├── tsconfig.app.json
│ ├── tsconfig.json
│ ├── tsconfig.node.json
│ └── vite.config.ts
└── README.md

🚀 Setup Instructions
Prerequisites
Node.js (v18 or higher)

MongoDB (v5 or higher)

npm or yarn

Backend Setup
Navigate to server directory:

Bash

cd server
Install dependencies:

Bash

npm install
Create environment file:

Bash

cp .env.example .env
Configure environment variables in .env:

Code snippet

NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-change-in-production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
Start MongoDB:

Bash

# Using MongoDB service

mongod

# Or using Docker

docker run -d -p 27017:27017 --name mongodb mongo:latest
Run the server:

Bash

# Development mode with hot reload

npm run dev

# Production build

npm run build
npm start
Server will run on http://localhost:5000

Frontend Setup
Navigate to client directory:

Bash

cd client
Install dependencies:

Bash

npm install
Create environment file:

Bash

cp .env.example .env
Configure environment variables in .env:

Code snippet

VITE_API_URL=http://localhost:5000/api
Run the development server:

Bash

npm run dev
Client will run on http://localhost:5173

Running Both Servers Concurrently
You can use concurrently to run both servers from the root:

Bash

# Install concurrently globally

npm install -g concurrently

# Run from root directory

concurrently "cd server && npm run dev" "cd client && npm run dev"

🚀 Deployment Guide (Vercel & Render)
Here are the necessary changes to deploy your monorepo to Render (backend) and Vercel (frontend).

1. Database (Crucial Prerequisite)
   Your local MONGODB_URI (mongodb://localhost:27017/slotswapper) will not work in production. You must use a cloud-hosted database.

Create a cloud database: Use a service like MongoDB Atlas (they have a generous free tier).

Get the connection string: After creating your cluster, get the new connection string (it will look something like mongodb+srv://...).

Whitelist IPs: In your Atlas cluster settings, allow access from anywhere (0.0.0.0/0) or from Render's specific IPs.

2. Backend Deployment (Render)
   Render is ideal for hosting the Node.js server.

Create a new "Web Service" on Render and connect your GitHub repository.

Repository Settings:

Root Directory: server (This tells Render to look inside the server folder).

Build & Start Commands:

Build Command: npm install && npm run build (Installs dependencies and runs your TypeScript build).

Start Command: npm start (This runs the compiled dist/index.js file as defined in your package.json).

Environment Variables (Set in Render's dashboard):

NODE_ENV: production

MONGODB_URI: Your new MongoDB Atlas connection string.

JWT_SECRET: A new, strong, random 32+ character string. Do not use your development key.

JWT_EXPIRE: 7d

CLIENT_URL: Crucial for CORS. This will be your Vercel frontend URL (e.g., https://slotswapper.vercel.app). You'll get this URL in the next step.

3. Frontend Deployment (Vercel)
   Vercel is perfect for hosting the React/Vite frontend.

Create a new "Project" on Vercel and connect your GitHub repository.

Project Settings:

Framework Preset: Vite (Vercel will likely auto-detect this).

Root Directory: client (This tells Vercel to look inside the client folder).

Build & Output:

Vercel will auto-detect the build command (npm run build) and output directory (dist). You shouldn't need to change anything.

Environment Variables (Set in Vercel's dashboard):

VITE_API_URL: Crucial for API calls. This must be the public URL of your Render backend (e.g., https://slotswapper-api.onrender.com/api). Make sure to include the /api path.

Deployment Flow Summary
Deploy Backend: Deploy the server to Render first. This will give you a public API URL (e.g., https://slotswapper-api.onrender.com).

Deploy Frontend: Deploy the client to Vercel. In Vercel's environment variables, set VITE_API_URL to the Render URL from step 1.

Update CORS: Once Vercel deploys, it will give you a public frontend URL (e.g., https://slotswapper.vercel.app). Go back to your Render dashboard and update the CLIENT_URL environment variable to this Vercel URL. This final step authorizes your frontend to make requests to your backend.

📚 API Documentation
Base URL: http://localhost:5000/api

Authentication Endpoints
POST /auth/signup
Register a new user.

Request Body:

JSON

{
"name": "John Doe",
"email": "john@example.com",
"password": "password123"
}
Response:

JSON

{
"success": true,
"token": "jwt_token_here",
"user": {
"id": "user_id",
"name": "John Doe",
"email": "john@example.com"
}
}

POST /auth/login
Login existing user.

Request Body:

JSON

{
"email": "john@example.com",
"password": "password123"
}
Response: Same as signup

GET /auth/me
Get current user profile (requires authentication).

Headers:

Authorization: Bearer <token>

Event Endpoints (All require authentication)
GET /events
Get all events for the logged-in user.

POST /events
Create a new event.

Request Body:

JSON

{
"title": "Team Meeting",
"startTime": "2024-12-20T10:00:00Z",
"endTime": "2024-12-20T11:00:00Z",
"status": "BUSY"
}
PATCH /events/:id
Update an event (including status changes).

Request Body:

JSON

{
"status": "SWAPPABLE"
}
DELETE /events/:id
Delete an event (not allowed if SWAP_PENDING).

Swap Endpoints (All require authentication)
GET /swaps/available-slots
Get all swappable slots from other users.

POST /swaps/request
Create a swap request.

Request Body:

JSON

{
"mySlotId": "event_id_1",
"theirSlotId": "event_id_2"
}

GET /swaps/incoming
Get incoming swap requests.

GET /swaps/outgoing
Get outgoing swap requests.

POST /swaps/:id/accept
Accept a swap request (exchanges event ownership).

POST /swaps/:id/reject
Reject a swap request (unlocks both slots).

DELETE /swaps/:id
Cancel an outgoing swap request.

🧪 Testing
Manual Testing Flow
Create two users:

User A: alice@example.com

User B: bob@example.com

User A creates events:

Login as Alice

Create "Team Meeting" on Tuesday 10-11 AM

Mark it as SWAPPABLE

User B creates events:

Login as Bob

Create "Focus Block" on Wednesday 2-3 PM

Mark it as SWAPPABLE

User A requests swap:

Go to Marketplace

See Bob's slot

Request swap with your Tuesday slot

Both slots become SWAP_PENDING

User B responds:

Go to Requests > Incoming

See Alice's request

Accept or Reject

If accepted, events are exchanged

Verify:

Check both dashboards

Alice should now have Wednesday slot

Bob should now have Tuesday slot

Both slots are BUSY

Edge Cases to Test
Concurrent requests: Two users request the same slot simultaneously

Deleted users: User deletes account with pending swaps

Network failures: Transaction rollback on failures

Invalid tokens: Expired or tampered JWT tokens

Permission checks: Users trying to access others' events

🔧 Design Decisions & Assumptions
Assumptions
Event Duration: Events can be of any duration (no minimum/maximum)

Time Zones: All times stored in UTC, client handles display

Overlap Prevention: No validation for overlapping events (users can have conflicting schedules)

Swap Uniqueness: One swap request per slot pair at a time

Automatic Status: Events become BUSY after successful swap

Design Decisions
MongoDB Transactions: Chosen for ACID compliance in swap operations

Status-Based Locking: SWAP_PENDING prevents multiple concurrent swaps

JWT in Headers: More secure than cookies for SPA

No Real-time: Polling approach instead of WebSockets (simpler)

Soft Validation: Minimal restrictions to keep UX simple

🚧 Challenges Faced
Transaction Handling

Challenge: Ensuring atomic swaps with multiple database operations.

Solution: Implemented MongoDB transactions with proper session management and rollback on any failure.

Race Conditions

Challenge: Multiple users requesting the same slot simultaneously.

Solution: Status-based locking (SWAP_PENDING) prevents double-booking. Transaction-level locks ensure consistency.

State Management

Challenge: Keeping frontend in sync with backend state changes.

Solution: Refetch data after mutations and use optimistic UI updates where appropriate.

Error Handling

Challenge: Providing meaningful error messages without exposing security details.

Solution: Custom error handler that sanitizes errors in production while logging details server-side.

🌟 Future Enhancements
If this were to be extended:

Real-time Notifications: WebSocket integration for instant updates

Calendar Integration: Sync with Google Calendar, Outlook

Advanced Filtering: Filter slots by date, duration, user

Swap History: Track all past swaps for audit

Recurring Events: Support for repeating time slots

Group Swaps: Multi-party swaps (A→B→C→A)

Email Notifications: Alert users of new swap requests

Mobile App: React Native implementation

Analytics Dashboard: Usage statistics and insights

Testing Suite: Comprehensive unit and integration tests

📝 Notes
All passwords are hashed with bcrypt before storage

JWT tokens expire after 7 days

MongoDB indexes optimize query performance

Rate limiting prevents brute force attacks

CORS is configured for specific frontend origin

All dates are stored in ISO 8601 format

TypeScript provides type safety across the stack

For the actual role, the codebase would include:

Comprehensive test coverage

CI/CD pipelines

Docker containerization

API documentation (Swagger/OpenAPI)

Deployment configurations

📄 License
MIT License - SlotSwapper Demonstration

For questions or issues, please contact [sanchitkumar2911@gmail.com]
