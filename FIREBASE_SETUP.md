# Firebase Setup Guide

This application now uses Firebase for authentication and database. Follow these steps to set up your Firebase project:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Save**

## 3. Create Your First User

1. Go to **Authentication** > **Users** tab
2. Click **Add user**
3. Enter an email and password (e.g., `admin@example.com` / `Admin123!`)
4. Click **Add user**

## 4. Set Up Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Start in **test mode** (you can change rules later)
4. Select a location close to your users
5. Click **Enable**

### Create Collections

You need to create two collections with sample data:

#### Collection: `employees`

Click **Start collection** and create a collection named `employees`. Add a document with these fields:

```
name: "Dr. John Smith"
phone: "+1234567890"
profession: "Doctor"
joinDate: "2024-01-15"
address: "123 Main St, City, State"
tasksCompleted: 10
created_at: "2024-01-15T10:00:00Z"
```

#### Collection: `bookings`

Create another collection named `bookings`. Add a document with these fields:

```
patientName: "Jane Doe"
patientPhone: "+0987654321"
address: "456 Oak Ave, City, State"
date: "2024-12-01"
time: "10:00 AM"
package: "Basic Checkup"
status: "pending"
created_at: "2024-11-20T08:00:00Z"
```

## 5. Get Your Firebase Config

1. Go to **Project settings** (gear icon in sidebar)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Admin Dashboard")
5. Copy the `firebaseConfig` object

## 6. Update Environment Variables

Open the `.env` file in your project root and replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 7. Run the Application

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## 8. Login

Use the email and password you created in step 3 to log in to the dashboard.

## Security Rules (Optional but Recommended)

After testing, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This ensures only authenticated users can access your data.

## Features

- **Employee Management**: Add, view, and delete employees
- **Booking Management**: View bookings, assign employees, start execution
- **WhatsApp Integration**: Send messages to employees and patients
- **Dashboard**: View statistics and analytics
- **Authentication**: Secure login with Firebase Auth

## Troubleshooting

- **Build errors**: Run `npm install --production=false` to ensure all dependencies are installed
- **Auth errors**: Make sure Email/Password auth is enabled in Firebase Console
- **Database errors**: Verify your Firestore database is created and in test mode
- **Connection errors**: Double-check your `.env` file has the correct Firebase credentials
