const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, '../dist/amor/browser/index.html');
if (!fs.existsSync(indexPath)) {
  console.error('index.html not found! Build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// Load index.html in JSDOM
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost/'
});

// Wait for the window to load
dom.window.addEventListener('load', () => {
  console.log('Window loaded!');
  
  // Let's wait a bit for Angular initialization
  setTimeout(() => {
    const document = dom.window.document;
    
    console.log('=== DOM Inspect ===');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
      console.log('welcome-screen outerHTML:', welcome.outerHTML.slice(0, 300));
      console.log('welcome-screen style.display:', welcome.style.display);
      console.log('welcome-screen style.opacity:', welcome.style.opacity);
    } else {
      console.log('welcome-screen element not found!');
    }
    
    const lovePage = document.getElementById('love-page');
    if (lovePage) {
      console.log('love-page classList:', lovePage.className);
      console.log('love-page style.display:', lovePage.style.display);
    } else {
      console.log('love-page element not found!');
    }

    const envelope = document.getElementById('envelope');
    if (envelope) {
      console.log('envelope outerHTML:', envelope.outerHTML.slice(0, 300));
    } else {
      console.log('envelope element not found!');
    }
    
    console.log('=== Active Emojis in hearts-container ===');
    const container = document.getElementById('hearts-container');
    if (container) {
      console.log('hearts-container child count:', container.children.length);
      for (let i = 0; i < Math.min(5, container.children.length); i++) {
        console.log(`  Child ${i}:`, container.children[i].outerHTML);
      }
    }
  }, 2000);
});
