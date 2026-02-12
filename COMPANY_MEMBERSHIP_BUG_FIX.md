# COMPANY MEMBERSHIP BUG - ROOT CAUSE ANALYSIS & FIX

## Problem Statement
Creating a post fails with "Forbidden: Not a member of this company" error in the Create Post modal.
This blocks both manual post creation and AI generation.

## Root Cause Investigation

### Database Status: ✅ CORRECT
Verified using `check-db.js`:
- Users exist: user-1 (sarah@example.com), user-2 (mike@example.com)
- Companies exist: company-1 (Acme Corp), company-2 (TechStart Inc), company-3 (Global Solutions)
- Memberships exist correctly:
  - Sarah → Acme Corp (admin) ✅
  - Sarah → TechStart Inc (member) ✅
  - Mike → Acme Corp (member) ✅
  - Mike → TechStart Inc (admin) ✅

### Code Flow Analysis

1. **Login → Company Selection**
   - User logs in
   - Redirected to `/companies`
   - Selects a company
   - `localStorage.setItem('selectedCompanyId', companyId)` (line 89, companies/page.tsx)
   - Redirects to `/app`

2. **Dashboard Initialization**
   - `initializePage()` reads `localStorage.getItem('selectedCompanyId')` (line 70, app/page.tsx)
   - Fetches user companies via `/api/companies`
   - Finds company matching `selectedCompanyId`
   - Sets `company` state to selected company (line 99)

3. **Post Creation**
   - User clicks "+ Add Post"
   - `handleCreatePost` is called
   - Sends POST to `/api/companies/${company.id}/posts` (line 195)
   - API checks `isUserMemberOfCompany(payload.userId, companyId)` (line 106, route.ts)

### Potential Issues

1. **Race Condition**: Company state not loaded when modal opens
2. **Stale Data**: selectedCompanyId in localStorage doesn't match actual company ID
3. **Company Switch**: User switches company but state isn't updated
4. **Session Mismatch**: Token userId doesn't match the user who selected the company

## Implemented Fixes

### 1. Enhanced Logging (Completed)
- ✅ Added detailed frontend logging in `handleCreatePost`
- ✅ Added backend logging in POST /api/companies/[companyId]/posts
- ✅ Null company guard in frontend

### 2. Company State Validation (TODO)
- Add validation that company state matches selectedCompanyId
- Refresh company state when switching companies

### 3. User-Friendly Error Handling (TODO)
- Show actionable error message with CTA
- Suggest switching company or refreshing page

### 4. Auto-Create Membership on Company Creation (TODO)
- Implement POST /api/companies endpoint
- Auto-add creator as admin member
- Set default role: MARKETER

## Next Steps

1. Test with actual browser to reproduce the bug
2. Review console logs to pinpoint exact failure point
3. Implement remaining fixes based on findings
