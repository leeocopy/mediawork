# Social Media Manager MVP - Step 1

AI-powered social media content management platform with multi-company workspace support.

## ✅ Step 1 Complete

This is **Step 1** of the MVP, focusing on authentication and workspace selection.

### Features Implemented

- ✅ **Authentication System**
  - Login page with email/password
  - Signup page with validation
  - JWT-based authentication
  - Password hashing with bcrypt
  - Protected routes

- ✅ **Company Workspace Selection**
  - View companies user belongs to
  - Search/filter companies
  - Select workspace (stored in localStorage)
  - Company cards with cover images and logos

- ✅ **Pages**
  - `/login` - User login
  - `/signup` - User registration
  - `/companies` - Workspace selector
  - `/forgot-password` - Password reset UI (no email sending)
  - `/app` - Placeholder dashboard

- ✅ **API Endpoints**
  - `POST /api/auth/signup` - Create new user
  - `POST /api/auth/login` - Authenticate user
  - `POST /api/auth/logout` - Logout (client-side)
  - `GET /api/me` - Get current user
  - `GET /api/companies` - Get user's companies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

### Demo Credentials

**User 1:**
- Email: `sarah@example.com`
- Password: `Password123!`
- Companies: 3 (Acme Corp, TechStart Inc, DesignHub)

**User 2:**
- Email: `mike@example.com`
- Password: `SecurePass456!`
- Companies: 2 (Acme Corp, TechStart Inc)

## 🗂️ Project Structure

```
createcont/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── logout/route.ts
│   │   ├── me/route.ts
│   │   └── companies/route.ts
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── companies/page.tsx
│   ├── forgot-password/page.tsx
│   ├── app/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts         # JWT utilities
│   ├── db.ts           # Mock database
│   └── validation.ts   # Zod schemas
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── STEP1_SPECIFICATION.md
```

## 📋 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **Database:** In-memory mock (Step 1 only)

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- Protected API routes with authentication middleware
- Client-side route protection
- Input validation (client + server)

## 🎨 Design System

The app uses a consistent design system defined in `globals.css`:

- **Primary Color:** Indigo (#4F46E5)
- **Typography:** Inter font family
- **Spacing:** 4px base system
- **Components:** Reusable button and input styles

## 📝 Data Models

### User
```typescript
{
  id: string
  email: string
  passwordHash: string
  fullName: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

### Company
```typescript
{
  id: string
  name: string
  slug: string
  logo?: string
  coverImage?: string
  createdAt: Date
  updatedAt: Date
}
```

### CompanyMember
```typescript
{
  id: string
  userId: string
  companyId: string
  role: 'admin' | 'member'
  joinedAt: Date
}
```

## 🔄 User Flow

1. User visits root `/` → Redirects to `/login`
2. User logs in or signs up
3. On success → Redirects to `/companies`
4. User selects a company workspace
5. Selected company ID stored in localStorage
6. User redirected to `/app` (placeholder dashboard)

## ⏭️ Next Steps (Step 2+)

Features NOT implemented in Step 1:
- ❌ Content calendar
- ❌ Post creation UI
- ❌ AI content generation
- ❌ Media uploads
- ❌ Role-based permissions (infrastructure ready)
- ❌ Real database (PostgreSQL)
- ❌ Email sending
- ❌ Social OAuth (Google/Facebook)

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign up with new account
- [ ] Login with existing account
- [ ] View companies after login
- [ ] Search companies
- [ ] Select a company
- [ ] Logout
- [ ] Forgot password flow (UI only)
- [ ] Invalid credentials error
- [ ] Form validation errors
- [ ] Protected route redirect

### Test Scenarios

1. **New User Registration:**
   - Go to `/signup`
   - Enter: Name, Email, Password
   - Accept terms
   - Submit → Auto-login → See companies

2. **Existing User Login:**
   - Go to `/login`
   - Use demo credentials
   - Submit → See companies

3. **Company Selection:**
   - Search for specific company
   - Click company card
   - Redirect to `/app` placeholder

## 📄 API Documentation

See `STEP1_SPECIFICATION.md` for complete API specs including:
- Request/response formats
- Validation rules
- Error codes
- Example payloads

## 🐛 Known Limitations (Step 1)

- Mock in-memory database (data resets on server restart)
- No actual email sending
- Social login buttons disabled
- No real-time updates
- No database persistence
- No image uploads

## 📖 Documentation

- **Full Specification:** See `STEP1_SPECIFICATION.md`
- **API Docs:** Included in specification
- **Design System:** See `app/globals.css`

## 🤝 Contributing

This is an MVP in active development. Step 2 will add:
- Real database (PostgreSQL + Prisma)
- Content calendar
- Post creation
- AI generation
- Media library

## 🚀 Deployment Notes (SQLite vs Postgres)

### Vercel Deployment

This application is configured for deployment on Vercel. Because Vercel uses serverless functions, there are important considerations regarding data persistence:

#### Option 1: Production (Recommended) - PostgreSQL
For a persistent production environment, use a managed PostgreSQL provider (e.g., Neon, Supabase, or Railway).
1.  Update `datasource db` in `prisma/schema.prisma` to use `provider = "postgresql"`.
2.  Set `DATABASE_URL` in Vercel environment variables to your Postgres connection string.
3.  Set the Vercel Build Command to: `npm run vercel-build`.

#### Option 2: Quick Demo (Non-persistent) - SQLite
If you choose to use SQLite for a quick demo on Vercel:
- **Data will NOT persist:** Every time the serverless function cold starts or a new deployment is made, the database will be reset to its initial state.
- **Uploads will NOT persist:** Files saved to `public/uploads` will be lost when the function instance is recycled.
- **DATABASE_URL:** Set to `file:./prisma/dev.db`.

### Environment Variables
The following environment variables must be set in Vercel:
- `JWT_SECRET`: A strong random string for signing tokens.
- `DATABASE_URL`: Your database connection string.
- `NODE_ENV`: `production`.

### Uploads / Assets
Local file storage (`/uploads`) is not persistent on Vercel. For production, it is recommended to use:
- **Cloudinary / S3 / Supabase Storage** for asset persistence.
- Update `lib/upload.ts` to use a cloud provider's SDK.

---

**Step 1 Status:** ✅ Complete  
**Next:** Step 2 - Content Calendar & Post Creation
