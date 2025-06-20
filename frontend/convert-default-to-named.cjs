const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, 'src'); // adjust if needed
const extensions = ['.js', '.jsx', '.ts', '.tsx']; // adjust extensions you want to scan

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (extensions.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const pattern = /import\s+{[^}]*ThemeContext\s+as\s+useTheme[^}]*}\s+from\s+(['"])contexts\/ThemeContext\1/g;

  if (pattern.test(content)) {
    const fixed = content.replace(
      pattern,
      "import { useTheme } from 'contexts/ThemeContext'"
    );

    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Fixed ThemeContext import in: ${filePath}`);
  }
}

const allFiles = walk(rootDir);
allFiles.forEach(fixImports);

console.log('Done fixing ThemeContext imports.');

