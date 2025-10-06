# HappyRobot Challenge - Backend API

Backend API for automated inbound carrier call handling with AI-powered negotiation, FMCSA verification, and real-time call activity tracking.

## 🌟 Features

- **FMCSA Carrier Verification**: Real-time carrier validation using FMCSA government API
- **Load Management**: Create, search, and manage freight loads with 13 required fields
- **Smart Negotiation Engine**:
  - Accepts offers ≤8% above loadboard rate
  - Progressive counter-offers (+3%, +5.5%)
  - Maximum 3 negotiation rounds before transfer
- **HappyRobot Integration**: Webhook endpoints for call completion data
- **Real-time Activity Tracking**: Live event logging for active calls
- **Database**: PostgreSQL with Prisma ORM
- **Security**: API key authentication on all endpoints (except `/health`)

## 📁 Project Structure

```
/
├── src/
│   ├── routes/
│   │   ├── carrier.routes.ts    # MC verification endpoints
│   │   ├── load.routes.ts       # Load CRUD & search
│   │   ├── negotiation.routes.ts # Negotiation logic
│   │   └── webhook.routes.ts    # HappyRobot webhooks
│   ├── services/
│   │   ├── fmcsa.service.ts     # FMCSA API integration
│   │   └── negotiation.service.ts # Negotiation business logic
│   └── index.ts                  # Express server
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Sample data seeder
├── data/
│   └── loads.json               # 25 sample loads
└── .env.example
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- FMCSA API key ([Get one here](https://mobile.fmcsa.dot.gov/developer/home.page))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your:
#   - DATABASE_URL (PostgreSQL connection string)
#   - FMCSA_API_KEY (FMCSA Web Key)
#   - API_KEY (Generate with: openssl rand -base64 32)

# Initialize database
npx prisma db push
npx prisma generate

# Seed sample data (25 loads)
npx prisma db seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production server
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db seed` - Seed database with sample loads

## 📡 API Endpoints

**Authentication**: All endpoints (except `/health`) require an `x-api-key` header.

### Health Check
```
GET /health  # Public endpoint (no API key required)
```

### Carrier Verification
```
POST /api/carrier/verify/:mc
```
Verify carrier MC number with FMCSA API

### Load Management
```
GET  /api/loads/search        # Search loads by criteria (query params: origin, destination, equipment_type)
GET  /api/loads/:loadId       # Get load by ID
```

### Negotiation
```
POST /api/negotiation/evaluate      # Evaluate carrier offer
POST /api/negotiation/accept-load   # Accept load (direct or post-negotiation)
GET  /api/negotiation/history/:call_id   # Get negotiation history for a call
GET  /api/negotiation/load/:load_id      # Get negotiation history for a load
```

### Webhooks
```
POST /api/webhooks/happyrobot   # HappyRobot call completion webhook
GET  /api/webhooks/calls        # Get all calls
GET  /api/webhooks/calls/:id    # Get call by ID
```

### Dashboard
```
GET /api/dashboard/activity     # Get real-time call activity (query param: run_id)
```

**Note**: The backend also has `/api/dashboard/metrics` and `/api/dashboard/sessions` endpoints available, but they are not currently used by the dashboard frontend.

## 🗄️ Database Schema

**Load**: Freight load details (13 required fields)
**Negotiation**: Negotiation round history
**Call**: Complete call data from HappyRobot
**CallActivity**: Real-time event tracking (MC_VERIFIED, LOAD_SEARCHED, NEGOTIATION_ROUND, etc.)

## 🔗 Related Projects

- **Dashboard**: [happyrobot-dashboard](../happyrobot-dashboard) - Real-time Next.js dashboard for monitoring call activity

## 📝 License

MIT
