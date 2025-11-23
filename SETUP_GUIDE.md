# Admin Dashboard - Quick Setup Guide

## Overview
This is a fully functional admin dashboard for managing medical bookings and employees. Built with React, TypeScript, Tailwind CSS, GSAP animations, and Supabase database.

---

## Features
- **Employee Management**: Add, view, and delete employees with "Employee of the Week" recognition
- **Booking Management**: View bookings, start execution with employee assignment, WhatsApp integration
- **Authentication**: Secure login with Supabase Auth
- **Animations**: Smooth GSAP modal animations
- **RTL Support**: Layout compatible with right-to-left languages

---

## Step 1: Create Admin User

You need to create an admin account in Supabase to access the dashboard.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - **Email**: `mohammed.aldomi68@gmail.com` (or `admin@yourdomain.com`)
   - **Password**: Create a secure password (you'll use this to login)
   - **Auto Confirm User**: Enable this option
5. Click **Create user**

### Option B: Using Sign Up (If Email Confirmation is Disabled)

If you've disabled email confirmation in Supabase settings:

1. Add a sign-up feature temporarily, or
2. Use the Supabase SQL Editor to insert directly:

```sql
-- This is handled by the Supabase dashboard method above
```

---

## Step 2: Access the Application

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to: `http://localhost:5173`

3. **Login** with your admin credentials:
   - Email: `mohammed.aldomi68@gmail.com`
   - Password: (the password you created in Step 1)

---

## Step 3: Explore the Dashboard

Once logged in, you'll see the dashboard with navigation:

### Bookings Page
- View all bookings with status indicators (pending, in_progress, completed)
- Click **Start Execution** on pending bookings to:
  - Assign an employee from the dropdown
  - Set execution time, location, and notes
  - Opens WhatsApp chat with assigned employee automatically
  - Updates booking status to "in_progress"
- Click **Chat with Patient** to contact the patient via WhatsApp
- Delete bookings with confirmation

### Employees Page
- View all employees in a responsive grid
- **Employee of the Week** badge appears on the employee with most tasks completed
- Add new employees using the form:
  - Full Name
  - Phone (international format: +1234567890)
  - Profession (Doctor, Nurse, Lab Technician)
  - Join Date
  - Address
  - Tasks Completed
- Delete employees with confirmation

### Analytics & Settings
- Placeholder pages (ready for future features)

---

## Step 4: Test Features

### Test Employee Management
1. Navigate to **Employees**
2. Add a new employee using the form
3. Verify the employee appears in the grid
4. Note: The employee with the most tasks gets the "Employee of the Week" badge

### Test Booking Execution
1. Navigate to **Bookings**
2. Find a booking with status "pending"
3. Click **Start Execution**
4. Watch the smooth GSAP animation as the modal appears
5. Select an employee from the dropdown
6. Fill in execution details (optional)
7. Click **Start Execution**
8. WhatsApp will open in a new tab with a pre-filled message
9. Verify the booking status changed to "in_progress"

### Test WhatsApp Integration
- **Employee WhatsApp**: When starting execution, WhatsApp opens with employee's number
- **Patient WhatsApp**: Click "Chat with Patient" to message the patient
- Format: Both use international format (+1234567890) for proper WhatsApp linking

---

## Sample Data

The database includes sample data for testing:

### Employees (5 sample employees)
- Dr. Ahmed Hassan - Doctor (45 tasks)
- Nurse Sarah Mohamed - Nurse (38 tasks)
- Ali Mahmoud - Lab Technician (52 tasks)
- Dr. Fatima Ali - Doctor (61 tasks) - **Employee of the Week**
- Layla Ibrahim - Nurse (29 tasks)

### Bookings (5 sample bookings)
- 3 pending bookings (can start execution)
- 1 in_progress booking
- 1 completed booking

---

## Admin Access

Only these email addresses have admin access (enforced by database RLS policies):
- `mohammed.aldomi68@gmail.com`
- `admin@yourdomain.com`

To add more admin emails, run this SQL in Supabase:

```sql
-- Update the is_admin function to include more emails
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' IN (
      'mohammed.aldomi68@gmail.com',
      'admin@yourdomain.com',
      'newadmin@example.com'  -- Add new admin emails here
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Security Features

### Row Level Security (RLS)
All database tables have RLS enabled:

**Employees Table**
- Only admins can read, create, update, and delete

**Bookings Table**
- Anyone can create (for public booking form)
- Only admins can read, update, and delete

### Authentication
- Secure session management via Supabase Auth
- Protected routes (must be logged in to access dashboard)
- Auto-logout when session expires

---

## Troubleshooting

### Can't Login
- Verify you created the user with the correct email
- Check that "Auto Confirm User" was enabled
- Try resetting password in Supabase dashboard

### Can't See Data
- Verify you're logged in with an admin email
- Check browser console for errors
- Verify RLS policies are active

### WhatsApp Doesn't Open
- Ensure phone numbers are in international format (+1234567890)
- Check browser's popup blocker settings
- WhatsApp web/app must be accessible on your device

### Modal Animation Issues
- Clear browser cache
- Check that GSAP is installed: `npm list gsap`
- Verify no console errors related to GSAP

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: GSAP
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment Ready**: Production build via `npm run build`

---

## Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment.

---

## Need Help?

- Check Supabase logs in the dashboard
- Open browser DevTools console for frontend errors
- Verify environment variables in `.env` file
- Check that all npm packages are installed: `npm install`

---

## Next Steps

1. Customize the design and colors to match your brand
2. Add more profession options in the employee form
3. Implement Analytics page with charts
4. Add Settings page for admin configuration
5. Create a public booking form for patients
6. Add email notifications for bookings
7. Implement real-time updates using Supabase subscriptions

---

**Dashboard is ready to use! Login and start managing employees and bookings.**
