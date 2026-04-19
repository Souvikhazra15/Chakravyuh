# ShalaRakshak Landing Page

AI-Powered Predictive Maintenance System for Government Schools

## Features

- ✨ Modern, responsive React landing page
- 🎨 Beautiful Tailwind CSS styling with gradients
- 📱 Mobile-first responsive design
- 🚀 Fast development with Vite
- 🎯 Component-based architecture
- ♿ Accessible and semantic HTML

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (runs on http://localhost:3000)
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── LandingPage.jsx    # Main landing page component
│   ├── App.jsx                # Root component
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind CSS setup
├── index.html                 # HTML template
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js             # Vite configuration
├── postcss.config.js          # PostCSS configuration
└── package.json               # Dependencies and scripts
```

## Features Implemented

### Hero Section
- Eye-catching gradient background
- Clear value proposition
- Dual CTA buttons (View Demo / Get Started)
- Trust indicators

### Problem Section
- Key statistics highlighting the challenge
- Featured cards with icons
- Context about Gujarat schools

### Features Section
- 6 feature cards with icons (from lucide-react)
- Hover effects and smooth transitions
- Clear descriptions of each capability

### Workflow Section
- 6-step process visualization
- Connected step indicators
- Clear labeling and descriptions

### Use Cases Section
- Role-based cards (Staff, Principal, DEO, Contractor)
- Emoji icons for quick recognition
- Specific benefits per role

### Technology Section
- Gradient background
- 3 key technology pillars
- Glassmorphism effect

### CTA Section
- Final call-to-action
- Clear positioning

### Footer
- Multi-column layout
- Links organization
- Social media links

## Styling

- **Color Scheme**: Blue → Purple → Teal gradients
- **Typography**: Clean, readable font hierarchy
- **Spacing**: Consistent padding and margins
- **Rounded Cards**: XL border radius (xl) for modern look
- **Shadows**: Soft, subtle shadows for depth
- **Hover Effects**: Smooth transitions and scale transforms

## Customization

### Colors
Edit `tailwind.config.js` to change the color scheme

### Content
Edit the arrays in `src/pages/LandingPage.jsx` to customize section content

### Fonts
Tailwind uses system fonts by default. Update `tailwind.config.js` to add custom fonts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading ready
- Optimized bundle size
- CSS-in-JS with Tailwind (no runtime overhead)
- React 18 with automatic batching

## Future Enhancements

- [ ] Add smooth scroll animations on page load
- [ ] Implement intersection observers for reveal effects
- [ ] Add testimonials section
- [ ] Create mobile navigation menu
- [ ] Add form validation for CTA buttons
- [ ] Integrate with backend API
