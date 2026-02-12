# Testing Guide - Step 1

## 🧪 Manual Testing Checklist

### 1. Authentication Flow

#### Test Signup
1. Navigate to http://localhost:3000
2. Should redirect to `/login`
3. Click "Sign up" link at bottom
4. Fill in signup form:
   ```
   Full Name: Test User
   Email: test@example.com
   Password: TestPass123!
   [✓] Agree to terms
   ```
5. Click "Create Account"
6. **Expected:** Redirect to `/companies` page

#### Test Login (Existing User)
1. Navigate to `/login`
2. Use demo credentials:
   ```
   Email: sarah@example.com
   Password: Password123!
   ```
3. Click "Sign In"
4. **Expected:** Redirect to `/companies` with 3 companies shown

#### Test Login (Second User)
1. Logout first
2. Login with:
   ```
   Email: mike@example.com
   Password: SecurePass456!
   ```
3. **Expected:** See 2 companies (Acme Corp, TechStart Inc)

### 2. Validation Testing

#### Signup Validation
1. Go to `/signup`
2. Try submitting with:
   - Empty fields → Should show "required" errors
   - Invalid email (`test`) → Should show email format error
   - Weak password (`Pass1!`) → Should show "at least 8 characters" error
   - Password without uppercase (`password123!`) → Should show validation error
   - Password without special char (`Password123`) → Should show validation error
   - Existing email (`sarah@example.com`) → Should show "Email already registered"

#### Login Validation
1. Go to `/login`
2. Try:
   - Wrong password → "Invalid email or password"
   - Non-existent email → "Invalid email or password"
   - Empty fields → Should show required errors

### 3. Company Selection

#### Test Company List
1. Login as Sarah
2. **Expected:** See 3 company cards:
   - Acme Corp (admin, cover image, logo)
   - TechStart Inc (member)
   - DesignHub (admin)

#### Test Search
1. On companies page, type "Tech" in search
2. **Expected:** Only TechStart Inc shows
3. Clear search
4. **Expected:** All 3 companies return

#### Test Company Selection
1. Click on "Acme Corp" card
2. **Expected:** 
   - Redirect to `/app`
   - See "Dashboard Coming Soon" placeholder
   - Can see "Switch Company" button

### 4. Navigation & Protected Routes

#### Test Protected Routes
1. Open new incognito window
2. Try to visit `/companies` directly
3. **Expected:** Redirect to `/login`
4. Try to visit `/app` directly
5. **Expected:** Redirect to `/login`

#### Test Logout
1. Login first
2. On `/companies` page, click "Logout" button
3. **Expected:** Redirect to `/login`, token cleared

### 5. Forgot Password Flow

1. Go to `/login`
2. Click "Forgot password?" link
3. Enter email: `test@example.com`
4. Click "Send Reset Link"
5. **Expected:** 
   - Loading state for 1.5s
   - Success message with green checkmark
   - "Check Your Email" message
   - Can click "Back to Sign In"

### 6. User Experience

#### Test Remember Me
1. Login with "Remember me" checked
2. **Note:** Currently UI only (localStorage persists by default)

#### Test Loading States
1. Signup/Login → Should show "Creating account..." / "Signing in..."
2. Companies page → Should show spinner while loading
3. Forgot password → Should show "Sending..." state

#### Test Error States
1. Try login with wrong credentials
2. **Expected:** Red error banner above form
3. Input fields should have red border
4. Error message should be clear

### 7. Responsive Design

#### Desktop (1920×1080)
- Login/Signup cards centered, max-width 440px
- Companies grid shows 3 columns
- All elements properly spaced

#### Tablet (768×1024)
- Companies grid shows 2 columns
- Login card still centered
- Header responsive

#### Mobile (375×667)
- Companies grid shows 1 column
- Login form full width with padding
- Touch targets appropriate size
- Text readable

### 8. API Testing (Optional)

Use Postman/Insomnia or curl:

#### Test Signup API
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "API Test",
    "email": "apitest@example.com",
    "password": "ApiTest123!"
  }'
```

**Expected:** 201 status, token in response

#### Test Login API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "Password123!"
  }'
```

**Expected:** 200 status, token in response

#### Test Get User API
```bash
# Replace YOUR_TOKEN with actual token from login
curl http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** User data

#### Test Get Companies API
```bash
curl http://localhost:3000/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Array of companies

### 9. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 10. Accessibility

- [ ] Can navigate with keyboard (Tab, Enter)
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Focus indicators visible
- [ ] Color contrast sufficient

## ✅ Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Smooth transitions between pages
- ✅ Clear error messages
- ✅ Professional design
- ✅ Responsive on all screen sizes
- ✅ Authentication working correctly
- ✅ Company selection working
- ✅ Logout working

## 🐛 Known Issues (Step 1 Only)

- Mock database (data resets on server restart)
- Social login buttons are disabled (UI only)
- Forgot password doesn't send emails (UI only)
- No persistent storage (localStorage only for auth)

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Authentication:
[ ] Signup works
[ ] Login works
[ ] Logout works
[ ] Validation works
[ ] Error messages clear

Company Selection:
[ ] Companies load
[ ] Search works
[ ] Selection redirects
[ ] Empty state shows (if no companies)

Navigation:
[ ] Protected routes redirect
[ ] Public routes accessible
[ ] Links work correctly

UI/UX:
[ ] Responsive design
[ ] Loading states
[ ] Error states
[ ] Professional appearance

Notes:
_________________________________
_________________________________
```

---

**Ready to Test?** Start the dev server with `npm run dev` and visit http://localhost:3000!
