# 🛒 Urbexon — Production-Ready Multi-Vendor E-Commerce

A complete Flipkart + Blinkit style dual-commerce system built on MERN stack.

## 🏗️ Architecture

```
urbexon-production/
├── backend/          → Node.js + Express + MongoDB API (Port 9000)
├── client/           → User-facing storefront (Port 5173)
├── admin/            → Admin control panel (Port 5174)
├── vendor-panel/     → Vendor dashboard (Port 5175)
├── delivery-panel/   → Delivery partner app (Port 5176)
└── docker-compose.yml
```

## ⚡ Dual Commerce System

| Feature | Main E-Commerce | Urbexon Hour |
|---------|----------------|--------------|
| Products created by | Admin only | Vendor only |
| `productType` | `ecommerce` | `urbexon_hour` |
| Delivery | Shiprocket (Pan-India) | Local rider (45-120 min) |
| API | `GET /api/products` | `GET /api/products/urbexon-hour` |
| Cart | Shared cart (type guard) | Same cart, blocks mixing |

## 🚀 Quick Start (Development)

### 1. Backend
```bash
cd backend
cp .env.example .env       # Fill in your values
npm install
npm run create-admin        # Create first admin account
npm run dev                 # Starts on port 9000
```

### 2. All Frontends (separate terminals)
```bash
# Client
cd client && cp .env.example .env && npm install && npm run dev

# Admin (port 5174)
cd admin && cp .env.example .env && npm install && npm run dev -- --port 5174

# Vendor Panel (port 5175)
cd vendor-panel && cp .env.example .env && npm install && npm run dev -- --port 5175

# Delivery Panel (port 5176)
cd delivery-panel && cp .env.example .env && npm install && npm run dev -- --port 5176
```

## 🐳 Docker (Production)

```bash
# Copy and fill backend .env
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

Services will be available at:
- Client: http://localhost:5173
- Admin: http://localhost:5174
- Vendor: http://localhost:5175
- Delivery: http://localhost:5176
- API: http://localhost:9000

## 🔑 Required Environment Variables (backend/.env)

```env
NODE_ENV=production
PORT=9000
MONGO_URI=mongodb+srv://...
JWT_SECRET=minimum_32_character_secret_key_here

# Frontend URLs (for CORS)
FRONTEND_URL=https://yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com
VENDOR_FRONTEND_URL=https://vendor.yourdomain.com
DELIVERY_FRONTEND_URL=https://delivery.yourdomain.com

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Razorpay (payments)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret

# Shiprocket (shipping)
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=yourpassword
```

## 👤 User Roles

| Role | Access |
|------|--------|
| `user` | Shopping, orders, wishlist |
| `vendor` | Vendor panel — UH products, orders, earnings |
| `delivery_boy` | Delivery panel — accept orders, OTP delivery |
| `admin` | Full admin panel |
| `owner` | Admin + owner-only actions |

## 📦 Key Features

- ✅ JWT auth with OTP email verification
- ✅ Razorpay online payment + COD
- ✅ Atomic stock management (race-condition safe)
- ✅ Coupon / promo code system
- ✅ OTP delivery confirmation
- ✅ Real-time order updates (SSE + WebSocket)
- ✅ Vendor application + admin approval
- ✅ Delivery partner system with GPS tracking
- ✅ Wishlist
- ✅ Product reviews + ratings
- ✅ Refund + return lifecycle
- ✅ Invoice PDF generation
- ✅ Admin analytics dashboard
- ✅ NoSQL injection protection (mongo-sanitize)
- ✅ Rate limiting, Helmet security headers
- ✅ Docker ready

## 🔐 Security

- JWT secret validated at startup (won't start without it)
- `express-mongo-sanitize` on all inputs
- XSS clean middleware
- Helmet.js security headers
- Rate limiting on auth (30/15min) and public (200/min) endpoints
- File upload validation (type + size)
- Server-side pricing (frontend prices ignored)

## 📊 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
POST /api/auth/refresh
GET  /api/auth/profile
```

### Products
```
GET  /api/products              → Main ecommerce products
GET  /api/products/urbexon-hour → Urbexon Hour products
GET  /api/products/homepage     → Homepage featured/deals
GET  /api/products/:id          → Single product
POST /api/products/admin        → Admin create
POST /api/products/vendor       → Vendor create (UH only)
```

### Orders
```
POST  /api/orders               → Place COD order
POST  /api/orders/pricing       → Get server pricing
GET   /api/orders/my            → My orders
GET   /api/orders/:id           → Order detail
PATCH /api/orders/:id/cancel    → Cancel order
```

### Delivery
```
POST  /api/delivery/register
PATCH /api/delivery/toggle-status
GET   /api/delivery/orders
PATCH /api/delivery/orders/:id/accept
PATCH /api/delivery/orders/:id/deliver  → Requires OTP
GET   /api/delivery/earnings
PATCH /api/delivery/location
```

### Coupons
```
POST /api/coupons/validate      → Validate at checkout
GET  /api/coupons/admin         → Admin list
POST /api/coupons/admin         → Admin create
```
