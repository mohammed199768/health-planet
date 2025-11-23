# Firestore Security Rules

Add these rules to your Firebase Firestore to allow analytics tracking from external websites while keeping other data secure.

## Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the rules below

## Rules Configuration

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Events collection - Allow public write for analytics tracking
    // Allow read only for authenticated users (admin dashboard)
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow any website to track events
      allow update, delete: if request.auth != null;
    }

    // Employees collection - Admin only
    match /employees/{employeeId} {
      allow read, write: if request.auth != null;
    }

    // Bookings collection - Admin only
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }

    // All other collections - Admin only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## What These Rules Do

### Events Collection (`/events/{eventId}`)
- ✅ **Read**: Only authenticated users (admin dashboard) can read events
- ✅ **Create**: Anyone can create events (allows tracking from curevie.net and other websites)
- ✅ **Update/Delete**: Only authenticated users can modify or delete events

### Employees & Bookings Collections
- 🔒 Only authenticated users (logged into admin dashboard) can read and write

### All Other Collections
- �� Protected by authentication by default

## Publishing the Rules

After pasting the rules:
1. Click **Publish** button at the top
2. Confirm the changes
3. Wait a few seconds for the rules to take effect

## Testing

1. Open your admin dashboard and login
2. Go to Analytics page
3. You should see events from curevie.net appearing
4. Try filtering by domain in the dropdown

## Important Notes

- The `allow create: if true;` rule for events allows ANY website to write to your events collection
- This is intentional for analytics tracking
- Make sure you validate/sanitize the data if you plan to display it publicly
- Consider adding rate limiting in production to prevent abuse
- Monitor your Firebase usage to avoid unexpected costs
