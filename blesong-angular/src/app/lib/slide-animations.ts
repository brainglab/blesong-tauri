import gsap from 'gsap';

/**
 * Animation modes used by /presenter/slide and /presenter/letter.
 * The numeric ids match the values published in the MQTT payload's
 * `template.template_animation` field.
 */
export const SLIDE_ANIMATIONS = [
  { id: 0, name: 'Suave' },
  { id: 1, name: 'Cascada' },
  { id: 2, name: 'Glitch' },
  { id: 3, name: 'Onda' },
  { id: 4, name: 'Explosión' },
  { id: 5, name: 'Tipiado' },
  { id: 6, name: 'Cinta' },
  { id: 7, name: 'Espiral' },
  { id: 8, name: 'Gravedad' },
  { id: 9, name: 'Latido' },
] as const;

export type SlideAnimationMode = (typeof SLIDE_ANIMATIONS)[number]['id'];

// --------------------------------------------------------- DOM splitting

/**
 * Walks `root`'s text nodes and replaces each with span-per-char (or word)
 * so GSAP can target them.
 *
 * Words are kept atomic: each word becomes a `display: inline-block;
 * white-space: nowrap` container so the browser never breaks in the middle
 * of one. Whitespace between words is emitted as plain text nodes so the
 * parent's `whitespace-pre-wrap` rule can break the line on a space or `\n`.
 *
 * In `char` mode, each character inside a word is its own inline-block span
 * (so GSAP can target chars), but the surrounding word wrapper keeps them
 * glued together visually.
 */
function splitText(root: HTMLElement, mode: 'char' | 'word'): HTMLSpanElement[] {
  const items: HTMLSpanElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const tn of textNodes) {
    const text = tn.textContent ?? '';
    if (!text) continue;
    const frag = document.createDocumentFragment();
    const tokens = text.split(/(\s+)/);

    for (const tok of tokens) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) {
        // Whitespace stays as a real text node so the line can break here.
        frag.appendChild(document.createTextNode(tok));
        continue;
      }

      if (mode === 'word') {
        const word = document.createElement('span');
        word.textContent = tok;
        word.style.display = 'inline-block';
        frag.appendChild(word);
        items.push(word);
      } else {
        const wordWrap = document.createElement('span');
        wordWrap.style.display = 'inline-block';
        wordWrap.style.whiteSpace = 'nowrap';
        for (const ch of [...tok]) {
          const charSpan = document.createElement('span');
          charSpan.textContent = ch;
          charSpan.style.display = 'inline-block';
          wordWrap.appendChild(charSpan);
          items.push(charSpan);
        }
        frag.appendChild(wordWrap);
      }
    }
    tn.replaceWith(frag);
  }
  return items;
}

// --------------------------------------------------------- exit animation

export function animateOut(el: HTMLElement | null | undefined): Promise<void> {
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    gsap.killTweensOf(el);
    gsap.killTweensOf(el.querySelectorAll('*'));
    gsap.to(el, {
      y: -40,
      opacity: 0,
      duration: 0.35,
      ease: 'power3.in',
      onComplete: () => resolve(),
    });
  });
}

// --------------------------------------------------------- entry animations

export function animateIn(el: HTMLElement | null | undefined, mode: number): void {
  if (!el) return;
  gsap.killTweensOf(el);
  gsap.killTweensOf(el.querySelectorAll('*'));
  // Reset to a known clean state.
  gsap.set(el, {
    opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, skewX: 0, rotationX: 0,
    filter: 'none', textShadow: 'none', letterSpacing: 0,
  });

  switch (mode) {
    case 1: return cascada(el);
    case 2: return glitch(el);
    case 3: return onda(el);
    case 4: return explosion(el);
    case 5: return tipiado(el);
    case 6: return cinta(el);
    case 7: return espiral(el);
    case 8: return gravedad(el);
    case 9: return latido(el);
    case 0:
    default: return suave(el);
  }
}

// --- 0 Suave: fade desde abajo + glow sutil.
function suave(el: HTMLElement): void {
  gsap.fromTo(el,
    { opacity: 0, y: 18 },
    {
      opacity: 1, y: 0,
      duration: 0.9, ease: 'power2.out',
      onComplete: () => {
        gsap.to(el, {
          textShadow: '0 0 8px rgba(255,255,255,0.45)',
          duration: 0.7, yoyo: true, repeat: 1, ease: 'power1.inOut',
        });
      },
    });
}

// --- 1 Cascada: palabras caen con rotación 3D.
function cascada(el: HTMLElement): void {
  const words = splitText(el, 'word');
  el.style.perspective = '900px';
  gsap.from(words, {
    opacity: 0, y: 70, rotationX: -90,
    transformOrigin: '50% 100% -20',
    duration: 0.85,
    ease: 'back.out(1.6)',
    stagger: 0.06,
    onComplete: () => {
      gsap.to(el, {
        textShadow: '0 0 14px rgba(255,255,255,0.55)',
        duration: 0.8, yoyo: true, repeat: 1, ease: 'power1.inOut',
      });
    },
  });
}

// --- 2 Glitch: RGB-split flicker que se asienta.
function glitch(el: HTMLElement): void {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0.1, x: 0, textShadow: '5px 0 #00fff0, -5px 0 #ff00aa' })
    .to(el, { opacity: 1, duration: 0.06 })
    .to(el, { x: 6,  textShadow: '-3px 0 #ff00aa, 3px 0 #00fff0', duration: 0.05 })
    .to(el, { x: -5, textShadow: '4px 0 #00fff0, -4px 0 #ff00aa', duration: 0.05 })
    .to(el, { x: 3,  textShadow: '-2px 0 #ff00aa, 2px 0 #00fff0', duration: 0.05 })
    .to(el, { x: -2, textShadow: '6px 0 #00fff0, -6px 0 #ff00aa', duration: 0.05 })
    .to(el, { x: 0,  textShadow: '0 0 0 transparent', duration: 0.18, ease: 'power2.out' })
    .to(el, {
      textShadow: '0 0 22px rgba(255,255,255,0.7)',
      duration: 0.45, yoyo: true, repeat: 1, ease: 'power2.inOut',
    });
}

// --- 3 Onda: cada char rebota con elastic + glow trail.
function onda(el: HTMLElement): void {
  const chars = splitText(el, 'char');
  gsap.from(chars, {
    opacity: 0, y: 80, scale: 0.5,
    duration: 0.9,
    ease: 'elastic.out(1, 0.55)',
    stagger: { each: 0.04, from: 'start' },
    onComplete: () => {
      gsap.to(chars, {
        textShadow: '0 0 14px rgba(255,255,255,0.65)',
        duration: 0.4,
        stagger: { each: 0.03, from: 'start', yoyo: true, repeat: 1 },
        ease: 'sine.inOut',
      });
    },
  });
}

// --- 4 Explosión: chars desde el centro con blur que se despeja.
function explosion(el: HTMLElement): void {
  const chars = splitText(el, 'char');
  gsap.from(chars, {
    opacity: 0, scale: 0, filter: 'blur(20px)',
    duration: 0.95,
    ease: 'back.out(1.7)',
    stagger: { each: 0.035, from: 'center' },
    onComplete: () => {
      gsap.to(el, {
        textShadow: '0 0 24px rgba(255,255,255,0.75)',
        duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut',
      });
    },
  });
}

// --- 5 Tipiado: typewriter char por char con glow neón al final.
function tipiado(el: HTMLElement): void {
  const chars = splitText(el, 'char');
  gsap.set(chars, { opacity: 0 });
  gsap.to(chars, {
    opacity: 1,
    duration: 0.01,
    stagger: { each: 0.035, from: 'start' },
    ease: 'none',
    onComplete: () => {
      gsap.to(el, {
        textShadow: '0 0 12px #00fff0, 0 0 24px rgba(0,255,240,0.5)',
        duration: 0.55, yoyo: true, repeat: 1, ease: 'sine.inOut',
      });
    },
  });
}

// --- 6 Cinta: palabras entran deslizando desde la derecha con bounce.
function cinta(el: HTMLElement): void {
  const words = splitText(el, 'word');
  gsap.from(words, {
    opacity: 0, x: 220,
    duration: 0.7,
    ease: 'back.out(1.4)',
    stagger: { each: 0.05, from: 'end' },
    onComplete: () => {
      gsap.to(el, {
        textShadow: '0 0 12px rgba(255,255,255,0.5)',
        duration: 0.6, yoyo: true, repeat: 1, ease: 'power1.inOut',
      });
    },
  });
}

// --- 7 Espiral: chars rotan 720° desde el centro mientras escalan.
function espiral(el: HTMLElement): void {
  const chars = splitText(el, 'char');
  gsap.from(chars, {
    opacity: 0, scale: 0, rotation: 720,
    transformOrigin: '50% 50%',
    duration: 1,
    ease: 'power3.out',
    stagger: { each: 0.03, from: 'center' },
    onComplete: () => {
      gsap.to(el, {
        textShadow: '0 0 18px rgba(180,140,255,0.7)',
        duration: 0.55, yoyo: true, repeat: 1, ease: 'power2.inOut',
      });
    },
  });
}

// --- 8 Gravedad: chars caen desde arriba con bounce, orden aleatorio.
function gravedad(el: HTMLElement): void {
  const chars = splitText(el, 'char');
  gsap.from(chars, {
    opacity: 0, y: -260,
    duration: 1.1,
    ease: 'bounce.out',
    stagger: { each: 0.045, from: 'random' },
  });
}

// --- 9 Latido: fade en + ritmo de heartbeat (scale 1 → 1.08 → 1 → 1.04 → 1).
function latido(el: HTMLElement): void {
  const tl = gsap.timeline();
  tl.fromTo(el,
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' })
    .to(el, { scale: 1.08, duration: 0.12, ease: 'power2.out' })
    .to(el, { scale: 1,    duration: 0.18, ease: 'power2.in' })
    .to(el, { scale: 1.04, duration: 0.10, ease: 'power2.out' })
    .to(el, { scale: 1,    duration: 0.15, ease: 'power2.in' })
    .to(el, {
      textShadow: '0 0 18px rgba(255,80,120,0.7)',
      duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut',
    });
}
