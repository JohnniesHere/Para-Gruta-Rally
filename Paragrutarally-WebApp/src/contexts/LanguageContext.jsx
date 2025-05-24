// src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Language constants
export const LANGUAGES = {
    ENGLISH: 'en',
    HEBREW: 'he'
};

// Translations object
const translations = {
    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.eventManagement': 'Event Management',
        'nav.userManagement': 'User Management',
        'nav.forms': 'Forms',
        'nav.backupSync': 'Backup/Sync',
        'nav.importExport': 'Import/Export Data',
        'nav.gallery': 'Gallery',
        'nav.myAccount': 'My Account',
        'nav.signOut': 'Sign Out',
        'nav.logo': 'ParaGrutaRally',

        // Dashboard
        'dashboard.title': 'Admin Dashboard',
        'dashboard.totalUsers': 'Total Users',
        'dashboard.upcomingEvents': 'Upcoming Events',
        'dashboard.totalKids': 'Total Kids',
        'dashboard.activeTeams': 'Active Teams',
        'dashboard.recentActivities': 'Recent Activities',
        'dashboard.newUser': 'New user',
        'dashboard.wasAdded': 'was added',
        'dashboard.event': 'Event',
        'dashboard.wasCreated': 'was created',
        'dashboard.newPhotos': 'new photos',
        'dashboard.wereAdded': 'were added to the gallery',

        // Event Management
        'events.title': 'Event Management',
        'events.createNew': 'Create New Event',
        'events.searchPlaceholder': 'Search events...',
        'events.search': 'Search',
        'events.allEvents': 'All Events',
        'events.upcoming': 'Upcoming Events',
        'events.completed': 'Completed Events',
        'events.allLocations': 'All Locations',
        'events.jerusalem': 'Jerusalem',
        'events.telAviv': 'Tel Aviv',
        'events.haifa': 'Haifa',
        'events.eilat': 'Eilat',
        'events.eventName': 'Event Name',
        'events.date': 'Date',
        'events.location': 'Location',
        'events.participants': 'Participants',
        'events.status': 'Status',
        'events.actions': 'Actions',
        'events.edit': 'Edit',
        'events.view': 'View',
        'events.delete': 'Delete',
        'events.loading': 'Loading events...',
        'events.noEvents': 'No events found',
        'events.previous': 'Previous',
        'events.next': 'Next',

        // User Management
        'users.title': 'User Management',
        'users.manage': 'Manage Users',
        'users.description': 'This page will contain user management functionality including:',
        'users.viewAll': 'View all users',
        'users.addNew': 'Add new users',
        'users.editProfiles': 'Edit user profiles',
        'users.manageRoles': 'Manage user roles',
        'users.permissions': 'User permissions',
        'users.addNewUser': 'Add New User',
        'users.exportUsers': 'Export Users',

        // My Account
        'account.title': 'My Account',
        'account.profile': 'Profile Information',
        'account.security': 'Security Settings',
        'account.preferences': 'Preferences',
        'account.editProfile': 'Edit Profile',
        'account.fullName': 'Full Name',
        'account.email': 'Email Address',
        'account.phone': 'Phone Number',
        'account.organization': 'Organization',
        'account.bio': 'Bio',
        'account.saveChanges': 'Save Changes',
        'account.cancel': 'Cancel',

        // Forms
        'forms.title': 'Forms Management',
        'forms.manage': 'Manage Forms',
        'forms.description': 'This page will contain form management functionality including:',
        'forms.createNew': 'Create new forms',
        'forms.editExisting': 'Edit existing forms',
        'forms.viewSubmissions': 'View form submissions',
        'forms.templates': 'Form templates',
        'forms.analytics': 'Form analytics',
        'forms.createNewForm': 'Create New Form',
        'forms.viewTemplates': 'View Templates',

        // Backup/Sync
        'backup.title': 'Backup & Sync',
        'backup.databaseBackup': 'Database Backup',
        'backup.description': 'Create and manage backups of your application data.',
        'backup.createNew': 'Create New Backup',
        'backup.viewHistory': 'View Backup History',
        'backup.recentBackups': 'Recent Backups',
        'backup.noBackups': 'No backups created yet. Click "Create New Backup" to get started.',
        'backup.cloudSync': 'Cloud Sync Settings',
        'backup.configurSync': 'Configure synchronization with cloud storage services.',
        'backup.googleDrive': 'Google Drive',
        'backup.dropbox': 'Dropbox',
        'backup.status': 'Status',
        'backup.notConnected': 'Not Connected',
        'backup.connect': 'Connect',
        'backup.automatedSchedule': 'Automated Backup Schedule',
        'backup.setSchedule': 'Set up automated backups on a regular schedule.',
        'backup.daily': 'Daily',
        'backup.weekly': 'Weekly',
        'backup.monthly': 'Monthly',
        'backup.custom': 'Custom',
        'backup.saveSettings': 'Save Settings',

        // Import/Export
        'import.title': 'Import/Export Data',
        'import.importData': 'Import Data',
        'import.importDescription': 'Upload data files to import information into the system.',
        'import.selectDataType': 'Select Data Type to Import:',
        'import.selectFile': 'Select File (CSV or Excel):',
        'import.users': 'Users',
        'import.kids': 'Kids',
        'import.teams': 'Teams',
        'import.events': 'Events',
        'import.selectedFile': 'Selected file:',
        'import.size': 'Size:',
        'import.overwriteRecords': 'Overwrite existing records',
        'import.skipHeader': 'Skip header row',
        'import.importButton': 'Import Data',
        'import.exportData': 'Export Data',
        'import.exportDescription': 'Download data from the system as CSV or Excel files.',
        'import.selectExportType': 'Select Data Type to Export:',
        'import.allData': 'All Data',
        'import.exportFormat': 'Export Format:',
        'import.csv': 'CSV',
        'import.excel': 'Excel',
        'import.includeHeaders': 'Include header row',
        'import.includeTimestamp': 'Include timestamp in filename',
        'import.exportButton': 'Export Data',
        'import.recentActivity': 'Recent Activity',

        // Gallery
        'gallery.title': 'Gallery',
        'gallery.allPhotos': 'All Photos',
        'gallery.events': 'Events',
        'gallery.races': 'Races',
        'gallery.teams': 'Teams',
        'gallery.awards': 'Award Ceremonies',
        'gallery.uploadPhotos': 'Upload Photos',
        'gallery.noPhotos': 'No photos found in this album.',

        // General
        'general.loading': 'Loading...',
        'general.save': 'Save',
        'general.cancel': 'Cancel',
        'general.edit': 'Edit',
        'general.delete': 'Delete',
        'general.view': 'View',
        'general.close': 'Close',
        'general.yes': 'Yes',
        'general.no': 'No',
        'general.confirm': 'Confirm',

        // Language selector
        'language.english': 'English',
        'language.hebrew': 'עברית',
        'language.selectLanguage': 'Select Language',

        // English translations (add to translations.en)
        'login.appTitle': 'Paragrutarally WebApp',
        'login.title': 'Login',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.emailPlaceholder': 'Enter your email',
        'login.passwordPlaceholder': 'Enter your password',
        'login.show': 'Show',
        'login.hide': 'Hide',
        'login.signIn': 'Sign In',
        'login.signingIn': 'Signing In...',
        'login.forgotPassword': 'Forgot Password?',
        'login.mobileSignIn': 'Sign In With Mobile Number',
        'login.googleSignIn': 'Sign In With Google',
        'login.contactUs': 'Contact Us',
        'login.error': 'Failed to sign in. Please check your credentials.',
    },
    he: {
        // Navigation
        'nav.dashboard': 'לוח בקרה',
        'nav.eventManagement': 'ניהול אירועים',
        'nav.userManagement': 'ניהול משתמשים',
        'nav.forms': 'טפסים',
        'nav.backupSync': 'גיבוי וסנכרון',
        'nav.importExport': 'ייבוא וייצוא נתונים',
        'nav.gallery': 'גלריה',
        'nav.myAccount': 'החשבון שלי',
        'nav.signOut': 'התנתק',
        'nav.logo': 'פראגרוטרלי',

        // Dashboard
        'dashboard.title': 'לוח בקרה ראשי',
        'dashboard.totalUsers': 'סך המשתמשים',
        'dashboard.upcomingEvents': 'אירועים קרובים',
        'dashboard.totalKids': 'סך הילדים',
        'dashboard.activeTeams': 'קבוצות פעילות',
        'dashboard.recentActivities': 'פעילויות אחרונות',
        'dashboard.newUser': 'משתמש חדש',
        'dashboard.wasAdded': 'נוסף',
        'dashboard.event': 'אירוע',
        'dashboard.wasCreated': 'נוצר',
        'dashboard.newPhotos': 'תמונות חדשות',
        'dashboard.wereAdded': 'נוספו לגלריה',

        // Event Management
        'events.title': 'ניהול אירועים',
        'events.createNew': 'צור אירוע חדש',
        'events.searchPlaceholder': 'חפש אירועים...',
        'events.search': 'חפש',
        'events.allEvents': 'כל האירועים',
        'events.upcoming': 'אירועים קרובים',
        'events.completed': 'אירועים שהסתיימו',
        'events.allLocations': 'כל המיקומים',
        'events.jerusalem': 'ירושלים',
        'events.telAviv': 'תל אביב',
        'events.haifa': 'חיפה',
        'events.eilat': 'אילת',
        'events.eventName': 'שם האירוע',
        'events.date': 'תאריך',
        'events.location': 'מיקום',
        'events.participants': 'משתתפים',
        'events.status': 'סטטוס',
        'events.actions': 'פעולות',
        'events.edit': 'ערוך',
        'events.view': 'צפה',
        'events.delete': 'מחק',
        'events.loading': 'טוען אירועים...',
        'events.noEvents': 'לא נמצאו אירועים',
        'events.previous': 'הקודם',
        'events.next': 'הבא',

        // User Management
        'users.title': 'ניהול משתמשים',
        'users.manage': 'נהל משתמשים',
        'users.description': 'עמוד זה יכיל פונקציונליות ניהול משתמשים כולל:',
        'users.viewAll': 'צפה בכל המשתמשים',
        'users.addNew': 'הוסף משתמשים חדשים',
        'users.editProfiles': 'ערוך פרופילי משתמשים',
        'users.manageRoles': 'נהל תפקידי משתמשים',
        'users.permissions': 'הרשאות משתמשים',
        'users.addNewUser': 'הוסף משתמש חדש',
        'users.exportUsers': 'ייצא משתמשים',

        // My Account
        'account.title': 'החשבון שלי',
        'account.profile': 'מידע אישי',
        'account.security': 'הגדרות אבטחה',
        'account.preferences': 'העדפות',
        'account.editProfile': 'ערוך פרופיל',
        'account.fullName': 'שם מלא',
        'account.email': 'כתובת אימייל',
        'account.phone': 'מספר טלפון',
        'account.organization': 'ארגון',
        'account.bio': 'ביוגרפיה',
        'account.saveChanges': 'שמור שינויים',
        'account.cancel': 'בטל',

        // Forms
        'forms.title': 'ניהול טפסים',
        'forms.manage': 'נהל טפסים',
        'forms.description': 'עמוד זה יכיל פונקציונליות ניהול טפסים כולל:',
        'forms.createNew': 'צור טפסים חדשים',
        'forms.editExisting': 'ערוך טפסים קיימים',
        'forms.viewSubmissions': 'צפה בהגשות טפסים',
        'forms.templates': 'תבניות טפסים',
        'forms.analytics': 'ניתוח טפסים',
        'forms.createNewForm': 'צור טופס חדש',
        'forms.viewTemplates': 'צפה בתבניות',

        // Backup/Sync
        'backup.title': 'גיבוי וסנכרון',
        'backup.databaseBackup': 'גיבוי מסד נתונים',
        'backup.description': 'צור ונהל גיבויים של נתוני האפליקציה שלך.',
        'backup.createNew': 'צור גיבוי חדש',
        'backup.viewHistory': 'צפה בהיסטוריית גיבויים',
        'backup.recentBackups': 'גיבויים אחרונים',
        'backup.noBackups': 'עדיין לא נוצרו גיבויים. לחץ על "צור גיבוי חדש" כדי להתחיל.',
        'backup.cloudSync': 'הגדרות סנכרון ענן',
        'backup.configurSync': 'הגדר סנכרון עם שירותי אחסון בענן.',
        'backup.googleDrive': 'גוגל דרייב',
        'backup.dropbox': 'דרופבוקס',
        'backup.status': 'סטטוס',
        'backup.notConnected': 'לא מחובר',
        'backup.connect': 'התחבר',
        'backup.automatedSchedule': 'לוח זמנים אוטומטי לגיבוי',
        'backup.setSchedule': 'הגדר גיבויים אוטומטיים על בסיס קבוע.',
        'backup.daily': 'יומי',
        'backup.weekly': 'שבועי',
        'backup.monthly': 'חודשי',
        'backup.custom': 'מותאם אישית',
        'backup.saveSettings': 'שמור הגדרות',

        // Import/Export
        'import.title': 'ייבוא וייצוא נתונים',
        'import.importData': 'ייבוא נתונים',
        'import.importDescription': 'העלה קבצי נתונים כדי לייבא מידע למערכת.',
        'import.selectDataType': 'בחר סוג נתונים לייבוא:',
        'import.selectFile': 'בחר קובץ (CSV או Excel):',
        'import.users': 'משתמשים',
        'import.kids': 'ילדים',
        'import.teams': 'קבוצות',
        'import.events': 'אירועים',
        'import.selectedFile': 'קובץ נבחר:',
        'import.size': 'גודל:',
        'import.overwriteRecords': 'דרוס רשומות קיימות',
        'import.skipHeader': 'דלג על שורת כותרת',
        'import.importButton': 'ייבא נתונים',
        'import.exportData': 'ייצוא נתונים',
        'import.exportDescription': 'הורד נתונים מהמערכת כקבצי CSV או Excel.',
        'import.selectExportType': 'בחר סוג נתונים לייצוא:',
        'import.allData': 'כל הנתונים',
        'import.exportFormat': 'פורמט ייצוא:',
        'import.csv': 'CSV',
        'import.excel': 'Excel',
        'import.includeHeaders': 'כלול שורת כותרת',
        'import.includeTimestamp': 'כלול חותמת זמן בשם הקובץ',
        'import.exportButton': 'ייצא נתונים',
        'import.recentActivity': 'פעילות אחרונה',

        // Gallery
        'gallery.title': 'גלריה',
        'gallery.allPhotos': 'כל התמונות',
        'gallery.events': 'אירועים',
        'gallery.races': 'מרוצים',
        'gallery.teams': 'קבוצות',
        'gallery.awards': 'טקסי הוקרה',
        'gallery.uploadPhotos': 'העלה תמונות',
        'gallery.noPhotos': 'לא נמצאו תמונות באלבום זה.',

        // General
        'general.loading': 'טוען...',
        'general.save': 'שמור',
        'general.cancel': 'בטל',
        'general.edit': 'ערוך',
        'general.delete': 'מחק',
        'general.view': 'צפה',
        'general.close': 'סגור',
        'general.yes': 'כן',
        'general.no': 'לא',
        'general.confirm': 'אשר',

        // Language selector
        'language.english': 'English',
        'language.hebrew': 'עברית',
        'language.selectLanguage': 'בחר שפה',

        // Hebrew translations (add to translations.he)
        'login.appTitle': 'אפליקציית פראגרוטרלי',
        'login.title': 'התחברות',
        'login.email': 'אימייל',
        'login.password': 'סיסמה',
        'login.emailPlaceholder': 'הכנס את האימייל שלך',
        'login.passwordPlaceholder': 'הכנס את הסיסמה שלך',
        'login.show': 'הצג',
        'login.hide': 'הסתר',
        'login.signIn': 'התחבר',
        'login.signingIn': 'מתחבר...',
        'login.forgotPassword': 'שכחת סיסמה?',
        'login.mobileSignIn': 'התחבר עם מספר נייד',
        'login.googleSignIn': 'התחבר עם גוגל',
        'login.contactUs': 'צור קשר',
        'login.error': 'כשל בהתחברות. אנא בדוק את פרטי ההתחברות שלך.',
    }
};

// Create the context
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Language provider component
export const LanguageProvider = ({ children }) => {
    // Get initial language from localStorage or default to English
    const getInitialLanguage = () => {
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('charity-app-language');
            if (savedLanguage && Object.values(LANGUAGES).includes(savedLanguage)) {
                return savedLanguage;
            }
        }
        return LANGUAGES.ENGLISH;
    };

    const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);

    // Function to apply RTL/LTR direction to document
    const applyDirection = (language) => {
        if (typeof document !== 'undefined') {
            const isRTL = language === LANGUAGES.HEBREW;
            document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
            document.documentElement.lang = language;

            // Add/remove RTL class to body for additional styling
            if (isRTL) {
                document.body.classList.add('rtl');
                document.body.classList.remove('ltr');
            } else {
                document.body.classList.add('ltr');
                document.body.classList.remove('rtl');
            }
        }
    };

    // Effect to handle language changes
    useEffect(() => {
        // Apply direction
        applyDirection(currentLanguage);

        // Save language preference to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('charity-app-language', currentLanguage);
        }
    }, [currentLanguage]);

    // Function to change language
    const changeLanguage = (newLanguage) => {
        if (Object.values(LANGUAGES).includes(newLanguage)) {
            setCurrentLanguage(newLanguage);
        }
    };

    // Function to get translation
    const t = (key, defaultValue = '') => {
        const translation = translations[currentLanguage]?.[key];
        return translation || defaultValue || key;
    };

    // Computed values
    const isRTL = currentLanguage === LANGUAGES.HEBREW;
    const isHebrew = currentLanguage === LANGUAGES.HEBREW;
    const isEnglish = currentLanguage === LANGUAGES.ENGLISH;

    // Context value
    const value = {
        // Current state
        currentLanguage,
        isRTL,
        isHebrew,
        isEnglish,

        // Functions
        changeLanguage,
        t,

        // Constants
        LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext;