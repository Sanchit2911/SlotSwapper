# SlotSwapper - Peer-to-Peer Time Slot Scheduling Application

A full-stack MERN application that allows users to swap calendar time slots with each other.  
Built with modern best practices, security measures, and a focus on the complex swap transaction logic.  
Includes dark mode / light mode support for better UX.

---

## 🎯 Overview

SlotSwapper enables users to:

- Manage their calendar events with different statuses (`BUSY`, `SWAPPABLE`, `SWAP_PENDING`)
- Browse available time slots from other users
- Request to swap their slots with others
- Accept or reject incoming swap requests
- Toggle between dark mode and light mode
- Have their calendars automatically updated upon successful swaps

---

## 🏗️ Architecture

### Tech Stack

**Backend:**

- Node.js + Express + TypeScript
- MongoDB with Mongoose ODM
- JWT Authentication (Bearer tokens)
- bcrypt for password hashing
- Helmet.js for security headers
- express-rate-limit for API protection

**Frontend:**

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router v6 (routing)
- Axios (API calls)
- date-fns (date formatting)
- Dark Mode / Light Mode support with Tailwind

---

## 📚 Database Schema

**Users Collection:**

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique, indexed)",
  "password": "String (hashed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Events Collection:

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

The swap logic uses MongoDB transactions to ensure ACID compliance:

Key Features:

Atomic Operations: MongoDB sessions ensure atomicity

Status Locking: Slots locked (SWAP_PENDING) during swap

Validation: Prevents race conditions

Owner Exchange: UserId exchanged in transaction

Rollback: Automatic rollback on failure

Swap Flow:

Creating a Swap Request:

Validate both slots exist and are SWAPPABLE

Verify requester owns their slot

Verify not swapping with self

Create swap request record

Lock both slots (SWAP_PENDING)

Link slots to swap request

Commit transaction

Accepting a Swap:

Verify swap request exists and is PENDING

Verify user is authorized (target user)

Lock both slots for reading

Verify both slots are SWAP_PENDING and locked for THIS swap

Exchange userId between slots

Set slots back to BUSY

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
├── server/
│ ├── coverage/
│ ├── logs/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── services/
│ │ ├── types/
│ │ └── utils/
│ ├── tests/
│ ├── jest.config.ts
│ ├── package.json
│ └── tsconfig.json
├── client/
│ ├── public/
│ ├── src/
│ │ ├── assets/
│ │ ├── components/
│ │ ├── context/
│ │ ├── hooks/
│ │ ├── pages/
│ │ ├── schemas/
│ │ ├── services/
│ │ ├── types/
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── index.css
│ ├── index.html
│ ├── package.json
│ ├── tailwind.config.js
│ └── tsconfig.json
└── README.md

🚀 Setup Instructions
Prerequisites

Node.js v18+

MongoDB v5+

npm or yarn

Backend Setup
cd server
npm install
cp .env.example .env

Configure .env:

NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

Start MongoDB:

# Local service

mongod

# Or Docker

docker run -d -p 27017:27017 --name mongodb mongo:latest

Run the server:

# Dev mode

npm run dev

# Production

npm run build
npm start

Server runs at http://localhost:5000.

Frontend Setup
cd client
npm install
cp .env.example .env

Configure .env:

VITE_API_URL=http://localhost:5000/api

Run the frontend:

npm run dev

Client runs at http://localhost:5173.

Running Both Servers Concurrently
npm install -g concurrently
concurrently "cd server && npm run dev" "cd client && npm run dev"

🚀 Deployment (Render & Vercel)

Use MongoDB Atlas for production database

Deploy backend to Render, root = server/

Deploy frontend to Vercel, root = client/

Set production environment variables accordingly

Update CORS (CLIENT_URL) on backend

📚 API Documentation

Base URL: http://localhost:5000/api

Authentication

POST /auth/signup

{
"name": "John Doe",
"email": "john@example.com",
"password": "password123"
}

Response:

{
"success": true,
"token": "jwt_token_here",
"user": {
"id": "user_id",
"name": "John Doe",
"email": "john@example.com"
}
}

POST /auth/login - same as signup

GET /auth/me - Requires Authorization: Bearer <token>

Events (Auth Required)

GET /events - Fetch user events

POST /events - Create new event

PATCH /events/:id - Update event status

DELETE /events/:id - Delete (if not SWAP_PENDING)

Example POST body:

{
"title": "Team Meeting",
"startTime": "2024-12-20T10:00:00Z",
"endTime": "2024-12-20T11:00:00Z",
"status": "BUSY"
}

Swaps (Auth Required)

GET /swaps/available-slots

POST /swaps/request - Create swap

{
"mySlotId": "event_id_1",
"theirSlotId": "event_id_2"
}

GET /swaps/incoming / GET /swaps/outgoing

POST /swaps/:id/accept - Accept swap

POST /swaps/:id/reject - Reject swap

DELETE /swaps/:id - Cancel outgoing swap

🧪 Testing

Manual Flow:

Create two users (Alice, Bob)

Each creates SWAPPABLE events

Request swap via Marketplace

Accept or reject incoming swap

Verify events updated correctly

Edge Cases:

Concurrent requests

Deleted users with pending swaps

Network failures (transaction rollback)

Invalid JWT tokens

Permission violations

🔧 Design Decisions & Assumptions

Assumptions:

Event duration: any

Times stored in UTC

No overlap prevention

One swap request per slot pair

Events become BUSY after swap

Decisions:

MongoDB transactions for ACID

Status-based locking (SWAP_PENDING)

JWT in headers for SPA security

Polling (no real-time)

Minimal validation for UX simplicity

🚧 Challenges Faced

Transaction Handling: Ensured atomic swaps with rollback

Race Conditions: Prevented double-booking via status locks

State Management: Optimistic UI updates and refetching

Error Handling: Sanitized errors for production

🌟 Future Enhancements

Real-time notifications (WebSockets)

Calendar integration (Google/Outlook)

Advanced filtering by date/duration/user

Swap history & audit

Recurring events

Group swaps (multi-party)

Email notifications

Mobile app (React Native)

Analytics dashboard

Full testing suite

📝 Notes

Passwords hashed with bcrypt

JWT expires in 7 days

MongoDB indexes optimize queries

Rate limiting prevents brute force

CORS configured for frontend

Dates stored in ISO 8601

TypeScript provides type safety

📄 License

MIT License - SlotSwapper Demonstration

Questions: sanchitkumar2911@gmail.com
