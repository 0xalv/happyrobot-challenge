# HappyRobot Challenge - Inbound Carrier Sales API

Automated inbound carrier call handling with AI-powered negotiation, FMCSA verification, and real-time analytics.

## 📁 Project Structure

```
/
├── challenge-context/   # Challenge documentation
│   ├── challenges.md
│   └── email.md
├── data/               # Sample data
│   └── loads.json     # 25 sample loads
├── src/               # Source code
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   └── prisma/        # Database schema & seed
├── package.json
├── tsconfig.json
├── .env.example
└── PROGRESS.md        # Development progress tracker
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- FMCSA API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and FMCSA API key

# Run development server
npm run dev
```

### Available Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run development server
- `npm run start` - Run production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data

## 📊 Progress

See [PROGRESS.md](./PROGRESS.md) for detailed development progress and next steps.

## 🎯 Objective 1: Inbound Use Case

Implementing:
- ✅ Project setup & structure
- ⏳ FMCSA carrier verification
- ⏳ Load search & matching
- ⏳ Automated negotiation (±8%, max 3 rounds)
- ⏳ Call classification & sentiment analysis
- ⏳ HappyRobot webhook integration

## 📝 License

MIT
