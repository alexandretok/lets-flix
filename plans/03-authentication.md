# Plan 03: Authentication System

## Objective
Implement JWT-based authentication with bcrypt password hashing, forced password change flow, and user management.

## Tasks

### 3.1 Auth Routes
- `POST /api/auth/login` - Authenticate user, return JWT token
- `POST /api/auth/change-password` - Change password (requires auth)
- JWT payload: `{ userId, username, role, requires_password_change }`

### 3.2 Auth Middleware
- Create Fastify auth hook to validate JWT on protected routes
- Include `requires_password_change` check - block all routes except `/api/auth/change-password` if flag is true
- Role-based access control for admin routes

### 3.3 User Management Routes (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user (admin only, sets requires_password_change=true)
- `DELETE /api/users/:id` - Delete user (admin only, cannot delete self)

### 3.4 Password Security
- All passwords hashed with bcrypt (salt rounds: 10)
- Password change updates hash and sets `requires_password_change = false`

## Success Criteria
- Login returns valid JWT
- Protected routes reject unauthenticated requests
- Forced password change blocks access until completed
- Admin can create/list/delete users
- Non-admin cannot access user management
