# ClinicQueue Backend API

Express.js backend for the ClinicQueue patient management system.

## Features

- **JWT Authentication** for staff members
- **Patient Check-in** with automated triage scoring
- **Queue Management** with real-time updates
- **Role-based Authorization** (doctor, nurse, receptionist, admin)
- **Comprehensive Testing** with Jest
- **TypeScript** for type safety

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
Setup environment

bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
Seed database (development)

bash
npm run seed
Start development server

bash
npm run dev
API Documentation
Authentication
POST /api/auth/login - Staff login

POST /api/auth/register - Staff registration

POST /api/auth/verify - Token verification

Visits
POST /api/visits/check-in - Patient check-in (public)

GET /api/visits/:id - Get visit details

GET /api/visits/stats/overview - Visit statistics

Testing
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test files
npm test -- src/tests/unit/triage.test.ts

# Run with coverage
npm test -- --coverage

# Run integration tests only
npm test -- src/tests/integration/

# Run unit tests only  
npm test -- src/tests/unit/

Deployment
# Build for production
npm run build

# Start production server
npm start