# 📋 Task Management System

A comprehensive Excel-like task management web application built with React, TailwindCSS, and Firebase. Features keyboard shortcuts, real-time collaboration, and intuitive data management.

## ✨ Features

### 🎯 Core Functionality
- **Excel-like Interface**: Editable cells with dropdown modals and inline editing
- **Dashboard Analytics**: Real-time counters for task status, due dates, and priorities
- **Multi-Client Support**: Manage tasks across multiple clients with user assignments
- **Keyboard Navigation**: Full keyboard support with Excel-like shortcuts

### 📊 Task Management
- **Comprehensive Task Fields**:
  - Client selection with add-new capability
  - Task and subtask management
  - Estimated time vs actual time tracking
  - User assignment and team leader designation
  - Priority levels (Low, Medium, High, Critical)
  - Due date management with date picker
  - Frequency settings (Daily, Weekly, Monthly, etc.)
  - Comments and status tracking

### ⌨️ Keyboard Shortcuts
- `Ctrl + N`: Add new task
- `Delete`: Delete selected tasks
- `Ctrl + S`: Save tasks
- `Tab/Enter`: Navigate between cells
- `Escape`: Cancel editing

### 🔐 Authentication & Security
- **User Registration**: Sign up with email and password
- **Email Verification**: Secure email verification process
- **Password Reset**: Forgot password with email reset link
- **Session Management**: Secure user sessions with Firebase Auth
- **Protected Routes**: Access control for authenticated users only

### 🔄 Real-time Features
- Live data synchronization with Firebase
- Instant updates across multiple users
- Automatic save functionality

### 📱 Responsive Design
- Mobile-friendly interface
- Adaptive layout for different screen sizes
- Touch-friendly controls

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication with Email/Password provider
   - Copy your Firebase configuration
   - Update `src/services/firebase.js` with your config:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   }
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── auth/                  # Authentication components
│   │   ├── AuthContainer.jsx  # Main auth container
│   │   ├── LoginForm.jsx      # Login form
│   │   ├── SignupForm.jsx     # Registration form
│   │   ├── ForgotPasswordForm.jsx # Password reset form
│   │   └── EmailVerificationBanner.jsx # Email verification banner
│   ├── Dashboard.jsx          # Analytics dashboard
│   ├── TaskTable.jsx          # Main table component
│   ├── EditableCell.jsx       # Editable cell component
│   └── modals/
│       ├── DropdownModal.jsx  # Dropdown selection modal
│       ├── FrequencyModal.jsx # Frequency selection modal
│       └── AddUserModal.jsx   # Add user modal
├── hooks/
│   ├── useAuth.js             # Authentication hook
│   ├── useDataManager.js      # Data management hook
│   ├── useKeyboardShortcuts.js # Keyboard shortcuts hook
│   └── useFirebase.js         # Firebase operations hook
├── services/
│   ├── authService.js         # Authentication service
│   ├── taskService.js         # Task and data services
│   └── firebase.js           # Firebase configuration
└── styles/
    └── index.css             # Global styles with TailwindCSS
```

## 🎨 Technology Stack

- **Frontend**: React 19, Vite
- **Styling**: TailwindCSS 4.x
- **Database**: Firebase Firestore
- **Icons**: React Icons
- **Date Handling**: React DatePicker
- **Build Tool**: Vite

## 📋 Usage Guide

### Authentication
1. **Sign Up**: Create a new account with email and password
2. **Email Verification**: Check your email and click the verification link
3. **Sign In**: Use your credentials to access the application
4. **Forgot Password**: Use the "Forgot Password" link to reset your password
5. **Sign Out**: Click the "Sign Out" button in the header

### Adding Tasks
1. Click the "Add Task" button or press `Ctrl + N`
2. Fill in the task details by clicking on each cell
3. Use dropdown modals for client, user, and priority selection
4. Set due dates using the date picker
5. Configure frequency settings if needed

### Managing Data
- **Edit**: Double-click text fields or click dropdown fields
- **Select**: Use checkboxes to select multiple rows
- **Delete**: Select rows and press Delete or click the Delete button
- **Filter**: Use the filter row below headers to search
- **Sort**: Click column headers to sort data

### Keyboard Navigation
- Use `Tab` to move between cells
- Use `Enter` to confirm edits
- Use `Escape` to cancel edits
- Use arrow keys for navigation

## 🔧 Configuration

### Firebase Setup
1. Enable Authentication:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password provider

2. Create collections in Firestore:
   - `tasks` - for task data
   - `clients` - for client information
   - `users` - for user management (task assignments)
   - `authUsers` - for authenticated user profiles
   - `taskTemplates` - for reusable task templates
   - `subtaskTemplates` - for reusable subtask templates

### Customization
- Modify `tailwind.config.js` for custom styling
- Update `src/components/TaskTable.jsx` to add/remove columns
- Customize keyboard shortcuts in `src/hooks/useKeyboardShortcuts.js`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments for implementation details

## 🔮 Future Enhancements

- [ ] User authentication and role-based access
- [ ] Advanced filtering and search
- [ ] Export to Excel/CSV
- [ ] Import from Excel/CSV
- [ ] Task templates
- [ ] Time tracking with timers
- [ ] Notification system
- [ ] Mobile app version
- [ ] Advanced reporting and analytics
- [ ] Integration with external tools (Slack, Teams, etc.)
