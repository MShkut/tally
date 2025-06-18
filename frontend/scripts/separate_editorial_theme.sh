#!/bin/bash

# Separate Editorial Theme Files - Clean Version
# Run from frontend directory: bash separate_editorial_theme.sh

echo "🔧 Separating ThemeProvider and useTheme (editorial style)..."

# Create backup
BACKUP_DIR="./src/backup_editorial_theme_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/contexts"
cp -r ./src/contexts "$BACKUP_DIR/" 2>/dev/null || true
echo "📦 Backup created: $BACKUP_DIR"

# Step 1: Create clean useTheme hook file
echo "📝 Creating clean useTheme.js hook..."

cat > "./src/hooks/useTheme.js" << 'EOF'
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;
EOF

echo "✅ Created: ./src/hooks/useTheme.js"

# Step 2: Create clean editorial ThemeContext (from NEW files)
echo "📝 Creating clean editorial ThemeContext.jsx..."

cat > "./src/contexts/ThemeContext.jsx" << 'EOF'
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'light') {
      setIsDarkMode(false);
    }
  }, []);

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
EOF

echo "✅ Created: ./src/contexts/ThemeContext.jsx (editorial style - default export)"

# Step 3: Update all import statements
echo "🔄 Updating all imports to use separated files..."

# Function to update imports
update_theme_imports() {
    local file="$1"
    echo "🔄 Updating imports in: $file"
    
    # Replace useTheme imports to point to hooks
    sed -i.bak "s|import { useTheme } from '../../contexts/ThemeContext'|import useTheme from '../../hooks/useTheme'|g" "$file"
    sed -i.bak "s|import { useTheme } from '../contexts/ThemeContext'|import useTheme from '../hooks/useTheme'|g" "$file"
    sed -i.bak "s|import useTheme from '../../contexts/ThemeContext'|import useTheme from '../../hooks/useTheme'|g" "$file"
    sed -i.bak "s|import useTheme from '../contexts/ThemeContext'|import useTheme from '../hooks/useTheme'|g" "$file"
    
    # Update ThemeProvider imports to use default import
    sed -i.bak "s|import { ThemeProvider } from '../../contexts/ThemeContext'|import ThemeProvider from '../../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import { ThemeProvider } from '../contexts/ThemeContext'|import ThemeProvider from '../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import { ThemeProvider } from './contexts/ThemeContext'|import ThemeProvider from './contexts/ThemeContext'|g" "$file"
    
    rm -f "${file}.bak"
}

# Update imports in all JS/JSX files
find ./src -name "*.jsx" -o -name "*.js" | while read -r file; do
    if [ -f "$file" ]; then
        update_theme_imports "$file"
    fi
done

echo ""
echo "✅ Editorial theme separation complete!"
echo ""
echo "📋 New structure:"
echo "   📁 src/hooks/useTheme.js          → default export useTheme"
echo "   📁 src/contexts/ThemeContext.jsx  → default export ThemeProvider"
echo ""
echo "📝 Import pattern:"
echo "   import useTheme from '../hooks/useTheme'"
echo "   import ThemeProvider from '../contexts/ThemeContext'"
echo ""
echo "🎨 Editorial features:"
echo "   ✓ Clean black/white/gray only"
echo "   ✓ No accent colors or complex themes"  
echo "   ✓ Simple dark/light mode toggle"
echo "   ✓ All default imports"
echo ""
echo "🧪 Test your app:"
echo "   npm run dev"
