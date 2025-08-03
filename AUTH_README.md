# Simple Authentication System

## Overview
A temporary authentication system for the Manage page using environment variables. This provides basic security until proper account management is implemented.

## Features
- Environment variable-based password authentication
- Session-based authentication (expires after 8 hours)
- Secure password input with visibility toggle
- Automatic logout functionality
- Responsive design with dark mode support

## Setup

### 1. Environment Variable
Add your admin password to `.env` file:
```bash
VITE_ADMIN_PASSWORD=your_secure_password_here
```

Default password (if not set): `admin123`
Current password: `classinfo2025`

### 2. Usage
1. Navigate to `/manage` page
2. Enter the admin password when prompted
3. Authentication persists for 8 hours
4. Use the logout button to end the session early

## Security Features
- Password is stored in environment variables (not in code)
- Session expires automatically after 8 hours
- Password input is masked by default
- Authentication state is cleared on logout

## Implementation Details

### Files Created
- `src/components/SimpleAuth.jsx` - Authentication component
- `src/components/SimpleAuth.css` - Styling for auth component

### Files Modified
- `src/pages/Manage.jsx` - Added authentication wrapper
- `src/App.css` - Added logout button styles
- `.env` - Added VITE_ADMIN_PASSWORD variable

### Authentication Flow
1. Check sessionStorage for existing auth on page load
2. Show authentication modal if not authenticated
3. Verify password against environment variable
4. Set session data on successful authentication
5. Automatic expiration after 8 hours
6. Manual logout clears session data

## Future Improvements
This is a temporary solution. Future enhancements will include:
- User registration and login system
- Role-based access control
- Password hashing and secure storage
- JWT tokens for authentication
- Multi-user support
- Password reset functionality

## Configuration
```javascript
// Session duration (8 hours)
const eightHours = 8 * 60 * 60 * 1000;

// Authentication check interval
useEffect(() => {
    // Checks auth status on component mount
    checkAuth();
}, []);
```

## Testing
1. Start the development server: `npm run dev`
2. Navigate to `/manage`
3. Enter password: `classinfo2025`
4. Verify authentication works correctly
5. Test logout functionality
6. Test session expiration (or manually clear sessionStorage)
