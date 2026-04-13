import { Phone, Globe } from 'lucide-react';
import {
  siWhatsapp, siFacebook, siInstagram, siX, siSnapchat, siTiktok, siReddit, siThreads, siMastodon, siBluesky, siPinterest,
  siTelegram, siSignal, siDiscord, siWechat, siLine,
  siGithub, siGitlab, siStackoverflow, siUpwork, siCalendly,
  siDribbble, siBehance, siArtstation, siDeviantart, siFigma,
  siYoutube, siTwitch, siSpotify, siSoundcloud, siLastdotfm, siBandcamp,
  siPatreon, siKofi, siBuymeacoffee,
  siMedium, siSubstack, siGoodreads, siStoryblok, siWattpad, siArchiveofourown,
  siLetterboxd, siTrakt, siMyanimelist,
  siSteam, siPlaystation,
  siStrava, siAlltrails, siKomoot,
  siUntappd, siVivino,
  siGooglescholar, siResearchgate, siOrcid,
  siBoardgamegeek, siDiscogs
} from 'simple-icons';

// Note: Some icons might not exist exactly as named in simple-icons, we will fallback to a generic link icon if needed, but we try to import the closest ones.
// StoryGraph, Fable, Serializd, Beli, Cosmos might not be in simple-icons, we will use a generic icon or omit if missing.

export const SOCIAL_PLATFORMS: Record<string, any> = {
  // Generic
  phone: { name: "Phone Number", category: "Generic", hex: "#808080", urlTemplate: "tel:{handle}", icon: Phone },
  personal_website: { name: "Personal Website", category: "Generic", hex: "custom", urlTemplate: "{handle}", icon: Globe },
  whatsapp: { name: "WhatsApp", category: "Generic", hex: `#${siWhatsapp.hex}`, urlTemplate: "https://wa.me/{handle}", icon: siWhatsapp },

  // Social Media
  facebook: { name: "Facebook", category: "Social Media", hex: `#${siFacebook.hex}`, urlTemplate: "https://facebook.com/{handle}", icon: siFacebook },
  instagram: { name: "Instagram", category: "Social Media", hex: `#${siInstagram.hex}`, urlTemplate: "https://instagram.com/{handle}", icon: siInstagram },
  x: { name: "X", category: "Social Media", hex: `#${siX.hex}`, urlTemplate: "https://x.com/{handle}", icon: siX },
  snapchat: { name: "Snapchat", category: "Social Media", hex: `#${siSnapchat.hex}`, urlTemplate: "https://snapchat.com/add/{handle}", icon: siSnapchat },
  tiktok: { name: "TikTok", category: "Social Media", hex: `#${siTiktok.hex}`, urlTemplate: "https://tiktok.com/@{handle}", icon: siTiktok },
  reddit: { name: "Reddit", category: "Social Media", hex: `#${siReddit.hex}`, urlTemplate: "https://reddit.com/user/{handle}", icon: siReddit },
  threads: { name: "Threads", category: "Social Media", hex: `#${siThreads.hex}`, urlTemplate: "https://threads.net/@{handle}", icon: siThreads },
  mastodon: { name: "Mastodon", category: "Social Media", hex: `#${siMastodon.hex}`, urlTemplate: "https://mastodon.social/@{handle}", icon: siMastodon },
  bluesky: { name: "Bluesky", category: "Social Media", hex: `#${siBluesky.hex}`, urlTemplate: "https://bsky.app/profile/{handle}", icon: siBluesky },
  pinterest: { name: "Pinterest", category: "Social Media", hex: `#${siPinterest.hex}`, urlTemplate: "https://pinterest.com/{handle}", icon: siPinterest },

  // Messaging
  telegram: { name: "Telegram", category: "Messaging", hex: `#${siTelegram.hex}`, urlTemplate: "https://t.me/{handle}", icon: siTelegram },
  signal: { name: "Signal", category: "Messaging", hex: `#${siSignal.hex}`, urlTemplate: "https://signal.me/#u/{handle}", icon: siSignal },
  discord: { name: "Discord", category: "Messaging", hex: `#${siDiscord.hex}`, urlTemplate: "https://discord.com/users/{handle}", icon: siDiscord },
  wechat: { name: "WeChat", category: "Messaging", hex: `#${siWechat.hex}`, urlTemplate: "weixin://dl/chat?{handle}", icon: siWechat },
  line: { name: "Line", category: "Messaging", hex: `#${siLine.hex}`, urlTemplate: "https://line.me/ti/p/~{handle}", icon: siLine },

  // Professional
  github: { name: "GitHub", category: "Professional", hex: `#${siGithub.hex}`, urlTemplate: "https://github.com/{handle}", icon: siGithub },
  gitlab: { name: "GitLab", category: "Professional", hex: `#${siGitlab.hex}`, urlTemplate: "https://gitlab.com/{handle}", icon: siGitlab },
  stackoverflow: { name: "Stack Overflow", category: "Professional", hex: `#${siStackoverflow.hex}`, urlTemplate: "https://stackoverflow.com/users/{handle}", icon: siStackoverflow },
  upwork: { name: "Upwork", category: "Professional", hex: `#${siUpwork.hex}`, urlTemplate: "https://upwork.com/freelancers/~{handle}", icon: siUpwork },
  calendly: { name: "Calendly", category: "Professional", hex: `#${siCalendly.hex}`, urlTemplate: "https://calendly.com/{handle}", icon: siCalendly },

  // Design & Visual
  cosmos: { name: "Cosmos", category: "Design & Visual", hex: "#000000", urlTemplate: "https://cosmos.so/{handle}", icon: Globe }, // Fallback
  dribbble: { name: "Dribbble", category: "Design & Visual", hex: `#${siDribbble.hex}`, urlTemplate: "https://dribbble.com/{handle}", icon: siDribbble },
  behance: { name: "Behance", category: "Design & Visual", hex: `#${siBehance.hex}`, urlTemplate: "https://behance.net/{handle}", icon: siBehance },
  artstation: { name: "ArtStation", category: "Design & Visual", hex: `#${siArtstation.hex}`, urlTemplate: "https://artstation.com/{handle}", icon: siArtstation },
  deviantart: { name: "DeviantArt", category: "Design & Visual", hex: `#${siDeviantart.hex}`, urlTemplate: "https://deviantart.com/{handle}", icon: siDeviantart },
  figma: { name: "Figma", category: "Design & Visual", hex: `#${siFigma.hex}`, urlTemplate: "https://figma.com/@{handle}", icon: siFigma },

  // Video & Audio
  youtube: { name: "YouTube", category: "Video & Audio", hex: `#${siYoutube.hex}`, urlTemplate: "https://youtube.com/@{handle}", icon: siYoutube },
  twitch: { name: "Twitch", category: "Video & Audio", hex: `#${siTwitch.hex}`, urlTemplate: "https://twitch.tv/{handle}", icon: siTwitch },
  spotify: { name: "Spotify", category: "Video & Audio", hex: `#${siSpotify.hex}`, urlTemplate: "https://open.spotify.com/user/{handle}", icon: siSpotify },
  soundcloud: { name: "SoundCloud", category: "Video & Audio", hex: `#${siSoundcloud.hex}`, urlTemplate: "https://soundcloud.com/{handle}", icon: siSoundcloud },
  lastfm: { name: "Last.fm", category: "Video & Audio", hex: `#${siLastdotfm.hex}`, urlTemplate: "https://last.fm/user/{handle}", icon: siLastdotfm },
  bandcamp: { name: "Bandcamp", category: "Video & Audio", hex: `#${siBandcamp.hex}`, urlTemplate: "https://{handle}.bandcamp.com", icon: siBandcamp },
  rateyourmusic: { name: "RateYourMusic", category: "Video & Audio", hex: "#2C508C", urlTemplate: "https://rateyourmusic.com/~{handle}", icon: Globe }, // Fallback

  // Creator
  patreon: { name: "Patreon", category: "Creator", hex: `#${siPatreon.hex}`, urlTemplate: "https://patreon.com/{handle}", icon: siPatreon },
  kofi: { name: "Ko-fi", category: "Creator", hex: `#${siKofi.hex}`, urlTemplate: "https://ko-fi.com/{handle}", icon: siKofi },
  buymeacoffee: { name: "Buy Me a Coffee", category: "Creator", hex: `#${siBuymeacoffee.hex}`, urlTemplate: "https://buymeacoffee.com/{handle}", icon: siBuymeacoffee },

  // Reading & Lit
  medium: { name: "Medium", category: "Reading & Lit", hex: `#${siMedium.hex}`, urlTemplate: "https://medium.com/@{handle}", icon: siMedium },
  substack: { name: "Substack", category: "Reading & Lit", hex: `#${siSubstack.hex}`, urlTemplate: "https://{handle}.substack.com", icon: siSubstack },
  goodreads: { name: "Goodreads", category: "Reading & Lit", hex: `#${siGoodreads.hex}`, urlTemplate: "https://goodreads.com/user/show/{handle}", icon: siGoodreads },
  storygraph: { name: "StoryGraph", category: "Reading & Lit", hex: "#3EA7A9", urlTemplate: "https://app.thestorygraph.com/profile/{handle}", icon: Globe }, // Fallback
  fable: { name: "Fable", category: "Reading & Lit", hex: "#D16F48", urlTemplate: "https://fable.co/{handle}", icon: Globe }, // Fallback
  wattpad: { name: "Wattpad", category: "Reading & Lit", hex: `#${siWattpad.hex}`, urlTemplate: "https://wattpad.com/user/{handle}", icon: siWattpad },
  archiveofourown: { name: "Archive of Our Own", category: "Reading & Lit", hex: `#${siArchiveofourown.hex}`, urlTemplate: "https://archiveofourown.org/users/{handle}", icon: siArchiveofourown },

  // Film & TV
  letterboxd: { name: "Letterboxd", category: "Film & TV", hex: `#${siLetterboxd.hex}`, urlTemplate: "https://letterboxd.com/{handle}", icon: siLetterboxd },
  serializd: { name: "Serializd", category: "Film & TV", hex: "#613EEB", urlTemplate: "https://serializd.com/user/{handle}", icon: Globe }, // Fallback
  trakt: { name: "Trakt", category: "Film & TV", hex: `#${siTrakt.hex}`, urlTemplate: "https://trakt.tv/users/{handle}", icon: siTrakt },
  myanimelist: { name: "MyAnimeList", category: "Film & TV", hex: `#${siMyanimelist.hex}`, urlTemplate: "https://myanimelist.net/profile/{handle}", icon: siMyanimelist },

  // Gaming
  steam: { name: "Steam", category: "Gaming", hex: `#${siSteam.hex}`, urlTemplate: "https://steamcommunity.com/id/{handle}", icon: siSteam },
  playstation: { name: "PlayStation (PSN)", category: "Gaming", hex: `#${siPlaystation.hex}`, urlTemplate: "https://psnprofiles.com/{handle}", icon: siPlaystation },

  // Fitness
  strava: { name: "Strava", category: "Fitness", hex: `#${siStrava.hex}`, urlTemplate: "https://strava.com/athletes/{handle}", icon: siStrava },
  alltrails: { name: "AllTrails", category: "Fitness", hex: `#${siAlltrails.hex}`, urlTemplate: "https://alltrails.com/members/{handle}", icon: siAlltrails },
  komoot: { name: "Komoot", category: "Fitness", hex: `#${siKomoot.hex}`, urlTemplate: "https://komoot.com/user/{handle}", icon: siKomoot },

  // Food & Drink
  untappd: { name: "Untappd", category: "Food & Drink", hex: `#${siUntappd.hex}`, urlTemplate: "https://untappd.com/user/{handle}", icon: siUntappd },
  vivino: { name: "Vivino", category: "Food & Drink", hex: `#${siVivino.hex}`, urlTemplate: "https://vivino.com/users/{handle}", icon: siVivino },
  beli: { name: "Beli", category: "Food & Drink", hex: "#134F5C", urlTemplate: "https://beliapp.co/app/{handle}", icon: Globe }, // Fallback

  // Academia
  googlescholar: { name: "Google Scholar", category: "Academia", hex: `#${siGooglescholar.hex}`, urlTemplate: "https://scholar.google.com/citations?user={handle}", icon: siGooglescholar },
  researchgate: { name: "ResearchGate", category: "Academia", hex: `#${siResearchgate.hex}`, urlTemplate: "https://researchgate.net/profile/{handle}", icon: siResearchgate },
  orcid: { name: "ORCID", category: "Academia", hex: `#${siOrcid.hex}`, urlTemplate: "https://orcid.org/{handle}", icon: siOrcid },

  // Tabletop
  boardgamegeek: { name: "BoardGameGeek", category: "Tabletop", hex: `#${siBoardgamegeek.hex}`, urlTemplate: "https://boardgamegeek.com/user/{handle}", icon: siBoardgamegeek },
  discogs: { name: "Discogs", category: "Tabletop", hex: `#${siDiscogs.hex}`, urlTemplate: "https://discogs.com/user/{handle}", icon: siDiscogs },
};
