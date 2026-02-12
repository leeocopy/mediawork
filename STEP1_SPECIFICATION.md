# STEP 1 SPECIFICATION - Social Media Management MVP

## ✅ STEP 1 CHECKLIST

### Pages & Routes
- [ ] `/login` - User authentication page
- [ ] `/signup` - New user registration page
- [ ] `/companies` - Company selector (workspace selection)
- [ ] `/forgot-password` - Password reset UI (no email functionality)
- [ ] `/app` - Placeholder dashboard page

### Authentication & Security
- [ ] JWT-based authentication system
- [ ] Password hashing with bcrypt
- [ ] Protected route middleware
- [ ] Session management
- [ ] Form validation (client + server)

### Data Models
- [ ] User model
- [ ] Company model
- [ ] CompanyMember model (junction table)

### API Endpoints
- [ ] `POST /api/auth/signup`
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/me`
- [ ] `GET /api/companies`

### UI Components
- [ ] AuthLayout component
- [ ] Input component with validation states
- [ ] Button component (primary, secondary, social)
- [ ] CompanyCard component
- [ ] EmptyState component
- [ ] LoadingSpinner component

### Testing Data
- [ ] 2 demo users
- [ ] 3 demo companies
- [ ] Company memberships setup

---

## 📄 PAGE SPECIFICATIONS

### 1. `/login` - Login Page

#### Layout Structure
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Sign In                            │
│  Welcome back! Enter your details   │
│                                     │
│  Email                              │
│  [input field]                      │
│                                     │
│  Password                           │
│  [input field] [👁️]                 │
│                                     │
│  [✓] Remember me    Forgot password?│
│                                     │
│  [Sign In Button]                   │
│                                     │
│  ──────── OR ────────               │
│                                     │
│  [Sign in with Google]              │
│  [Sign in with Facebook]            │
│                                     │
│  Don't have an account? Sign up     │
└─────────────────────────────────────┘
```

#### Components
- **AuthCard**: Centered card (max-width: 440px)
- **Logo**: Top-left or centered
- **InputField**: Email and password inputs
- **Checkbox**: "Remember me" option
- **Link**: "Forgot password?" (right-aligned)
- **Button**: Primary CTA "Sign In"
- **SocialButtons**: Google and Facebook OAuth
- **TextLink**: "Sign up" link

#### States
- **Default**: Clean form, all fields empty
- **Loading**: Disabled inputs, button shows spinner "Signing in..."
- **Error**: Red border on inputs, error message below submit button
- **Success**: Brief success state, then redirect to `/companies`

#### Microcopy
- **Heading**: "Sign In"
- **Subheading**: "Welcome back! Please enter your details"
- **Email placeholder**: "Enter your email"
- **Password placeholder**: "••••••••"
- **Submit button**: "Sign In"
- **Loading state**: "Signing in..."
- **Error examples**:
  - "Invalid email or password"
  - "Please fill in all fields"
  - "Email is not registered"
- **Footer text**: "Don't have an account? **Sign up**"

#### Behavior
1. Validate email format on blur
2. Show password toggle icon
3. On submit → POST `/api/auth/login`
4. On success → Store JWT → Redirect to `/companies`
5. On error → Display error message

---

### 2. `/signup` - Sign Up Page

#### Layout Structure
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Create Account                     │
│  Get started with your free account │
│                                     │
│  Full Name                          │
│  [input field]                      │
│                                     │
│  Email                              │
│  [input field]                      │
│                                     │
│  Password                           │
│  [input field] [👁️]                 │
│  • At least 8 characters            │
│                                     │
│  [✓] I agree to Terms & Privacy     │
│                                     │
│  [Create Account Button]            │
│                                     │
│  ──────── OR ────────               │
│                                     │
│  [Sign up with Google]              │
│  [Sign up with Facebook]            │
│                                     │
│  Already have an account? Sign in   │
└─────────────────────────────────────┘
```

#### Components
- Same as login page + **NameInput** + **PasswordRequirements**

#### States
- **Default**: Clean form
- **Validation**: Real-time password strength indicator
- **Loading**: "Creating account..."
- **Error**: Field-level and form-level errors
- **Success**: "Account created!" → Redirect to `/companies`

#### Microcopy
- **Heading**: "Create Account"
- **Subheading**: "Get started with your free account"
- **Name placeholder**: "Enter your full name"
- **Email placeholder**: "Enter your email"
- **Password placeholder**: "Create a password"
- **Password requirements**:
  - "At least 8 characters"
  - "Mix of letters and numbers"
  - "At least one special character"
- **Checkbox**: "I agree to the Terms of Service and Privacy Policy"
- **Submit button**: "Create Account"
- **Loading state**: "Creating account..."
- **Error examples**:
  - "Email already registered"
  - "Password too weak"
  - "Please accept terms and conditions"
- **Footer text**: "Already have an account? **Sign in**"

#### Behavior
1. Validate name (min 2 chars)
2. Validate email format
3. Real-time password strength check
4. Terms checkbox required
5. On submit → POST `/api/auth/signup`
6. On success → Auto-login → Redirect to `/companies`

---

### 3. `/companies` - Company Selector

#### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  [Logo]              [User Avatar] [Logout]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Select Your Workspace                          │
│  Choose a company to continue                   │
│                                                 │
│  [🔍 Search companies...]                       │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │[cover]   │  │[cover]   │  │[cover]   │     │
│  │  [logo]  │  │  [logo]  │  │  [logo]  │     │
│  │Company A │  │Company B │  │Company C │     │
│  │3 members │  │5 members │  │2 members │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Components
- **Header**: Logo + User menu
- **PageTitle**: "Select Your Workspace"
- **SearchInput**: Filter companies
- **CompanyCard**: Cover image, logo, name, member count
- **EmptyState**: When no companies or no search results

#### CompanyCard Specification
```
┌─────────────────────────┐
│  [Cover Image]          │  ← 240px × 120px, gradient or image
│                         │
│    [Logo Circle]        │  ← 64px circle, overlaps cover
│                         │
│    Company Name         │  ← 18px, font-weight: 600
│    X members            │  ← 14px, opacity: 0.7
│                         │
└─────────────────────────┘
```

#### States
- **Loading**: Show skeleton cards (3 placeholders)
- **Empty**: "No companies found" + "Create a company" button (disabled for Step 1)
- **Search - No Results**: "No companies match your search"
- **Default**: Grid of company cards (3 columns on desktop, 1 on mobile)
- **Hover**: Card elevates, slight scale (1.02)
- **Click**: Store `selectedCompanyId` in localStorage → Redirect to `/app`

#### Microcopy
- **Page title**: "Select Your Workspace"
- **Subtitle**: "Choose a company to continue"
- **Search placeholder**: "Search companies..."
- **Member count**: "X member" / "X members"
- **Empty state**: 
  - Title: "No companies yet"
  - Description: "You haven't been added to any companies. Contact your admin."
- **No search results**:
  - Title: "No companies found"
  - Description: "Try adjusting your search"

#### Behavior
1. On load → GET `/api/companies`
2. Filter cards by search input (client-side)
3. On card click → `localStorage.setItem('selectedCompanyId', id)` → Redirect to `/app`

---

### 4. `/forgot-password` - Password Reset (UI Only)

#### Layout Structure
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Forgot Password?                   │
│  Enter your email to reset          │
│                                     │
│  Email                              │
│  [input field]                      │
│                                     │
│  [Send Reset Link Button]           │
│                                     │
│  ← Back to Sign In                  │
└─────────────────────────────────────┘
```

#### States
- **Default**: Email input
- **Success (fake)**: "Check your email for reset link" message
- **Error (fake)**: "Email not found"

#### Microcopy
- **Heading**: "Forgot Password?"
- **Subheading**: "Enter your email and we'll send you a reset link"
- **Email placeholder**: "Enter your email"
- **Submit button**: "Send Reset Link"
- **Success message**: "✓ Check your email for a password reset link"
- **Back link**: "← Back to Sign In"

---

### 5. `/app` - Placeholder Dashboard

#### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  [Logo]  [Company Selector ▼]  [Avatar] [Logout]│
├─────────────────────────────────────────────────┤
│                                                 │
│              🚧 Coming Soon                     │
│                                                 │
│         Dashboard under construction            │
│                                                 │
│     [← Back to Company Selection]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Components
- **TopNav**: Logo, company dropdown, user menu
- **EmptyState**: Placeholder message

#### Microcopy
- **Message**: "🚧 Dashboard Coming Soon"
- **Subtitle**: "This feature is under construction"
- **Link**: "← Switch Company"

---

## 🗄️ DATA MODELS

### User Model
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // unique, indexed
  passwordHash: string;          // bcrypt hashed
  fullName: string;
  avatar?: string;               // URL to avatar image
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

**Indexes**:
- `email` (unique)
- `id` (primary key)

---

### Company Model
```typescript
interface Company {
  id: string;                    // UUID
  name: string;
  slug: string;                  // unique, URL-friendly
  logo?: string;                 // URL to logo image
  coverImage?: string;           // URL to cover image
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `id` (primary key)
- `slug` (unique)

---

### CompanyMember Model (Junction Table)
```typescript
interface CompanyMember {
  id: string;                    // UUID
  userId: string;                // FK → User.id
  companyId: string;             // FK → Company.id
  role: 'admin' | 'member';      // For future use (Step 2+)
  joinedAt: Date;
}
```

**Indexes**:
- `userId, companyId` (composite unique)
- `companyId` (for queries)

**Relationships**:
- User ↔ CompanyMember: One-to-Many
- Company ↔ CompanyMember: One-to-Many

---

## 🔌 API SPECIFICATION

### 1. POST /api/auth/signup

**Description**: Register a new user

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation**:
- `fullName`: 2-100 chars, required
- `email`: Valid email format, unique, required
- `password`: Min 8 chars, mix of letters/numbers/special, required

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-123",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": null
    }
  }
}
```

**Error Responses**:
- `400`: Validation errors
  ```json
  {
    "success": false,
    "error": "Validation failed",
    "details": {
      "email": "Email already registered",
      "password": "Password must be at least 8 characters"
    }
  }
  ```
- `500`: Server error

---

### 2. POST /api/auth/login

**Description**: Authenticate existing user

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-123",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": null
    }
  }
}
```

**Error Responses**:
- `401`: Invalid credentials
  ```json
  {
    "success": false,
    "error": "Invalid email or password"
  }
  ```
- `400`: Validation errors

---

### 3. POST /api/auth/logout

**Description**: Invalidate current session (if using session tokens)

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note**: For JWT, this is primarily client-side (remove token from storage)

---

### 4. GET /api/me

**Description**: Get current authenticated user

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": null,
    "createdAt": "2026-02-10T12:00:00Z"
  }
}
```

**Error Responses**:
- `401`: Unauthorized (invalid/expired token)

---

### 5. GET /api/companies

**Description**: Get companies the authenticated user belongs to

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "company-1",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "logo": "https://example.com/logos/acme.png",
      "coverImage": "https://example.com/covers/acme.jpg",
      "memberCount": 5,
      "userRole": "admin"
    },
    {
      "id": "company-2",
      "name": "TechStart Inc",
      "slug": "techstart-inc",
      "logo": "https://example.com/logos/techstart.png",
      "coverImage": null,
      "memberCount": 3,
      "userRole": "member"
    }
  ]
}
```

**Error Responses**:
- `401`: Unauthorized

---

## 🔒 VALIDATION RULES

### Email Validation
- **Format**: RFC 5322 compliant
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Max length**: 254 characters
- **Normalization**: Convert to lowercase
- **Error messages**:
  - Empty: "Email is required"
  - Invalid format: "Please enter a valid email address"
  - Already exists: "This email is already registered"

### Password Validation
- **Min length**: 8 characters
- **Max length**: 128 characters
- **Requirements**:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character `!@#$%^&*`
- **Error messages**:
  - Too short: "Password must be at least 8 characters"
  - Missing requirements: "Password must contain uppercase, lowercase, number, and special character"
  - Too common: "This password is too common, please choose a stronger one"

### Full Name Validation
- **Min length**: 2 characters
- **Max length**: 100 characters
- **Allowed chars**: Letters, spaces, hyphens, apostrophes
- **Error messages**:
  - Empty: "Full name is required"
  - Too short: "Full name must be at least 2 characters"
  - Invalid chars: "Full name can only contain letters, spaces, and hyphens"

---

## 🔐 SECURITY IMPLEMENTATION

### Password Hashing
- **Algorithm**: bcrypt
- **Salt rounds**: 12
- **Implementation**:
  ```javascript
  const bcrypt = require('bcrypt');
  
  // Hashing
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Verification
  const isValid = await bcrypt.compare(password, passwordHash);
  ```

### JWT Authentication
**Why JWT?**: Stateless, scalable, works well for API-first apps, easy to implement with modern frameworks.

**Token Structure**:
```javascript
{
  "userId": "uuid-123",
  "email": "john@example.com",
  "iat": 1675945200,
  "exp": 1676550000
}
```

**Implementation**:
```javascript
const jwt = require('jsonwebtoken');

// Generate token (expires in 7 days)
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Storage**: 
- Client: `localStorage` or `httpOnly cookie` (recommended)
- Server: Environment variable `JWT_SECRET` (min 256-bit random string)

**Token Lifecycle**:
1. Login/Signup → Generate JWT
2. Client stores in localStorage or receives httpOnly cookie
3. Every API request includes: `Authorization: Bearer <token>`
4. Server verifies token before processing request
5. Logout → Client removes token

### Protected Routes
**Middleware pattern**:
```javascript
// middleware/auth.js
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

**Protected routes**:
- `/api/me` → Requires auth
- `/api/companies` → Requires auth
- `/companies` page → Client-side redirect if no token

---

## 🎨 UI STYLE GUIDE

### Color Palette
```css
/* Primary Brand */
--primary-500: #4F46E5;        /* Indigo - primary actions */
--primary-600: #4338CA;        /* Hover state */
--primary-700: #3730A3;        /* Active state */

/* Neutrals */
--gray-50: #F9FAFB;            /* Backgrounds */
--gray-100: #F3F4F6;           /* Subtle backgrounds */
--gray-200: #E5E7EB;           /* Borders */
--gray-400: #9CA3AF;           /* Placeholder text */
--gray-600: #4B5563;           /* Secondary text */
--gray-900: #111827;           /* Primary text */

/* Semantic Colors */
--success-500: #10B981;        /* Success messages */
--error-500: #EF4444;          /* Error states */
--warning-500: #F59E0B;        /* Warnings */

/* Social */
--google: #4285F4;
--facebook: #1877F2;
```

### Typography Scale
```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 12px;    /* Captions, labels */
--text-sm: 14px;    /* Body small, form labels */
--text-base: 16px;  /* Body text */
--text-lg: 18px;    /* Subheadings */
--text-xl: 20px;    /* Card titles */
--text-2xl: 24px;   /* Page titles */
--text-3xl: 30px;   /* Hero headings */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System
```css
/* Base: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius
```css
--radius-sm: 6px;   /* Inputs, small buttons */
--radius-md: 8px;   /* Buttons, cards */
--radius-lg: 12px;  /* Large cards */
--radius-xl: 16px;  /* Modals */
--radius-full: 9999px; /* Pills, avatar */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

### Component Styles

#### Buttons
```css
/* Primary Button */
.btn-primary {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--primary-500);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-600);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background: var(--primary-700);
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Social Buttons */
.btn-social {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-social:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}
```

#### Input Fields
```css
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.input::placeholder {
  color: var(--gray-400);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input:disabled {
  background: var(--gray-50);
  cursor: not-allowed;
}

/* Error State */
.input.error {
  border-color: var(--error-500);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

#### Company Card
```css
.company-card {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.company-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.company-card__cover {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  object-fit: cover;
}

.company-card__logo {
  width: 64px;
  height: 64px;
  margin: -32px auto 16px;
  border-radius: var(--radius-full);
  border: 4px solid white;
  background: white;
  box-shadow: var(--shadow-md);
  object-fit: cover;
}

.company-card__name {
  padding: 0 16px;
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  text-align: center;
}

.company-card__meta {
  padding: 8px 16px 16px;
  font-size: var(--text-sm);
  color: var(--gray-600);
  text-align: center;
}
```

---

## 🌱 SEED DATA

### Users
```javascript
const users = [
  {
    id: 'user-1',
    email: 'sarah@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 12),
    fullName: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    lastLoginAt: new Date('2026-02-10')
  },
  {
    id: 'user-2',
    email: 'mike@example.com',
    passwordHash: bcrypt.hashSync('SecurePass456!', 12),
    fullName: 'Mike Chen',
    avatar: 'https://i.pravatar.cc/150?img=12',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
    lastLoginAt: new Date('2026-02-09')
  }
];
```

**Login credentials for testing**:
- Email: `sarah@example.com`, Password: `Password123!`
- Email: `mike@example.com`, Password: `SecurePass456!`

---

### Companies
```javascript
const companies = [
  {
    id: 'company-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    logo: 'https://ui-avatars.com/api/?name=Acme+Corp&background=4F46E5&color=fff&size=128',
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10')
  },
  {
    id: 'company-2',
    name: 'TechStart Inc',
    slug: 'techstart-inc',
    logo: 'https://ui-avatars.com/api/?name=TechStart&background=10B981&color=fff&size=128',
    coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-01-12')
  },
  {
    id: 'company-3',
    name: 'DesignHub',
    slug: 'designhub',
    logo: 'https://ui-avatars.com/api/?name=DesignHub&background=F59E0B&color=fff&size=128',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  }
];
```

---

### Company Memberships
```javascript
const memberships = [
  // Sarah belongs to all 3 companies
  { id: 'member-1', userId: 'user-1', companyId: 'company-1', role: 'admin', joinedAt: new Date('2026-01-10') },
  { id: 'member-2', userId: 'user-1', companyId: 'company-2', role: 'member', joinedAt: new Date('2026-01-12') },
  { id: 'member-3', userId: 'user-1', companyId: 'company-3', role: 'admin', joinedAt: new Date('2026-01-18') },
  
  // Mike belongs to 2 companies
  { id: 'member-4', userId: 'user-2', companyId: 'company-1', role: 'member', joinedAt: new Date('2026-01-15') },
  { id: 'member-5', userId: 'user-2', companyId: 'company-2', role: 'admin', joinedAt: new Date('2026-01-12') }
];
```

**Testing Scenarios**:
1. Login as `sarah@example.com` → See 3 companies
2. Login as `mike@example.com` → See 2 companies (Acme Corp, TechStart Inc)
3. Search "Tech" → Filter to TechStart Inc
4. Click any company → Save to localStorage → Redirect to `/app`

---

## 📋 IMPLEMENTATION NOTES

### Tech Stack Recommendations
- **Framework**: Next.js 14+ (App Router) or Vite + React Router
- **Database**: PostgreSQL or MongoDB
- **ORM**: Prisma (if PostgreSQL) or Mongoose (if MongoDB)
- **Auth**: NextAuth.js or custom JWT
- **Validation**: Zod or Yup
- **UI**: Vanilla CSS or Tailwind CSS
- **Icons**: Lucide React or Heroicons

### Folder Structure
```
/app
  /login
    page.tsx
  /signup
    page.tsx
  /companies
    page.tsx
  /forgot-password
    page.tsx
  /app
    page.tsx
  /api
    /auth
      /signup/route.ts
      /login/route.ts
      /logout/route.ts
    /me/route.ts
    /companies/route.ts
/components
  /auth
    AuthCard.tsx
    InputField.tsx
    SocialButton.tsx
  /companies
    CompanyCard.tsx
    CompanyGrid.tsx
  /common
    Button.tsx
    Logo.tsx
    LoadingSpinner.tsx
/lib
  /auth.ts          # JWT functions
  /validation.ts    # Validation schemas
  /db.ts            # Database connection
/styles
  globals.css       # Design tokens
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-256-bit-secret-key-here
NODE_ENV=development
```

---

## ✅ DEFINITION OF DONE

### Page Checklist
- [ ] All 5 pages render correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading states work
- [ ] Error states display properly
- [ ] Empty states show when needed
- [ ] All microcopy is implemented

### Authentication Checklist
- [ ] User can sign up with email/password
- [ ] User can log in with email/password
- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens are generated and stored
- [ ] Protected routes redirect to login
- [ ] User can log out

### Company Selection Checklist
- [ ] User sees only their companies
- [ ] Search filters companies
- [ ] Clicking card stores ID and redirects
- [ ] Member count displays correctly
- [ ] Empty state shows when no companies

### API Checklist
- [ ] All 5 endpoints work
- [ ] Request validation is enforced
- [ ] Error responses are consistent
- [ ] Authentication middleware works
- [ ] CORS is configured (if needed)

### Data Checklist
- [ ] Database schema created
- [ ] Seed data loads successfully
- [ ] Relationships work correctly
- [ ] Queries are optimized with indexes

### Testing Checklist
- [ ] Can sign up as new user
- [ ] Can log in as existing user
- [ ] Can see companies after login
- [ ] Can search and filter companies
- [ ] Can select company and reach `/app`
- [ ] Invalid credentials show error
- [ ] Form validation works

---

**End of Step 1 Specification**
