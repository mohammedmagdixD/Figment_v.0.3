import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.resolve();

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#000000"/>
  <g transform="translate(192, 160) scale(1.5)">
    <!-- Abstract Play/Media shape -->
    <path d="M 0 0 L 0 128 L 96 64 Z" fill="#ffffff" />
  </g>
</svg>
`;

function generate(size, filename) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(path.join(__dirname, 'public', filename), pngBuffer);
  console.log(`Generated ${filename}`);
}

if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

generate(192, 'icon-192x192.png');
generate(512, 'icon-512x512.png');
generate(128, 'qr-logo.png'); // for the QR code inner logo
fs.writeFileSync(path.join(__dirname, 'public', 'icon.svg'), svg);
