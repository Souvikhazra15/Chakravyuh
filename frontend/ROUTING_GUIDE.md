# Frontend Routing & Navigation Guide

## Quick Start

### Development Server
```bash
cd frontend
npm install
npm run dev
```

Runs on: `http://localhost:3001`

---

## Route Structure

### Public Routes
- `/` - Landing Page
- `/login` - Login Page
- `/architecture` - System Architecture (Demo)

### Protected Routes (Requires Authentication)

#### Peon Dashboard
- **Route**: `/dashboard/peon`
- **Role**: `peon`
- **Features**:
  - Weekly facility report form
  - Category, condition, notes input
  - Photo upload (optional)
  - Submit confirmation

#### Principal Dashboard
- **Route**: `/dashboard/principal`
- **Role**: `principal`
- **Features**:
  - School status overview
  - Total issues count
  - Critical issues count
  - Issues table with:
    - Category, Condition, Risk Score, Priority Level, Days to Failure
  - Approve Repair button

#### DEO Dashboard
- **Route**: `/dashboard/deo`
- **Role**: `deo`
- **Features**:
  - District-level statistics (Critical, High, Pending counts)
  - Prioritized maintenance queue table
  - Filterable by priority, school, days to failure
  - Color-coded priority levels:
    - Red: Critical
    - Yellow: High
    - Blue: Medium
    - Green: Low
  - Assign Contractor action button

#### Contractor Dashboard
- **Route**: `/dashboard/contractor`
- **Role**: `contractor`
- **Features**:
  - Work orders list
  - Work order statistics (total, in progress, completed)
  - Work order details
  - Completion form with:
    - Notes input
    - Photo upload
    - GPS location capture
  - Mark as Completed button

---

## Authentication Flow

1. User visits `/login`
2. Submits credentials
3. Backend returns JWT token + user data
4. Token stored in localStorage
5. User redirected to their role-based dashboard
6. Protected routes check role and redirect accordingly

### Token Management
```javascript
// Get token
const token = localStorage.getItem('token');

// Use in API calls
headers: {
  'Authorization': `Bearer ${token}`
}

// Logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---

## Component Architecture

```
App.jsx (Router)
├── LoginPage
├── LandingPage
├── SystemArchitecture
├── ProtectedRoute (role-based)
│   ├── DashboardPeon
│   ├── DashboardPrincipal
│   ├── DashboardDEO
│   └── DashboardContractor
└── Contexts
    ├── AuthContext (user, token, login, logout)
    └── ThemeContext (isDark, toggleTheme)
```

---

## Theme Support

All dashboards support light and dark modes via Tailwind CSS:

```javascript
const { isDark } = useTheme();

// Usage in className
className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
```

---

## Form Handling

### Peon Report Form
```javascript
const [formData, setFormData] = useState({
  category: '',
  condition: '',
  notes: ''
});

const handleSubmit = async (e) => {
  e.preventDefault();
  // POST to /api/v1/reports/submit
};
```

### Contractor Completion Form
```javascript
const [completionData, setCompletionData] = useState({
  notes: '',
  photo: null,
  latitude: '',
  longitude: ''
});

// GPS Location
navigator.geolocation.getCurrentPosition((position) => {
  setCompletionData({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  });
});

// File Upload
const handleFileUpload = (e) => {
  setCompletionData({ photo: e.target.files[0] });
};

// FormData with file
const formData = new FormData();
formData.append('photo', completionData.photo);
```

---

## Data Fetching Pattern

```javascript
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/endpoint', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

---

## Colors & Styling

### Priority Level Colors
```javascript
const getPriorityColor = (level) => {
  switch(level) {
    case 'Critical': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-yellow-100 text-yellow-800';
    case 'Medium': return 'bg-blue-100 text-blue-800';
    case 'Low': return 'bg-green-100 text-green-800';
  }
};
```

### Dark Mode Support
```javascript
isDark ? 'bg-gray-800' : 'bg-white'
isDark ? 'text-gray-300' : 'text-gray-700'
isDark ? 'border-gray-700' : 'border-gray-200'
```

---

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://127.0.0.1:8000
```

Usage:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

---

## Responsive Design

All dashboards use Tailwind's grid system:
```javascript
// Mobile first
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Stack on mobile, 2 columns on tablet, 3 on desktop
```

---

## Icons (Lucide React)

```javascript
import { 
  LogOut, FileText, AlertTriangle, CheckCircle,
  Briefcase, Hammer, MapPin, Zap, BarChart3,
  Camera, MapPin, Clock
} from 'lucide-react';

<LogOut size={18} />
```

---

## State Management Pattern

```javascript
// Local component state
const [issues, setIssues] = useState([]);
const [loading, setLoading] = useState(true);

// Global auth state
const { user, logout } = useAuth();

// Global theme state
const { isDark } = useTheme();
```
