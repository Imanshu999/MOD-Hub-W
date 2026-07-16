import { AppItem, CategoryItem } from './types';

// Deterministic PRNG to ensure the generated catalog is stable across page loads and searches
class DeterministicRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  // Returns float between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  // Returns random integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

// Lists of realistic fragments to combine deterministically
const ADJECTIVES = [
  'Premium', 'Pro', 'Ultra', 'Super', 'Mega', 'Epic', 'Turbo', 'Lite', 'Extreme',
  'Ultimate', 'Master', 'Legendary', 'Infinity', 'Smart', 'Pocket', 'Rapid', 'Apex',
  'Nova', 'Hyper', 'Delta', 'Prime', 'Neon', 'Shadow', 'Cosmic', 'Solar', 'Quantum'
];

const DEV_STUDIOS = [
  'Infinity Games', 'Epic Labs Studio', 'ByteCraft Inc.', 'Noodlecake PE', 'Apex Gamers',
  'Mojang Fan Group', 'Takano3D Labs', 'Voodoo Mods', 'Ketchapp Prime', 'Supercell Team',
  'Tencent Modders', 'ByteDance Studio', 'EA Sports Fan', 'Gameloft Masters', 'Ubisoft Labs',
  'Rockstar Enthusiasts', 'Square Enix Club', 'Sega Classic', 'Capcom Mods', 'Bethesda Crew'
];

const CATEGORIES = [
  { name: 'Action', type: 'Game' as const, icon: 'Sword' },
  { name: 'Arcade', type: 'Game' as const, icon: 'Gamepad2' },
  { name: 'Sports', type: 'Game' as const, icon: 'Trophy' },
  { name: 'Adventure', type: 'Game' as const, icon: 'Compass' },
  { name: 'Video Editor', type: 'App' as const, icon: 'Video' },
  { name: 'Music & Audio', type: 'App' as const, icon: 'Music' },
  { name: 'Social', type: 'App' as const, icon: 'MessageCircle' },
  { name: 'Tools', type: 'App' as const, icon: 'Wrench' },
  { name: 'Productivity', type: 'App' as const, icon: 'Clock' },
];

const WORD_POOL: Record<string, string[]> = {
  'Action': ['Strike', 'Combat', 'Warrior', 'Assault', 'Ninja', 'Sniper', 'Commando', 'Brawler', 'Fighter', 'Rebel', 'Doom', 'Force', 'Vanguard', 'Showdown'],
  'Arcade': ['Dash', 'Jump', 'Runner', 'Bounce', 'Hopper', 'Retro', 'Pinball', 'Brick', 'Blast', 'Sky', 'Space', 'Galaxy', 'Tunnel', 'Racer'],
  'Sports': ['Soccer', 'Football', 'League', 'Manager', 'Trophy', 'Tennis', 'Basketball', 'Golf', 'Rider', 'Skate', 'Stadium', 'Championship', 'Fever', 'Cup'],
  'Adventure': ['Quest', 'Chronicles', 'Journey', 'Explorer', 'Lost', 'Islands', 'Secrets', 'Tomb', 'Temple', 'Realm', 'Odyssey', 'Voyage', 'Wilderness', 'Ruins'],
  'Video Editor': ['Cut', 'Clip', 'Studio', 'Director', 'Maker', 'Vlog', 'FX', 'Filter', 'Crop', 'Trim', 'Merge', 'Composer', 'Transition', 'Render'],
  'Music & Audio': ['Player', 'Equalizer', 'Beats', 'Tuner', 'Synthesizer', 'DJ', 'Sound', 'Streamer', 'Karaoke', 'Melody', 'Acoustic', 'Vibe', 'Bass', 'Mixer'],
  'Social': ['Chat', 'Meet', 'Connect', 'Circle', 'Talk', 'Socialize', 'Gram', 'Ping', 'Channel', 'Feed', 'Room', 'Spaces', 'Messenger', 'Match'],
  'Tools': ['VPN', 'Cleaner', 'Booster', 'Shield', 'Browser', 'Scanner', 'Keyboard', 'File Manager', 'Battery Pro', 'Saver', 'Converter', 'AppLock', 'Optimizer', 'Helper'],
  'Productivity': ['Task', 'Notes', 'Calendar', 'Planner', 'Tracker', 'Organizer', 'Focus', 'Doc Scan', 'Habit', 'Alarm', 'Timer', 'Budget', 'Journal', 'Writer']
};

const APP_DESCRIPTIONS: Record<string, string[]> = {
  'Action': [
    'Unlock ultimate combat skills, infinite ammo, and full weapon inventory to dominate the battlefield.',
    'Fast-paced shooting and action mechanics with MOD menu containing aimbot, godmode, and unlocked custom skins.',
    'Lead your squad to absolute victory with unblocked premium weapons, high fire rates, and speed multipliers.'
  ],
  'Arcade': [
    'Run endlessly with infinite coins, unlocked hoverboards, and resurrection keys for max score multipliers.',
    'Retro classic gameplay upgraded with ad-free play sessions, unique character skins, and immediate double jumps.',
    'Classic level loops with fully unlocked VIP levels, fast game speed toggles, and premium theme packs.'
  ],
  'Sports': [
    'Experience real soccer tournament physics with unlocked stadium passes, elite players, and endless management points.',
    'Compete in high-stakes matches with extended target guidelines, perfect steering adjustments, and adblockers.',
    'Build your ultimate dream team using infinite training cards, premium uniform designs, and double game speed.'
  ],
  'Adventure': [
    'Discover hidden secrets in lost temples with unlimited health, high jump stats, and complete map visibility.',
    'Embark on an epic narrative quest with free VIP dialog unlocks, high-tier armor kits, and rapid speedtravel.',
    'Explore majestic biomes with all paywalled skins, paid resource packs, and god mode activated.'
  ],
  'Video Editor': [
    'Export high-fidelity 4K 60FPS clips instantly without watermarks, premium filters, and VIP transitions.',
    'Unlock all professional speed curves, chroma key adjustments, multi-track audio layers, and template libraries.',
    'An elite creator suite featuring custom AI object removers, aesthetic gold preset filters, and premium audio.'
  ],
  'Music & Audio': [
    'Listen to millions of tracks and premium podcasts offline in lossless HiFi FLAC audio format without ads.',
    'Professional 10-band equalizer with 64-bit precise sound processing and premium custom audio skins.',
    'Stream global FM stations and podcasts completely ad-free with high-priority audio caching.'
  ],
  'Social': [
    'Enjoy completely custom visual themes, stealth ghost mode, and bypass standard attachment file size limits.',
    'A customized messenger platform featuring anti-ban protections, automatic replies, and story downloaders.',
    'Browse social feeds without any sponsored items or tracking logs, with direct high-definition media download.'
  ],
  'Tools': [
    'Bypass regional geo-blocks with super stable encryption tunnels, global server access, and zero logs.',
    'Clean temporary system logs, boost RAM performance instantly, and optimize battery charging speeds ad-free.',
    'Scan and convert documents instantly into premium high-definition PDFs with OCR text extraction.'
  ],
  'Productivity': [
    'Keep your schedules perfectly organized with premium calendar alerts, offline note backup, and priority support.',
    'Focus on tasks with premium background white noise engines, custom category logs, and zero ad interruptions.',
    'Form healthy daily routines with interactive habit tracking lines, premium metric visualizers, and checklists.'
  ]
};

// High quality Unsplash icon category URLs for visual fidelity
const ICON_POOL = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80', // tech/design
  'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=150&auto=format&fit=crop&q=80', // audio
  'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=150&auto=format&fit=crop&q=80', // communication
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=150&auto=format&fit=crop&q=80', // movie/red
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80', // game tech
  'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?w=150&auto=format&fit=crop&q=80', // tool green
  'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=150&auto=format&fit=crop&q=80', // fun color
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80', // controller neon
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80', // tech setup
  'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&auto=format&fit=crop&q=80', // gaming
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', // adventure green
  'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=600&auto=format&fit=crop&q=80'  // epic art
];

const SCREENSHOT_POOL = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80'
];

/**
 * Return only the curated and verified list of real apps/games.
 * Disables the procedural fake item generator to show only high-quality pre-verified items.
 */
export function getMegaCatalog(curatedApps: AppItem[]): AppItem[] {
  return curatedApps;
}

/**
 * Calculate Category counts dynamically based on the total 10,000 items.
 */
export function getDynamicCategories(allApps: AppItem[]): CategoryItem[] {
  const categoryCountMap: Record<string, number> = {};
  
  // Map category icons accurately
  const categoryIconMap: Record<string, string> = {
    'Action': 'Sword',
    'Arcade': 'Gamepad2',
    'Sports': 'Trophy',
    'Adventure': 'Compass',
    'Video Editor': 'Video',
    'Music & Audio': 'Music',
    'Social': 'MessageCircle',
    'Tools': 'Wrench',
    'Productivity': 'Clock'
  };

  // Count each category occurrence
  for (const app of allApps) {
    categoryCountMap[app.category] = (categoryCountMap[app.category] || 0) + 1;
  }

  // Construct CategoryItem array sorted by counts
  return Object.keys(categoryIconMap).map(catName => ({
    name: catName,
    count: categoryCountMap[catName] || 0,
    icon: categoryIconMap[catName]
  }));
}
