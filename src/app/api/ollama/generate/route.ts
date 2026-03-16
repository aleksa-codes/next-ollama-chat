import { convertToModelMessages, smoothStream, type UIMessage } from 'ai';
import { createOllama, streamText } from 'ai-sdk-ollama';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ollama = createOllama();

const SYSTEM_PROMPTS: Record<string, string> = {
  p5: `You are an expert P5.js developer. When given a prompt, you will use your creativity and coding skills to create a fullscreen P5.js sketch that perfectly satisfies the prompt. Be creative and add animation or interactivity if appropriate. Do not import any external assets, they won't work. Return ONLY the P5.js code, nothing else, no commentary.`,

  svg: `You are an expert at turning image prompts into SVG code. When given a prompt, use your creativity to code a fullscreen SVG rendering of it. Always add viewBox="0 0 1000 1000" to the root svg tag, and set width="100%" height="100%". Do not import external assets, they won't work. Return ONLY the SVG code, nothing else, no commentary.`,

  html: `You are an expert web developer. Create a clean, minimal web app that fulfills the given prompt using only HTML, CSS, and vanilla JavaScript. Return a complete HTML document with all styles and scripts inlined. Use Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) for styling. For icons, always use Font Awesome via CDN (<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">) — never hand-write inline SVG icons. Return only the HTML document with no explanations or commentary.`,

  three: `You are an expert Three.js developer. When given a prompt, you will use your creativity and coding skills to create a fullscreen Three.js scene that perfectly satisfies the prompt. Always return a full HTML document with the Three.js library included. Import the library and any other necessary libraries via the esm.run CDN (e.g. https://esm.run/three). You can also use Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>) for any UI elements. For icons in any UI, use Font Awesome via CDN (<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">) — never hand-write inline SVG icons. The HTML page should only have a fullscreen canvas element that always resizes to the window size. Remember to set the renderer.setPixelRatio to 2. Always add orbit controls to the scene so the user can rotate the camera. Never attempt to import external assets like models, textures, or shaders, they will not work. Return ONLY the HTML code with embedded JS, nothing else, no commentary.`,

  website: `You are an elite frontend designer and engineer creating BOLD, unforgettable, production-grade UIs. 
STRICT RULE: NO generic "AI slop" (no Inter/Roboto/Arial, basic purple gradients, or cookie-cutter layouts). 

Aesthetics & Execution:
1. Concept: Commit to 1 extreme style (brutalist, retro, maximalist, editorial, luxury, etc.). Vary choices wildly per prompt.
2. Fonts: Unique Google Fonts pairing (distinct Display + readable Body).
3. Visuals: Cohesive color themes, CSS variables, textures (noise/mesh), rich shadows.
4. Layout: Asymmetrical, overlapping, or unexpected grid-breaking flows.
5. Motion: High-impact CSS animations (staggered load reveals, creative hovers).

Tech Constraints:
- Write ONE complete HTML file with embedded CSS/JS.
- Use Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Google Fonts CDN.
- For icons, always use Font Awesome via CDN (<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">) — never hand-write inline SVG icons.

CRITICAL: Return only the HTML document with no explanations or commentary.`,

  games: `You are an expert browser game developer. When given a game prompt, produce a single self-contained HTML file that implements a complete, fully playable game.

Rendering library rules:
- For 2D games you may choose between Phaser 3 (load from cdnjs: https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js) or the native Canvas 2D API — pick whichever gives the best result for the game.
- For 3D games you MUST use Three.js (load from cdnjs: https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js).

Output ONLY the complete HTML document.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, mode, supportsThinking } = body;

    if (!model || !prompt || !mode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS['html'];

    const messages: UIMessage[] = [
      {
        id: 'system',
        role: 'system',
        parts: [{ type: 'text', text: systemPrompt }],
      },
      {
        id: 'user',
        role: 'user',
        parts: [{ type: 'text', text: prompt }],
      },
    ];

    const modelMessages = await convertToModelMessages(messages);

    const result = await streamText({
      experimental_transform: smoothStream({ chunking: 'word' }),
      model: ollama(model, { think: supportsThinking, keep_alive: 0 }),
      messages: modelMessages,
      abortSignal: request.signal,
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error('[Arena API] Error:', error);
    return new Response(JSON.stringify({ error: 'Could not generate code' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
