import { SOCIAL_PLATFORMS } from './src/constants/socialPlatforms.js';

const missingIcons = Object.entries(SOCIAL_PLATFORMS).filter(([id, def]) => !def.icon).map(([id]) => id);
console.log("Platforms with missing icons:", missingIcons);
