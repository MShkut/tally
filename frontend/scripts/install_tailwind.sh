#!/bin/bash

# Install Tailwind CSS Properly
# Run from frontend directory: bash install_tailwind.sh

echo "🎨 Installing Tailwind CSS properly..."

# Install Tailwind CSS and dependencies
echo "📦 Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
echo "⚙️ Initializing Tailwind CSS..."
npx tailwindcss init -p

# Update tailwind.config.js with proper paths
echo "📝 Configuring Tailwind CSS..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF

# Update index.css to use Tailwind directives
echo "🎨 Updating index.css..."
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: -apple-system, SF Pro Display, system-ui, sans-serif;
  line-height: 1.6;
  font-weight: 400;
  
  /* Editorial color system */
  --bg-primary-light: #fafafa;
  --bg-primary-dark: #000000;
  --text-primary-light: #000000;
  --text-primary-dark: #ffffff;
  --text-secondary-light: #666666;
  --text-secondary-dark: #999999;
  --border-light: #e0e0e0;
  --border-dark: #2a2a2a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

/* Editorial typography */
.light {
  background-color: var(--bg-primary-light);
  color: var(--text-primary-light);
}

.dark {
  background-color: var(--bg-primary-dark);
  color: var(--text-primary-dark);
}

/* Custom range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #d1d5db;
  height: 2px;
  border-radius: 1px;
}

.dark input[type="range"]::-webkit-slider-track {
  background: #374151;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: #000000;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.dark input[type="range"]::-webkit-slider-thumb {
  background: #ffffff;
}

input[type="range"]::-moz-range-track {
  background: #d1d5db;
  height: 2px;
  border-radius: 1px;
  border: none;
}

.dark input[type="range"]::-moz-range-track {
  background: #374151;
}

input[type="range"]::-moz-range-thumb {
  background: #000000;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.dark input[type="range"]::-moz-range-thumb {
  background: #ffffff;
}

/* Focus states for accessibility */
button:focus,
input:focus,
select:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Custom checkbox styling */
input[type="checkbox"] {
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  margin: 0;
  font: inherit;
  color: currentColor;
  width: 1.15em;
  height: 1.15em;
  border: 2px solid currentColor;
  border-radius: 0.15em;
  transform: translateY(-0.075em);
  display: grid;
  place-content: center;
}

input[type="checkbox"]::before {
  content: "";
  width: 0.65em;
  height: 0.65em;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  transform: scale(0);
  transform-origin: bottom left;
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em currentColor;
}

input[type="checkbox"]:checked::before {
  transform: scale(1);
}

/* Remove default button styling */
button {
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
EOF

# Remove Tailwind CDN from index.html
echo "🗑️ Removing Tailwind CDN from index.html..."
sed -i.bak 's|<script src="https://cdn.tailwindcss.com"></script>||g' index.html
rm -f index.html.bak

# Update package.json scripts if needed
echo "📝 Updating package.json scripts..."
npm pkg set scripts.build="vite build"
npm pkg set scripts.dev="vite"

echo ""
echo "✅ Tailwind CSS installed properly!"
echo ""
echo "📋 What was done:"
echo "   ✓ Installed tailwindcss, postcss, autoprefixer"
echo "   ✓ Created tailwind.config.js with proper paths"
echo "   ✓ Updated index.css with Tailwind directives"
echo "   ✓ Removed CDN script from index.html"
echo "   ✓ Configured for editorial design system"
echo ""
echo "🧪 Test your app:"
echo "   npm run dev"
echo ""
echo "🎨 Tailwind is now properly installed for production!"
