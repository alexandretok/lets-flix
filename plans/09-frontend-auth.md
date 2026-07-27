# Plan 09: Frontend Setup & Auth Pages

## Objective
Set up Angular frontend with PrimeNG, Signal Stores, routing, and implement authentication pages.

## Tasks

### 9.1 Angular Configuration
- Configure PrimeNG theme (Aura dark or similar)
- Set up global styles, font imports
- Configure `provideHttpClient` with JWT interceptor
- Set up routing with auth guards

### 9.2 Auth Service & Store
- Create `auth.store.ts` using Signal Store
- Manage: token, user info, isAuthenticated, requiresPasswordChange
- Implement login, logout, changePassword actions
- Persist token in localStorage

### 9.3 Login Page (`/login`)
- PrimeNG form with username/password inputs
- Logo placeholder image
- Error toast on failed login
- Redirect to `/setup-password` if requires_password_change, else `/browse`

### 9.4 Setup Password Page (`/setup-password`)
- Form with new password + confirm password
- Validation (min length, match)
- On success redirect to `/browse`

### 9.5 Auth Guard
- Protect all routes except `/login`
- Redirect to `/setup-password` if `requires_password_change` is true
- Redirect to `/login` if not authenticated

### 9.6 JWT Interceptor
- Attach Authorization header to all API requests
- On 401 response, clear token and redirect to login

## Success Criteria
- Login flow works end-to-end
- Forced password change blocks app access
- Auth guard protects routes
- JWT is sent with all requests
- PrimeNG theme renders correctly
