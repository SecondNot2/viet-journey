# Travel Website - Viet Journey

Ứng dụng đặt tour du lịch, khách sạn, vé máy bay và phương tiện di chuyển tại Việt Nam.

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Supabase Account (for database)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd travel-website

# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
cp .env.example .env
cp .env.example backend/.env
# Edit .env files with your Supabase credentials

# Start development
npm start
```

Ứng dụng sẽ chạy tại:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
travel-website/
├── backend/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── modules/           # Feature modules (Modular Monolith)
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── tours/         # Tours
│   │   │   ├── hotels/        # Hotels
│   │   │   ├── flights/       # Flights
│   │   │   ├── bookings/      # Bookings
│   │   │   ├── destinations/  # Destinations
│   │   │   ├── blogs/         # Blogs
│   │   │   ├── transport/     # Transport
│   │   │   ├── promotions/    # Promotions
│   │   │   └── reviews/       # Reviews
│   │   ├── shared/            # Shared utilities
│   │   │   ├── config/        # App config
│   │   │   ├── database/      # Supabase connection
│   │   │   ├── middleware/    # Auth middleware
│   │   │   └── utils/         # Response & validation utils
│   │   └── app.js             # Express app setup
│   └── server.js              # Entry point
│
├── src/                        # Frontend (React)
│   ├── api/                   # API service layer
│   ├── components/            # React components
│   ├── shared/                # Shared hooks, utils, constants
│   ├── contexts/              # React contexts
│   └── App.js                 # App entry
│
├── docs/                       # Documentation
│   ├── guides/                # How-to guides
│   └── ARCHITECTURE.md        # System architecture
│
└── package.json
```

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT + bcryptjs
- **File Upload**: Multer

### Frontend

- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Recharts

## 🔑 Environment Variables

Create `.env` files in both root and `backend/` directories:

```env
# Backend (backend/.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-jwt-secret
PORT=5000

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **IMPORTANT**: Never commit `.env` files to version control!

## 📖 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Development Guides](./docs/guides/)

## 📄 License

Private - All rights reserved.
