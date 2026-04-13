import * as icons from 'simple-icons';

const expectedIcons = [
  'siWhatsapp', 'siFacebook', 'siInstagram', 'siX', 'siSnapchat', 'siTiktok', 'siReddit', 'siThreads', 'siMastodon', 'siBluesky', 'siPinterest',
  'siTelegram', 'siSignal', 'siDiscord', 'siWechat', 'siLine',
  'siGithub', 'siGitlab', 'siStackoverflow', 'siUpwork', 'siCalendly',
  'siDribbble', 'siBehance', 'siArtstation', 'siDeviantart', 'siFigma',
  'siYoutube', 'siTwitch', 'siSpotify', 'siSoundcloud', 'siLastdotfm', 'siBandcamp',
  'siPatreon', 'siKofi', 'siBuymeacoffee',
  'siMedium', 'siSubstack', 'siGoodreads', 'siStoryblok', 'siWattpad', 'siArchiveofourown',
  'siLetterboxd', 'siTrakt', 'siMyanimelist',
  'siSteam', 'siPlaystation',
  'siStrava', 'siAlltrails', 'siKomoot',
  'siUntappd', 'siVivino',
  'siGooglescholar', 'siResearchgate', 'siOrcid',
  'siBoardgamegeek', 'siDiscogs'
];

const missing = expectedIcons.filter(name => !icons[name]);
console.log("Missing icons:", missing);
