const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/amor/browser/index.html');
if (!fs.existsSync(indexPath)) {
  console.error('index.html not found at', indexPath);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// Extract the style tag with ng-app-id="ng"
const styleMatch = html.match(/<style ng-app-id="ng">([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.error('Style tag ng-app-id="ng" not found!');
  process.exit(1);
}

const css = styleMatch[1];
console.log('Total CSS length:', css.length);

const classesToCheck = [
  'welcome-screen',
  'envelope-wrapper',
  'floating-hearts-deco',
  'mini-heart',
  'envelope',
  'envelope-back',
  'envelope-body',
  'envelope-flap',
  'envelope-letter',
  'letter-content',
  'envelope-seal',
  'tap-hint',
  'enter-btn',
  'love-page',
  'hero-section',
  'hero-tree-wrap',
  'love-tree-canvas'
];

classesToCheck.forEach(cls => {
  const contains = css.includes(cls);
  console.log(`Contains class "${cls}":`, contains);
  if (contains) {
    // Find some context around it
    const idx = css.indexOf(cls);
    const start = Math.max(0, idx - 40);
    const end = Math.min(css.length, idx + 80);
    console.log(`  Snippet: ${css.slice(start, end)}`);
  }
});
