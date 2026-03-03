import { Code, Gamepad2, Globe, Palette, PenTool, Shapes, type LucideIcon } from 'lucide-react';

export interface ArenaPreset {
  label: string;
  prompt: string;
}

export interface ArenaMode {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  presets: ArenaPreset[];
}

export const ARENA_MODES: ArenaMode[] = [
  {
    id: 'p5',
    name: 'P5.js',
    icon: Palette,
    description: 'Interactive graphics',
    presets: [
      { label: '🐦 birds', prompt: 'flock of birds' },
      { label: '⏰ clock', prompt: 'analog clock' },
      { label: '🖼️ portrait', prompt: 'an abstract self portrait' },
      { label: '😵💫 illusion', prompt: 'an optical illusion' },
      { label: '💧 raindrops', prompt: 'raindrops' },
      { label: '📺 TV', prompt: 'simulation of a TV with different channels' },
      { label: '🌈 kaleidoscope', prompt: 'colorful interactive kaleidoscope' },
      { label: '🎉 confetti', prompt: 'confetti' },
      { label: '🎆 fireworks', prompt: 'fireworks' },
      { label: '🐜 ants', prompt: 'ant simulation' },
      { label: '✨ fireflies', prompt: 'fireflies' },
      { label: '🌳 fractal', prompt: 'fractal tree' },
      { label: '🌊 pond', prompt: 'pond ripples' },
      { label: '🚲 pelican riding bicycle', prompt: 'a pelican riding a bicycle' },
      { label: '⚡ particle system', prompt: 'interactive particle system' },
      { label: '🌀 maze generator', prompt: 'maze generator and solver' },
      { label: '🎵 music visualizer', prompt: 'music visualizer with waveforms' },
    ],
  },
  {
    id: 'svg',
    name: 'SVG',
    icon: Shapes,
    description: 'Vector graphics',
    presets: [
      { label: '🦄 unicorn', prompt: 'a unicorn' },
      { label: '🦀 crab', prompt: 'a crab' },
      { label: '🐭 mouse', prompt: 'a cute mouse' },
      { label: '🚲 pelican riding bicycle', prompt: 'a pelican riding a bicycle' },
      { label: '🍉 watermelon', prompt: 'a watermelon' },
      { label: '🎂 cake', prompt: 'a birthday cake' },
      { label: '🍦 ice cream', prompt: 'an ice cream cone' },
      { label: '🏙️ city', prompt: 'a city' },
      { label: '🏖️ beach', prompt: 'a beach' },
      { label: '💻 computer', prompt: 'a computer' },
      { label: '🖥️ GUI', prompt: 'a computer GUI with labels' },
      { label: '🛋️ floor plan', prompt: 'a living room floor plan with labels' },
      { label: '🤖 robot', prompt: 'a robot' },
      { label: '🌸 flower', prompt: 'a detailed flower with petals and stem' },
      { label: '🚀 rocket', prompt: 'a rocket ship blasting off' },
      { label: '⏰ clock', prompt: 'an analog clock with numbers' },
    ],
  },
  {
    id: 'html',
    name: 'HTML/JS',
    icon: Code,
    description: 'Web applications',
    presets: [
      { label: '☀️ weather app', prompt: 'a simulated weather app' },
      { label: '📝 todo list', prompt: 'a todo list' },
      { label: '🪙 coin flip', prompt: 'coin flipping app, with an animated coin' },
      { label: '🗓️ calendar', prompt: 'a calendar' },
      { label: '🧮 calculator', prompt: 'a calculator' },
      { label: '🎮 tic-tac-toe', prompt: 'tic tac toe game where you play against the computer' },
      { label: '✏️ drawing app', prompt: 'simple drawing app' },
      { label: '🎨 pixel art', prompt: 'pixel art painting app' },
      { label: '📎 infinite paperclip game', prompt: 'infinite paperclip game' },
      { label: '🖥️ computer terminal', prompt: 'a vintage computer terminal simulation' },
      { label: '🧠 memory game', prompt: 'a memory game' },
      { label: '🎹 piano keyboard', prompt: 'interactive piano keyboard' },
      { label: '🐍 snake game', prompt: 'classic snake game' },
      { label: '🎨 color picker', prompt: 'color picker tool with hex codes' },
      {
        label: '🖥️ browser OS',
        prompt: `Generate a browser OS with the following features:
- At least 5 applications
- Two of the 5 applications must be FUNCTIONAL games
- Ability to change wallpaper
- A "special" feature that you decide on and document what it is & why it is special.`,
      },
    ],
  },
  {
    id: 'three',
    name: 'Three.js',
    icon: PenTool,
    description: '3D graphics',
    presets: [
      {
        label: '📦 cubes',
        prompt: 'a dynamic 3D grid of cubes that react to mouse position by changing scale and color',
      },
      {
        label: '🌌 galaxy',
        prompt:
          'a procedural colorful galaxy with thousands of randomly placed and sized stars (spheres with basic materials)',
      },
      {
        label: '👤 figure',
        prompt:
          'a 3D figure created using basic geometric shapes (spheres for head, cylinders for limbs, etc.) with different colors',
      },
      { label: '🐭 mouse', prompt: 'a cute 3D mouse' },
      { label: '🏀 bouncing ball', prompt: 'a bouncing 3D ball that casts a dynamic shadow on a plane' },
      {
        label: '🌊 undulating surface',
        prompt: 'something interesting using the Math.sin() function to create an undulating surface in 3D',
      },
      {
        label: '🍩 donuts',
        prompt: 'a scene composed entirely of interconnected tori (donut shapes) forming a complex structure',
      },
      { label: '🪑 table', prompt: 'a 3D table and chairs' },
      { label: '🌳 trees', prompt: 'a 3D terrain with trees and blue sky' },
      { label: '☀️ solar system', prompt: 'a miniature solar system with planets orbiting the sun' },
      { label: '🏔️ terrain', prompt: 'procedural terrain with height mapping' },
      { label: '✨ particle fountain', prompt: '3D particle fountain with physics' },
    ],
  },
  {
    id: 'games',
    name: 'Games',
    icon: Gamepad2,
    description: '2D & 3D browser games',
    presets: [
      {
        label: '🔨 whack-a-mole',
        prompt:
          'Whack-a-Mole: moles pop up from holes at random intervals, click to whack them. Show score and a countdown timer. Play a satisfying hit animation when a mole is whacked. Show a game-over screen with final score and a restart button.',
      },
      {
        label: '👾 space invaders',
        prompt:
          'Space Invaders: multiple rows of aliens march side-to-side and descend, shooting back at the player. Include player lives, score, increasing march speed per wave, shields, and a game-over / victory screen with restart.',
      },
      {
        label: '🧱 breakout',
        prompt:
          'Breakout (Arkanoid): multiple rows of colour-coded bricks, a bouncing ball, and a paddle controlled by mouse or arrow keys. Include lives, score, brick destruction animations, and a win/lose screen with restart.',
      },
      {
        label: '🐸 frogger',
        prompt:
          'Frogger: guide a frog across lanes of moving cars and rows of floating logs over water to reach the safe zone. Multiple lives, score, increasing speed over time, and a game-over screen with restart.',
      },
      {
        label: '🟡 pac-man',
        prompt:
          'Pac-Man: a maze filled with dots and power-pellets, 4 ghost enemies with basic chase/scatter AI that turn blue when a power-pellet is eaten. Include score, lives, level progression, and a game-over screen with restart.',
      },
      {
        label: '🪂 flappy bird',
        prompt:
          'Flappy Bird: tap or click to flap, dodge endlessly scrolling pipe obstacles with random gap heights. Show a score counter that increments on each pipe passed, and an animated game-over screen with high score and restart.',
      },
      {
        label: '🎯 3D shooting gallery',
        prompt:
          '3D shooting gallery (Three.js): colourful targets pop up at random positions on a 3D fairground stage, the player clicks to shoot them. Include a countdown timer, score, miss penalty, combo multiplier, and a game-over screen with final score and restart.',
      },
      {
        label: '🏎️ 3D endless driving',
        prompt:
          '3D endless driving game (Three.js): the player steers a car along a road dodging oncoming traffic that speeds up over time. Show speed/distance score, lives represented as car icons, and a game-over screen with restart.',
      },
      {
        label: '🚀 3D space shooter',
        prompt:
          '3D space shooter (Three.js): third-person or rail shooter where the player ship fires at waves of incoming enemy ships. Include explosion particle effects, score, shields/lives display, escalating waves, and a game-over screen with restart.',
      },
      {
        label: '🎱 3D ball maze',
        prompt:
          '3D labyrinth / ball-maze game (Three.js): tilt the maze with arrow keys or mouse drag to roll a ball through corridors to the exit hole without falling. Add a timer, level counter, a win screen, and a restart button.',
      },
      {
        label: '🍄 platformer',
        prompt:
          'Side-scrolling platformer in the style of Super Mario Bros: a character that can run left/right and jump, multiple platforms at varying heights, coins to collect, enemies that walk back and forth (stomp them to defeat), a flagpole goal at the end of the level. Show score, coin count, and lives. Include a game-over and level-complete screen with restart.',
      },
      {
        label: '🟦 tetris',
        prompt:
          'Tetris: all 7 tetrominoes in classic colours, gravity that accelerates over time, left/right/down arrow movement, up arrow or Z to rotate, space to hard-drop, line-clear animation with score multiplier for multi-line clears, level display, and a game-over screen with final score and restart.',
      },
      {
        label: '🌌 asteroids',
        prompt:
          'Asteroids: the player ship rotates and thrusts in any direction, fires bullets to split large asteroids into smaller ones until they are destroyed. Include screen wrap-around, UFO enemies that appear periodically, score, lives with brief invincibility on respawn, and a game-over screen with restart.',
      },
      {
        label: '🦕 dino runner',
        prompt:
          'Endless runner in the style of the Chrome dinosaur game: a pixelated dinosaur runs automatically, press Space or tap to jump (double-jump allowed), duck with the down arrow. Cacti and pterodactyls scroll in at increasing speed. Show hi-score, current score, and a game-over / restart screen.',
      },
      {
        label: '🏓 pong',
        prompt:
          'Two-player Pong on the same keyboard (W/S for left paddle, Up/Down for right paddle) with an optional single-player mode against a CPU opponent at adjustable difficulty. Show the score above the net, add ball speed increase on each paddle hit, and a first-to-7 win detection with a restart button.',
      },
      {
        label: '💣 minesweeper',
        prompt:
          'Minesweeper: a 16×16 grid with 40 mines, left-click to reveal a cell, right-click to flag/unflag. Show a mine counter, a timer, a smiley-face reset button, number colours matching the classic Windows style, and a win/lose reveal animation.',
      },
      {
        label: '🏰 tower defense',
        prompt:
          'Tower defense: enemies follow a winding path from spawn to the base, the player places cannon/laser/slow towers by clicking empty tiles with earned gold. Towers auto-attack enemies in range. Include 10 escalating waves, enemy health bars, base HP, gold economy, tower upgrade button, and a game-over / victory screen.',
      },
      {
        label: '🚁 3D helicopter',
        prompt:
          '3D helicopter game (Three.js): fly a helicopter through a canyon by holding click/space to rise and releasing to fall, dodging the canyon walls that scroll toward the camera and narrow over time. Show survival time as score, add particle dust effects on near-misses, and a game-over screen with best time and restart.',
      },
      {
        label: '🗼 3D tower stack',
        prompt:
          '3D tower stacking game (Three.js): a moving platform slides back and forth above the previous one, press Space or click to drop it. The overhanging part is sliced off — the remaining slab becomes the new base. Slabs shrink with each imperfect drop; a perfect drop restores a little size. Show the stack height as score, add a satisfying thud animation, and a game-over screen when the slab disappears.',
      },
    ],
  },
  {
    id: 'website',
    name: 'Website',
    icon: Globe,
    description: 'Landing pages & sites',
    presets: [
      {
        label: '💼 Portfolio',
        prompt:
          'A personal developer portfolio website. Sections: sticky nav, hero with name and CTA, skills grid, projects grid with cards, about with short bio, contact form, footer.',
      },
      {
        label: '🏠 Local Business',
        prompt:
          'A landing page for a local service business. Sections: sticky nav with a call-to-action button, hero, services grid, about with a few stats, testimonials, contact form with business info, footer.',
      },
      {
        label: '🛒 Product Page',
        prompt:
          'An e-commerce product page for a small online shop. Sections: nav with cart icon, product hero with image and add-to-cart, product details tabs, related products grid, newsletter signup, footer.',
      },
      {
        label: '📱 Service Landing',
        prompt:
          'A single-page landing for a professional services business. Sections: minimal nav, hero with CTA, services grid, how-it-works steps, testimonials, pricing tiers, FAQ accordion, contact form, footer.',
      },
      {
        label: '🍽️ Restaurant',
        prompt:
          'A website for a restaurant or café. Sections: nav with reservation button, hero, menu with categories and items (name, description, price), about, gallery grid, reservation form, hours and location, footer.',
      },
      {
        label: '🎓 Online Course',
        prompt:
          'A landing page for an online course. Sections: nav with enroll CTA, hero with course highlights, curriculum accordion, instructor bio, student testimonials, pricing card, FAQ accordion, footer.',
      },
    ],
  },
];

export interface ArenaCompetitor {
  id: string; // The model name
  status: 'idle' | 'running' | 'done' | 'error' | 'skipped';
  code: string;
  reasoning: string;
  error?: string;
  isWinner?: boolean; // Optional feature
  startTime?: number; // ms timestamp when generation started
  duration?: number; // ms elapsed when generation finished/errored/skipped
}

/**
 * Extracts clean code from a raw LLM response, stripping any markdown code fences,
 * preamble text, and trailing commentary that the model may have included.
 */
export function extractCode(raw: string): string {
  const trimmed = raw.trim();

  // Find the first opening fence (```lang at start of a line)
  const openMatch = trimmed.match(/^```[a-zA-Z0-9]*[ \t]*\r?\n/m);
  if (openMatch && openMatch.index !== undefined) {
    const contentStart = openMatch.index + openMatch[0].length;
    // Use lastIndexOf so we skip any inner code fences inside the HTML/JS
    const lastFenceIdx = trimmed.lastIndexOf('\n```');
    if (lastFenceIdx > contentStart) {
      return trimmed.slice(contentStart, lastFenceIdx).trim();
    }
    // No closing fence yet (streaming / truncated) – return everything after the opening fence
    return trimmed.slice(contentStart).trim();
  }

  // No code fence – try to pull a full HTML document
  const htmlMatch = trimmed.match(/<(?:!DOCTYPE\s+html|html)[\s\S]*<\/html>/i);
  if (htmlMatch) return htmlMatch[0];

  // SVG document
  const svgMatch = trimmed.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) return svgMatch[0];

  return trimmed;
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
