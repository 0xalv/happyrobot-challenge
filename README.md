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

## 🐳 Docker (Production)

Run the entire stack (PostgreSQL + API) with Docker:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Environment Variables**: Docker Compose reads from `.env` file for `FMCSA_API_KEY` and `API_KEY`.

The Docker setup:
- Automatically runs database migrations on startup
- Uses PostgreSQL 16 Alpine for the database
- Exposes API on port 3001
- Includes health checks for both services

## Railway Deployment (Production)

Deploy the backend API to Railway cloud platform with managed PostgreSQL.

### Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository with your code
- FMCSA API key

### Deployment Steps

**1. Create Railway Account**
- Sign up at https://railway.app
- Connect your GitHub account

**2. Import Project**
- Click "New Project" > "Deploy from GitHub repo"
- Select your `happyrobot-challenge` repository
- Railway will automatically detect the Node.js project

**3. Add PostgreSQL Database**
- In your project dashboard, click "New" > "Database" > "PostgreSQL"
- Railway will provision a managed PostgreSQL instance
- Database credentials are automatically generated

**4. Configure Environment Variables**
- Go to your backend service settings > "Variables" tab
- Add the following variables:
  - `DATABASE_URL`: Copy from the PostgreSQL service (Railway auto-links this)
  - `API_KEY`: Generate a secure key (e.g., `openssl rand -base64 32`)
  - `FMCSA_API_KEY`: Your FMCSA Web Key
  - `PORT`: 3001 (optional, Railway sets this automatically)
- Click "Save" after adding each variable

**5. Deploy Project**
- Railway automatically builds and deploys your project
- The `start.sh` script handles database schema setup automatically via `npx prisma db push`
- No manual migration steps needed - everything happens on deployment

**6. Generate Public URL**
- Go to service "Settings" > "Networking"
- Click "Generate Domain" to create a public URL
- Your API will be available at `https://your-project.up.railway.app`

**7. Update HappyRobot Webhook**
- Copy your Railway public URL
- Go to the HappyRobot agent and change the webhooks endpoint URL to: `https://your-project.up.railway.app/api/webhooks/happyrobot`
- Add custom header: `x-api-key: YOUR_API_KEY`

**8. Verify Deployment**
- Test health endpoint: `curl https://your-project.up.railway.app/health`
- Test carrier verification:
  ```bash
  curl -X POST https://your-project.up.railway.app/api/carrier/verify/139932 \
    -H "x-api-key: YOUR_API_KEY"
  ```

### Accessing Your Deployment

**Production API:** Your generated Railway domain (e.g., `https://happyrobot-challenge-production.up.railway.app`)

**Database Access:**
- Use Railway's PostgreSQL connection string from the Variables tab
- Or use Prisma Studio locally by updating your `.env` with production `DATABASE_URL`

**Monitoring:**
- Railway dashboard shows real-time logs, metrics, and deployment status
- Access logs via the "Deployments" tab

### Troubleshooting

**Database Connection Issues:**
- Verify `DATABASE_URL` is set correctly in environment variables
- Ensure Prisma migrations ran successfully
- Check if PostgreSQL service is running in Railway dashboard

**Webhook Not Working:**
- Confirm API is accessible via health check endpoint
- Verify `x-api-key` header is configured in HappyRobot
- Check Railway logs for incoming webhook requests

**Environment Variable Updates:**
- After changing variables, Railway automatically redeploys
- Wait for deployment to complete before testing

### Railway CLI (Optional)

Install Railway CLI for advanced management:
```bash
npm i -g @railway/cli
railway login
railway link  # Link to your project
railway logs  # View real-time logs
railway run npx prisma studio  # Run Prisma Studio against production DB
```

---

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
GET  /api/negotiation/history/:run_id    # Get negotiation history for a run
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
