const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', '@3d-dice', 'dice-box', 'dist', 'assets');
const dest = path.join(__dirname, '..', 'public', 'assets', 'dice-box');

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('Copied dice-box assets to public/assets/dice-box');
}
