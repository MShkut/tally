#!/bin/bash

# Complete Editorial Theme Migration Script
# Run from frontend directory: bash editorial_migration.sh

echo "🎨 Starting complete editorial theme migration..."

# Create backup
BACKUP_DIR="./src/components_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r ./src/components/* "$BACKUP_DIR/"

echo "📦 Backups created in: $BACKUP_DIR"

# Function to apply editorial styling to a component
apply_editorial_styling() {
    local file="$1"
    echo "🔧 Applying editorial styling to $file..."
    
    # Remove decorative elements
    sed -i.tmp 's/rounded-[a-z0-9-]*//' "$file"
    sed -i.tmp 's/shadow-[a-z0-9-]*//' "$file" 
    sed -i.tmp 's/bg-gradient-[a-z0-9-]*//' "$file"
    sed -i.tmp 's/from-[a-z0-9-]*//g' "$file"
    sed -i.tmp 's/to-[a-z0-9-]*//g' "$file"
    
    # Update typography
    sed -i.tmp 's/text-3xl font-bold/text-5xl font-extralight/g' "$file"
    sed -i.tmp 's/text-2xl font-bold/text-3xl font-light/g' "$file"
    sed -i.tmp 's/text-xl font-bold/text-2xl font-light/g' "$file"
    
    # Remove accent colors in favor of gray hierarchy
    sed -i.tmp 's/text-blue-[0-9]*/text-gray-500/g' "$file"
    sed -i.tmp 's/text-purple-[0-9]*/text-gray-500/g' "$file"
    sed -i.tmp 's/text-green-[0-9]*/text-gray-500/g' "$file"
    sed -i.tmp 's/border-blue-[0-9]*/border-gray-300/g' "$file"
    sed -i.tmp 's/border-purple-[0-9]*/border-gray-300/g' "$file"
    
    # Update spacing to be more generous
    sed -i.tmp 's/mb-4/mb-8/g' "$file"
    sed -i.tmp 's/mb-6/mb-12/g' "$file"
    sed -i.tmp 's/gap-4/gap-8/g' "$file"
    sed -i.tmp 's/gap-6/gap-12/g' "$file"
    
    # Clean up temp files
    rm -f "${file}.tmp"
}

# Update all onboarding components
echo "🏠 Updating onboarding components..."
for file in ./src/components/onboarding/*.jsx; do
    apply_editorial_styling "$file"
done

# Update shared components  
echo "🔗 Updating shared components..."
for file in ./src/components/shared/*.jsx; do
    apply_editorial_styling "$file"
done

# Update styled components
echo "💫 Updating styled components..."
if [ -f "./src/components/styled/StyledComponents.jsx" ]; then
    apply_editorial_styling "./src/components/styled/StyledComponents.jsx"
fi

# Update specific problematic patterns
echo "🔨 Fixing specific patterns..."

# Update all Card usages to use border-t instead
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/<Card>/<div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"} pt-8`}>/g' {} \;
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/<\/Card>/<\/div>/g' {} \;

# Remove Card imports
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/import.*Card.*from.*StyledComponents.*;//g' {} \;
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/, Card//g' {} \;
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/Card, //g' {} \;

# Update button styling to be minimal
find ./src/components -name "*.jsx" -exec sed -i.tmp 's/bg-blue-[0-9]* hover:bg-blue-[0-9]* text-white/border border-current hover:border-current transition-colors/g' {} \;

# Clean up all temp files
find ./src/components -name "*.tmp" -delete

echo ""
echo "🎉 Editorial migration completed!"
echo ""
echo "✅ Updated components:"
echo "   - All onboarding components"
echo "   - All shared components" 
echo "   - Styled components"
echo "   - Removed decorative elements"
echo "   - Updated typography hierarchy"
echo "   - Applied generous spacing"
echo ""
echo "📝 Manual review needed:"
echo "   1. Check each component renders correctly"
echo "   2. Verify typography looks editorial"
echo "   3. Ensure no broken imports"
echo "   4. Test dark/light mode switching"
echo ""
echo "🚀 Run 'npm run dev' to test!"
