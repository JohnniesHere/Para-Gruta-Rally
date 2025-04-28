# Charity Race Event Management System

This React application serves as a management system for a charity organization that builds custom cars for children with disabilities to participate in race events. The system manages users (parents, admins, and instructors), events, vehicles, and a media gallery.

## Project Overview

### Purpose
The application helps the charity organization efficiently manage:
- Parent and child registrations
- Event scheduling and management
- Vehicle inventory and assignments
- Instructor management and assignments
- Photo gallery from events

### Technology Stack
- **Frontend**: React.js with React Router
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Custom CSS

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── common/         # Shared components 
│   ├── layout/         # Layout components
│   ├── admin/          # Admin-specific components
│   ├── parent/         # Parent-specific components
│   ├── events/         # Event-related components
│   ├── vehicles/       # Vehicle-related components
│   ├── instructors/    # Instructor-related components
│   └── gallery/        # Gallery components
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin pages
│   ├── parent/         # Parent pages
│   ├── events/         # Event pages
│   └── public/         # Public pages
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── services/           # API and service functions
│   ├── firebase/       # Firebase service connections
│   └── api/            # API service functions
├── utils/              # Utility functions
├── assets/             # Static assets
├── styles/             # Global styles
├── routes/             # Route definitions
└── App.js              # Main application component
```

## Key Data Models

### 1. Users
```javascript
{
  id: "auto-generated-firebase-id",
  email: "user@example.com",
  name: "Full Name",
  role: "admin" | "parent" | "staff",
  phone: "123-456-7890",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### 2. Children
```javascript
{
  id: "auto-generated-firebase-id",
  parentId: "reference-to-parent-user-id",
  name: "Child Name",
  dateOfBirth: timestamp,
  specialNeeds: "Description of special needs",
  medicalInfo: "Medical information",
  photo: "url-to-photo" (optional),
  participatedEvents: ["event-id-1", "event-id-2"]
}
```

### 3. Events
```javascript
{
  id: "auto-generated-firebase-id",
  name: "Event Name",
  date: timestamp,
  location: "Event Location",
  description: "Event Description",
  maxParticipants: 20,
  participants: [
    {
      childId: "child-id-1",
      registeredAt: timestamp,
      vehicleId: "vehicle-id-1",
      notes: "Special notes"
    }
  ],
  instructors: ["instructor-id-1", "instructor-id-2"],
  photos: ["photo-url-1", "photo-url-2"],
  status: "upcoming" | "completed" | "cancelled"
}
```

### 4. Vehicles
```javascript
{
  id: "auto-generated-firebase-id",
  name: "Vehicle Name",
  type: "Vehicle Type",
  description: "Vehicle Description",
  status: "available" | "in-use" | "maintenance",
  lastMaintenanceDate: timestamp,
  photos: ["photo-url-1", "photo-url-2"]
}
```

### 5. Instructors
```javascript
{
  id: "auto-generated-firebase-id",
  name: "Instructor Name",
  email: "instructor@example.com",
  phone: "123-456-7890",
  specialties: ["specialty-1", "specialty-2"],
  availability: {
    monday: true,
    tuesday: false,
    // ... other days
  },
  assignedEvents: ["event-id-1", "event-id-2"]
}
```

### 6. Gallery
```javascript
{
  id: "auto-generated-firebase-id",
  eventId: "reference-to-event-id",
  photos: [
    {
      url: "photo-url-1",
      caption: "Photo Caption",
      uploadedAt: timestamp,
      tags: ["tag-1", "tag-2"]
    }
  ]
}
```

## Component Breakdown

### Authentication Components
- `LoginForm`: Handles user login
- `AuthContext`: Manages authentication state across the app

### User Management Components
- `UserManagement`: Admin interface for managing users
- `ChildRegistration`: For parents to register their children
- `ChildrenList`: Displays a parent's registered children

### Event Management Components
- `EventForm`: Create and edit events
- `EventList`: Display list of events
- `EventRegistration`: Register children for events
- `EventDetail`: View detailed event information

### Vehicle Management Components
- `VehicleForm`: Add and edit vehicles
- `VehicleList`: Display and manage vehicles
- `VehicleAssignment`: Assign vehicles to children for events

### Instructor Management Components
- `InstructorForm`: Add and edit instructors
- `InstructorList`: Display and manage instructors
- `InstructorAssignment`: Assign instructors to events
- `InstructorDetail`: View detailed instructor information

### Gallery Components
- `GalleryViewer`: Display event photos
- `PhotoUploader`: Upload and manage photos

## Setting Up the Project

### Prerequisites
- Node.js and npm installed
- Firebase account

### Installation Steps
1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a Firebase project
4. Enable Firebase Authentication, Firestore, and Storage
5. Update the Firebase configuration in `src/services/firebase/firebase.js`
6. Set up Firestore security rules
7. Run `npm start` to start the development server

### Firebase Configuration
Update the configuration in `src/services/firebase/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## User Workflows

### Admin User
1. Log in with admin credentials
2. Manage users, events, vehicles, and instructors
3. Set up and configure race events
4. Assign vehicles and instructors to events
5. Upload and manage photos in the gallery

### Parent User
1. Register or log in
2. Register children with necessary details
3. Browse upcoming events
4. Register children for events
5. View event details and photos

## Key Features

### Role-Based Access Control
The application uses a role-based system to control access to different parts of the application:
- `AuthContext` maintains the current user's role
- `ProtectedRoute` component restricts access based on role
- Different layouts and navigation for each user type

### Real-time Data
Firebase Firestore provides real-time updates:
- Changes to events, registrations, etc. are immediately visible
- Data is synchronized across users

### Image Management
Firebase Storage handles image uploads:
- Event photos stored securely
- Gallery component for browsing and viewing photos

## Troubleshooting

### Common Issues
1. **Firebase Connection Issues**: Verify your Firebase configuration and internet connection
2. **Authentication Problems**: Check Firebase Authentication settings and rules
3. **Missing Data**: Verify Firestore security rules allow proper read/write access
4. **Image Upload Failures**: Check Storage security rules and bucket permissions

### Debugging
- Check browser console for JavaScript errors
- Verify Firebase console for authentication and database errors
- Use React DevTools for component debugging

## Development Guidelines

### Adding New Features
1. Create components in the appropriate directory
2. Update data models if needed
3. Add routes for new pages
4. Update navigation components

### Code Style
- Use functional components with hooks
- Follow the established project structure
- Use consistent naming conventions
- Document complex functions or components