const fs = require('fs');
let content = fs.readFileSync('src/constants/socialPlatforms.ts', 'utf8');

content = content.replace(/hex:\s*"#[A-Fa-f0-9]+"(.*?)icon:\s*(si[A-Za-z0-9]+)\s*}/g, 'hex: `#${$2.hex}`$1icon: $2 }');

fs.writeFileSync('src/constants/socialPlatforms.ts', content);
