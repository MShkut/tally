#!/bin/bash

# Fix All Theme Import Paths
# Run from frontend directory: bash fix_theme_imports.sh

echo "🔧 Fixing all useTheme import paths..."

# Function to fix imports in a file
fix_theme_imports() {
    local file="$1"
    echo "🔄 Fixing imports in: $file"
    
    # Replace useTheme imports from hooks back to contexts
    sed -i.bak "s|import useTheme from '../../hooks/useTheme'|import { useTheme } from '../../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import useTheme from '../hooks/useTheme'|import { useTheme } from '../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import useTheme from './hooks/useTheme'|import { useTheme } from './contexts/ThemeContext'|g" "$file"
    
    # Also handle any remaining default imports that should be named imports
    sed -i.bak "s|import useTheme from '../../contexts/ThemeContext'|import { useTheme } from '../../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import useTheme from '../contexts/ThemeContext'|import { useTheme } from '../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import useTheme from './contexts/ThemeContext'|import { useTheme } from './contexts/ThemeContext'|g" "$file"
    
    # Fix ThemeProvider imports to be named imports too
    sed -i.bak "s|import ThemeProvider from '../../contexts/ThemeContext'|import { ThemeProvider } from '../../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import ThemeProvider from '../contexts/ThemeContext'|import { ThemeProvider } from '../contexts/ThemeContext'|g" "$file"
    sed -i.bak "s|import ThemeProvider from './contexts/ThemeContext'|import { ThemeProvider } from './contexts/ThemeContext'|g" "$file"
    
    rm -f "${file}.bak"
}

# Fix imports in all JS/JSX files
find ./src -name "*.jsx" -o -name "*.js" | while read -r file; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "ThemeContext.jsx" ]; then
        fix_theme_imports "$file"
    fi
done

# Remove the hooks/useTheme.js file if it exists
if [ -f "./src/hooks/useTheme.js" ]; then
    echo "🗑️  Removing src/hooks/useTheme.js"
    rm "./src/hooks/useTheme.js"
fi

echo ""
echo "✅ Fixed all theme import paths!"
echo ""
echo "📝 All imports now use:"
echo "   import { useTheme } from '../contexts/ThemeContext'"
echo "   import { ThemeProvider } from '../contexts/ThemeContext'"
echo ""
echo "🧪 Test your app:"
echo "   npm run dev"
