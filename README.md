# Paragrutarally Management Application

A comprehensive web application to manage users, kids, teams, events, vehicles and forms, replacing Excel-based workflows with a modern, user-friendly solution.

## 🌟 Features

- **User Management**: Role-based access for administrators, staff, and external partners
- **Kids Management**: Register, organize, and track kids' participation
- **Team Management**: Create teams, assign instructors, and manage team rosters
- **Data Import/Export**: Seamlessly transition from Excel with robust import/export tools
- **Forms Management**: Create, submit, and review digital forms
- **Advanced Search**: Find information quickly with powerful search capabilities
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: React.js with functional components and hooks
- **UI Framework**: Tailwind CSS
- **State Management**: React Context API
- **Backend**: Firebase (Firestore, Authentication, Storage, Functions)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- npm (v6 or later)
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## 🚀 Getting Started

### Clone the Repository

```bash
git clone <repository-url>
cd charity-management-app
```

### Install Dependencies

```bash
npm install
```

### Set Up Firebase

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Functions (Blaze plan required)
3. Update the Firebase configuration in `src/firebase/config.js`

### Set Up Firebase Security Rules

1. Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

2. Deploy Storage security rules:
```bash
firebase deploy --only storage:rules
```

### Deploy Firebase Functions

```bash
cd firebase/functions
npm install
cd ../..
firebase deploy --only functions
```

### Run Development Server

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

The application follows a well-organized structure:

### Frontend (React)

```
src/
├── assets/                 # Images, icons, etc.
├── components/             # React components by feature
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard components
│   ├── data/               # Data management components
│   ├── forms/              # Form management components
│   ├── kids/               # Kids management components
│   ├── layout/             # Layout components
│   ├── search/             # Search components
│   ├── teams/              # Team management components
│   └── users/              # User management components
├── contexts/               # Context providers
├── firebase/               # Firebase configuration
│   └── services/           # Firebase service wrappers
├── hooks/                  # Custom React hooks
└── utils/                  # Utility functions
```

### Backend (Firebase)

```
firebase/
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── functions/              # Cloud Functions
    ├── index.js            # Function entry points
    └── package.json        # Functions dependencies
```

## 👥 User Roles

The application supports four user roles with different permissions:

### Administrator
- Full access to all features
- Manage users and permissions
- Create and customize forms
- Configure system settings

### Instructor
- Manage kids and teams
- Import and export data
- Submit and review forms
- Generate reports

### Parents
- View assigned kids
- View events
- Submit forms
- Use basic search features

## 🔑 Authentication

To set up the initial admin user:

1. Create a user through Firebase Authentication
2. Manually add a document in the `users` collection with the following structure:
```javascript
{
  uid: "same-as-auth-uid",
  email: "admin@example.com",
  displayName: "Admin User",
  role: "admin",
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp()
}
```

## 📊 Data Model

The application uses the following Firestore collections:

- **users**: User profiles and permissions
- **kids**: Participant information
- **teams**: Team information and rosters
- **events**: Events data
- **forms**: Form templates
- **formSubmissions**: Completed form submissions
- **importLogs**: Records of data imports

## 🔒 Security

The application implements comprehensive security with:

- Firebase Authentication for user identity
- Firestore and Storage security rules for data access control
- Role-based permissions
- Input validation
- Secure file handling

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 📱 Deployment

Deploy to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

## 🔄 Data Migration

To migrate existing Excel data:

1. Format your Excel files according to the application's expected format
2. Use the built-in import tool as an admin or staff user
3. Verify the imported data for accuracy

## 🛠️ Troubleshooting

Common issues and solutions:

- **Firebase permissions errors**: Check security rules and user roles
- **Import issues**: Ensure Excel format matches expected schema
- **Authentication problems**: Verify user exists in both Authentication and Firestore




