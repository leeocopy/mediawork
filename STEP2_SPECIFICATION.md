# STEP 2 SPECIFICATION - Calendar Dashboard & Posts

## ✅ STEP 2 CHECKLIST

### Pages & Routes
- [ ] `/app` - Calendar Dashboard (replace placeholder)
- [ ] `/companies` - Company switcher (existing, keep as-is)

### Calendar Features
- [ ] Month view (default)
- [ ] Week view toggle
- [ ] Date cells with post cards
- [ ] Company name in header
- [ ] "Switch Company" button
- [ ] Platform filter (Instagram, Facebook, LinkedIn)
- [ ] Status filter (Planned, Draft)
- [ ] "+ Add Post" button
- [ ] Click date to add post
- [ ] Navigate prev/next month

### Post Management
- [ ] Create Post modal
- [ ] Post Details drawer/modal
- [ ] Delete post
- [ ] Edit post (optional)
- [ ] Calendar refresh after actions

### Data Model
- [ ] Post table with all fields
- [ ] Proper indexes
- [ ] Enums for platform, type, status

### API Endpoints
- [ ] `GET /api/companies/:companyId/posts`
- [ ] `POST /api/companies/:companyId/posts`
- [ ] `GET /api/posts/:postId`
- [ ] `PUT /api/posts/:postId`
- [ ] `DELETE /api/posts/:postId`

### Security
- [ ] Auth required for all endpoints
- [ ] Company membership validation
- [ ] selectedCompanyId validation

---

## 📱 UI SPECIFICATION - /app (Calendar Dashboard)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  [Company Name ▼]          [Avatar] [Logout]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ← February 2026 →    [Month] [Week]    [+ Add Post]       │
│                                                              │
│  Filters: [All Platforms ▼] [All Status ▼]                 │
│                                                              │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐              │
│  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │              │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤              │
│  │     │     │     │  1  │  2  │  3  │  4  │              │
│  │     │     │     │[pos]│     │     │     │              │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤              │
│  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │              │
│  │[pos]│     │[pos]│     │     │     │     │              │
│  │[pos]│     │     │     │     │     │     │              │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components Breakdown

#### 1. Header
- **Logo**: Social Media Manager (clickable → /companies)
- **Company Dropdown**: Shows selected company name, click to switch
- **User Avatar**: User initials
- **Logout Button**: Standard logout

#### 2. Calendar Controls Bar
```
[← February 2026 →]    [Month] [Week]    [+ Add Post]
```
- **Month Navigator**: Previous/Next arrows + current month/year
- **View Toggle**: Button group (Month active, Week inactive)
- **Add Post Button**: Primary CTA

#### 3. Filters Bar
```
Filters: [All Platforms ▼] [All Status ▼]
```
- **Platform Dropdown**: All, Instagram, Facebook, LinkedIn
- **Status Dropdown**: All, Planned, Draft

#### 4. Calendar Grid

**Month View:**
- 7 columns (Mon-Sun)
- 5-6 rows (weeks)
- Cell height: ~120px
- Date number in top-left corner
- Post cards stacked vertically

**Week View:**
- 7 columns (Mon-Sun)
- Full day height (~400px)
- Hourly grid (optional, or just all-day events)
- More post cards visible per day

#### Post Card (in Calendar Cell)
```
┌─────────────────────────┐
│ 🟣 IG  │  PLANNED       │
│ Product Launch          │
│ Promo                   │
└─────────────────────────┘
```
- **Platform Badge**: Icon + text (🟣 IG, 🔵 FB, 🔷 LI)
- **Status Badge**: Pill shape, color-coded
- **Title**: 1 line, truncated
- **Type**: Small text below title
- **Hover**: Slight elevation
- **Click**: Opens Post Details modal

---

## 🗂️ DATA MODEL - Posts Table

### Post Schema

```typescript
interface Post {
  id: string;                    // UUID
  companyId: string;             // FK → companies.id
  date: string;                  // YYYY-MM-DD format
  platform: Platform;            // enum
  postType: PostType;            // enum
  title: string;                 // Display name
  notes?: string;                // Optional description
  status: PostStatus;            // enum
  createdBy: string;             // FK → users.id
  createdAt: Date;
  updatedAt: Date;
}

enum Platform {
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
  LINKEDIN = 'LinkedIn'
}

enum PostType {
  PROMO = 'Promo',
  EDUCATIONAL = 'Educational',
  ANNOUNCEMENT = 'Announcement',
  TESTIMONIAL = 'Testimonial'
}

enum PostStatus {
  PLANNED = 'Planned',
  DRAFT = 'Draft'
}
```

### Indexes
- Primary: `id`
- Composite: `(companyId, date)` - for calendar queries
- Foreign keys: `companyId` → companies, `createdBy` → users

---

## 🔌 API SPECIFICATION

### 1. GET /api/companies/:companyId/posts

**Description**: Fetch posts for a company within date range

**URL Parameters**:
- `companyId` (string, required) - Company ID

**Query Parameters**:
- `startDate` (string, required) - YYYY-MM-DD
- `endDate` (string, required) - YYYY-MM-DD
- `platform` (string, optional) - Filter by platform
- `status` (string, optional) - Filter by status

**Request Example**:
```
GET /api/companies/company-1/posts?startDate=2026-02-01&endDate=2026-02-29
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "post-1",
      "companyId": "company-1",
      "date": "2026-02-05",
      "platform": "Instagram",
      "postType": "Promo",
      "title": "Product Launch",
      "notes": "New feature announcement",
      "status": "Planned",
      "createdBy": "user-1",
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `401`: Unauthorized (no token or invalid token)
- `403`: Forbidden (user not member of company)
- `400`: Bad request (invalid date format)

---

### 2. POST /api/companies/:companyId/posts

**Description**: Create a new post

**Request Body**:
```json
{
  "date": "2026-02-10",
  "platform": "Instagram",
  "postType": "Promo",
  "title": "Weekend Sale",
  "notes": "50% off all items"
}
```

**Validation**:
- `date`: Required, YYYY-MM-DD format
- `platform`: Required, valid Platform enum
- `postType`: Required, valid PostType enum
- `title`: Required, 3-100 chars
- `notes`: Optional, max 1000 chars

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "post-123",
    "companyId": "company-1",
    "date": "2026-02-10",
    "platform": "Instagram",
    "postType": "Promo",
    "title": "Weekend Sale",
    "notes": "50% off all items",
    "status": "Planned",
    "createdBy": "user-1",
    "createdAt": "2026-02-10T14:30:00Z",
    "updatedAt": "2026-02-10T14:30:00Z"
  }
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden (not company member)
- `400`: Validation errors

---

### 3. GET /api/posts/:postId

**Description**: Get post details

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "post-1",
    "companyId": "company-1",
    "date": "2026-02-05",
    "platform": "Instagram",
    "postType": "Promo",
    "title": "Product Launch",
    "notes": "New feature announcement",
    "status": "Planned",
    "createdBy": "user-1",
    "createdAt": "2026-02-01T10:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z"
  }
}
```

---

### 4. PUT /api/posts/:postId

**Description**: Update post

**Request Body**:
```json
{
  "date": "2026-02-11",
  "platform": "Facebook",
  "title": "Updated Title",
  "status": "Draft"
}
```

**Response (200 OK)**: Updated post object

---

### 5. DELETE /api/posts/:postId

**Description**: Delete post

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 🎨 UI COMPONENTS SPEC

### Create Post Modal

```
┌─────────────────────────────────────┐
│  Create Post                    [×] │
├─────────────────────────────────────┤
│                                     │
│  Date *                             │
│  [2026-02-10        📅]            │
│                                     │
│  Platform *                         │
│  ○ Instagram  ○ Facebook  ○ LinkedIn│
│                                     │
│  Post Type *                        │
│  [Promo            ▼]              │
│                                     │
│  Title *                            │
│  [Product Launch...]                │
│                                     │
│  Notes                              │
│  [Optional description...           │
│   (textarea)                    ]   │
│                                     │
│         [Cancel]  [Create Post]     │
└─────────────────────────────────────┘
```

**Fields**:
1. **Date** - Date picker, defaults to clicked date or today
2. **Platform** - Radio buttons with icons
3. **Post Type** - Dropdown (Promo, Educational, Announcement, Testimonial)
4. **Title** - Text input, max 100 chars
5. **Notes** - Textarea, max 1000 chars

**Validation**:
- All fields except notes are required
- Show inline errors
- Disable submit if invalid

**Actions**:
- Cancel → Close modal
- Create Post → POST to API → Close modal → Refresh calendar

---

### Post Details Modal

```
┌─────────────────────────────────────┐
│  Post Details               [Edit] [×]│
├─────────────────────────────────────┤
│                                     │
│  Product Launch                     │
│  📅 February 10, 2026               │
│                                     │
│  🟣 Instagram  │  Promo             │
│  🟢 Planned                         │
│                                     │
│  Notes:                             │
│  "50% off all items this weekend.   │
│   Limited time offer!"              │
│                                     │
│  Created by: Sarah Johnson          │
│  Created: Feb 10, 2026 2:30 PM      │
│                                     │
│         [Delete]          [Close]   │
└─────────────────────────────────────┘
```

**Sections**:
1. **Title** - Large, bold
2. **Date** - With calendar icon
3. **Platform & Type** - Badges inline
4. **Status** - Color-coded pill
5. **Notes** - Full text, scrollable
6. **Metadata** - Created by, timestamp

**Actions**:
- Edit → Switch to edit mode (optional Step 2)
- Delete → Confirm → DELETE to API → Close → Refresh
- Close → Just close modal

---

## 📊 FRONTEND DATA FLOW

### Calendar State Management

```typescript
interface CalendarState {
  currentDate: Date;          // Selected month/week
  viewMode: 'month' | 'week'; // Current view
  selectedCompanyId: string;  // From localStorage
  posts: Post[];              // Fetched posts
  filters: {
    platform?: Platform;
    status?: PostStatus;
  };
  loading: boolean;
  error?: string;
}
```

### Date Range Calculation

**Month View:**
```typescript
const getMonthRange = (date: Date) => {
  const start = startOfMonth(date);  // 2026-02-01
  const end = endOfMonth(date);      // 2026-02-29
  return { start, end };
};
```

**Week View:**
```typescript
const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });     // Sunday
  return { start, end };
};
```

### Data Fetching Flow

1. Component mounts → Check auth → Check selectedCompanyId
2. Calculate date range based on currentDate + viewMode
3. Fetch posts: `GET /api/companies/${companyId}/posts?startDate=...&endDate=...`
4. Apply filters client-side (or pass to API)
5. Group posts by date for calendar rendering

### Refresh Triggers

- **Create Post**: After successful POST → Refetch posts
- **Delete Post**: After successful DELETE → Refetch posts
- **Edit Post**: After successful PUT → Refetch posts
- **Change Month**: Navigate prev/next → Refetch with new range
- **Change View**: Month ↔ Week → Refetch with new range
- **Change Filters**: Apply filters → Re-render (no refetch needed)

---

## 🎯 UI STATES & EMPTY STATES

### Loading State
```
┌─────────────────────┐
│   [Spinner]         │
│   Loading calendar  │
└─────────────────────┘
```

### Empty State (No Posts in Range)
```
┌─────────────────────────────┐
│        📅                   │
│   No posts scheduled        │
│   for this period           │
│                             │
│   [+ Add Your First Post]   │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│   ⚠️ Failed to load posts   │
│   [Retry]                   │
└─────────────────────────────┘
```

### No Company Selected
```
Redirect to /companies
```

---

## 🔒 SECURITY & VALIDATION

### Route Protection

```typescript
// /app page
useEffect(() => {
  const token = localStorage.getItem('token');
  const companyId = localStorage.getItem('selectedCompanyId');
  
  if (!token) {
    router.push('/login');
    return;
  }
  
  if (!companyId) {
    router.push('/companies');
    return;
  }
  
  fetchPosts(companyId);
}, []);
```

### API Middleware

```typescript
// In each endpoint
async function verifyCompanyMembership(userId: string, companyId: string) {
  const membership = db.companyMembers.find(
    m => m.userId === userId && m.companyId === companyId
  );
  
  if (!membership) {
    throw new Error('Forbidden: Not a member of this company');
  }
}
```

---

## 🧪 TEST PLAN

### Test Scenario 1: View Calendar

**Steps**:
1. Login as `sarah@example.com`
2. Select "Acme Corp" from companies
3. Redirected to `/app`
4. See calendar for current month
5. Navigate to next/previous month
6. Toggle to Week view

**Expected**:
- ✅ Calendar loads with current month
- ✅ Company name shows "Acme Corp" in header
- ✅ No posts initially (empty state)
- ✅ Month navigation works
- ✅ Week view shows 7 days

---

### Test Scenario 2: Create Post

**Steps**:
1. On calendar, click "+ Add Post"
2. Fill form:
   - Date: 2026-02-15
   - Platform: Instagram
   - Type: Promo
   - Title: "Valentine's Day Sale"
   - Notes: "Limited time offer"
3. Click "Create Post"

**Expected**:
- ✅ Modal opens
- ✅ Form validates (all required fields)
- ✅ POST request succeeds
- ✅ Modal closes
- ✅ Post appears on Feb 15 in calendar
- ✅ Post card shows IG badge + Planned status

---

### Test Scenario 3: Click Date to Add Post

**Steps**:
1. Click on empty date cell (e.g., Feb 20)
2. Create Post modal opens with date pre-filled
3. Complete form and submit

**Expected**:
- ✅ Date field shows Feb 20
- ✅ Post created for correct date

---

### Test Scenario 4: View Post Details

**Steps**:
1. Click on existing post card
2. Post Details modal opens
3. View all fields
4. Click "Close"

**Expected**:
- ✅ Modal shows title, date, platform, type, status, notes
- ✅ Shows creator name and timestamp
- ✅ Close button works

---

### Test Scenario 5: Delete Post

**Steps**:
1. Open Post Details
2. Click "Delete"
3. Confirm (optional confirm dialog)

**Expected**:
- ✅ DELETE request succeeds
- ✅ Modal closes
- ✅ Post disappears from calendar

---

### Test Scenario 6: Filter Posts

**Steps**:
1. Create posts with different platforms
2. Select "Instagram" from platform filter
3. Select "Planned" from status filter

**Expected**:
- ✅ Calendar shows only Instagram posts
- ✅ Uncheck filter → All posts return

---

### Test Scenario 7: Multi-Company Scope

**Steps**:
1. Create post for "Acme Corp"
2. Switch to "TechStart Inc" (via company dropdown)
3. View calendar

**Expected**:
- ✅ Calendar shows different posts (or empty if none)
- ✅ Posts are properly scoped to company

---

### Test Scenario 8: API Validation

**Curl Tests**:

```bash
# Get posts
curl http://localhost:3000/api/companies/company-1/posts?startDate=2026-02-01&endDate=2026-02-29 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create post
curl -X POST http://localhost:3000/api/companies/company-1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "platform": "Instagram",
    "postType": "Promo",
    "title": "Test Post"
  }'

# Delete post
curl -X DELETE http://localhost:3000/api/posts/post-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ DEFINITION OF DONE - STEP 2

### Calendar UI
- [ ] Month view renders correctly
- [ ] Week view renders correctly
- [ ] Month/week toggle works
- [ ] Prev/next navigation works
- [ ] Post cards display in correct dates
- [ ] Responsive design (mobile friendly)

### Post Management
- [ ] Create Post modal opens
- [ ] All form fields work
- [ ] Form validation works
- [ ] Post creation saves to DB
- [ ] Calendar refreshes after create
- [ ] Post Details modal displays data
- [ ] Delete post works
- [ ] Edit post works (optional)

### Filters
- [ ] Platform filter works
- [ ] Status filter works
- [ ] Filters persist during navigation

### Multi-Company
- [ ] Posts scoped to selectedCompanyId
- [ ] Switch company updates calendar
- [ ] No cross-company data leaks

### Security
- [ ] All endpoints require auth
- [ ] Company membership validated
- [ ] Unauthorized access returns 401/403

### Edge Cases
- [ ] Empty calendar shows empty state
- [ ] Loading state displays
- [ ] Error state handles failures
- [ ] No selectedCompanyId redirects to /companies

---

## 📁 FILE STRUCTURE (Step 2 Additions)

```
createcont/
├── app/
│   ├── api/
│   │   ├── companies/
│   │   │   └── [companyId]/
│   │   │       └── posts/
│   │   │           └── route.ts       # NEW
│   │   └── posts/
│   │       └── [postId]/
│   │           └── route.ts           # NEW
│   ├── app/
│   │   └── page.tsx                   # REPLACE placeholder
│   └── ...
├── components/
│   ├── calendar/
│   │   ├── Calendar.tsx               # NEW
│   │   ├── CalendarCell.tsx           # NEW
│   │   ├── PostCard.tsx               # NEW
│   │   └── CalendarHeader.tsx         # NEW
│   ├── modals/
│   │   ├── CreatePostModal.tsx        # NEW
│   │   └── PostDetailsModal.tsx       # NEW
│   └── ...
├── lib/
│   ├── db.ts                          # UPDATE (add posts)
│   ├── validation.ts                  # UPDATE (add post schemas)
│   └── utils/
│       └── calendar.ts                # NEW (date utils)
└── ...
```

---

## 🎨 UI STYLE GUIDE EXTENSIONS (Step 2)

### Platform Badges
```css
.badge-instagram { background: linear-gradient(45deg, #f09433 0%, #dc2743 100%); }
.badge-facebook { background: #1877F2; }
.badge-linkedin { background: #0077B5; }
```

### Status Badges
```css
.status-planned { background: #10B981; color: white; }
.status-draft { background: #F59E0B; color: white; }
```

### Post Card
```css
.post-card {
  padding: 8px;
  background: white;
  border-left: 3px solid var(--platform-color);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}
```

---

**End of Step 2 Specification**
