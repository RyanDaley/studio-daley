gsap.registerPlugin(ScrollTrigger);

/* ── Canvas setup ── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (currentFrame >= 0 && images[currentFrame]?.complete) {
    drawCover(images[currentFrame]);
  }
}

function drawCover(img) {
  if (!img || !img.naturalWidth) return;
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* ── Image preload ── */
const TOTAL = 200;
const images = new Array(TOTAL);
let loaded = 0;
let currentFrame = 0;

function padIndex(i) {
  return String(i).padStart(5, '0');
}

function preloadAll(onComplete) {
  for (let i = 0; i < TOTAL; i++) {
    const img = new Image();
    img.src = `./public/animation/Frame_${padIndex(i)}_result.webp`;
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === TOTAL) onComplete();
    };
    images[i] = img;
  }
}

/* ── Intro element references ── */
const studio      = document.getElementById('text-studio');
const daley       = document.getElementById('text-daley');
const lineTopWrap = document.getElementById('line-top-wrap');
const lineBotWrap = document.getElementById('line-bottom-wrap');
const intro       = document.getElementById('intro');

/* ── Content block references ── */
const block1    = document.getElementById('content-block-1');
const block2    = document.getElementById('content-block-2');
const block3    = document.getElementById('content-block-3');
const formBlock = document.getElementById('form-block');

/* ── Opacity helpers ── */

/* Fades in over [inStart, inEnd], then fades out symmetrically past inEnd */
function peakOpacity(frame, inStart, inEnd) {
  const len = inEnd - inStart;
  if (frame <= inStart) return 0;
  if (frame <= inEnd)   return (frame - inStart) / len;
  const outEnd = inEnd + len;
  if (frame >= outEnd)  return 0;
  return 1 - (frame - inEnd) / len;
}

/* Ramps from 0 to 1 over [inStart, inEnd], then holds at 1 */
function rampOpacity(frame, inStart, inEnd) {
  if (frame <= inStart) return 0;
  if (frame >= inEnd)   return 1;
  return (frame - inStart) / (inEnd - inStart);
}

/* ── Sync SVG block-lines to heading text widths ── */
function syncLineWidths() {
  [block1, block2, block3, formBlock].forEach(block => {
    const h2  = block.querySelector('h2');
    const svg = block.querySelector('.block-line');
    if (!h2 || !svg) return;
    /* Temporarily inline-block to read shrunk text width */
    const prev = h2.style.cssText;
    h2.style.cssText += ';display:inline-block;white-space:nowrap';
    const w = h2.offsetWidth;
    h2.style.cssText = prev;
    svg.style.width = w + 'px';
  });
}

/* ── Measure intro block so we can offset to exact viewport corners ── */
function getOffsets() {
  const ir  = intro.getBoundingClientRect();
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;
  const pad = Math.max(40, vw * 0.04);   /* 40 px or 4 vw buffer from edges */

  const stR = studio.getBoundingClientRect();
  const daR = daley.getBoundingClientRect();
  const ltR = lineTopWrap.getBoundingClientRect();
  const lbR = lineBotWrap.getBoundingClientRect();

  const iCx = ir.left + ir.width  / 2;
  const iCy = ir.top  + ir.height / 2;

  /* Studio → Top Left */
  const stTargetX = -iCx + pad + (stR.left - ir.left);
  const stTargetY = pad - stR.top;

  /* Daley → Bottom Right */
  const daTargetX = (vw - pad - daR.width)  - daR.left;
  const daTargetY = (vh - pad - daR.height) - daR.top;

  /* Top line → Top Right */
  const ltTargetX = (vw - pad - ltR.width)  - ltR.left;
  const ltTargetY =             pad          - ltR.top;

  /* Bottom line → Bottom Left */
  const lbTargetX =             pad          - lbR.left;
  const lbTargetY = (vh - pad - lbR.height) - lbR.top;

  return { stTargetX, stTargetY, daTargetX, daTargetY, ltTargetX, ltTargetY, lbTargetX, lbTargetY };
}

/* ── Main boot sequence ── */
function init() {
  resizeCanvas();
  syncLineWidths();

  window.addEventListener('resize', () => {
    resizeCanvas();
    syncLineWidths();
  });

  const off = getOffsets();

  const tl = gsap.timeline({ onComplete: fadeInCanvas });

  tl.to(studio, {
    x: off.stTargetX,
    y: off.stTargetY,
    duration: 2,
    ease: 'power3.inOut'
  }, 0);

  tl.to(daley, {
    x: off.daTargetX,
    y: off.daTargetY,
    duration: 2,
    ease: 'power3.inOut'
  }, 0);

  tl.to(lineTopWrap, {
    x: off.ltTargetX,
    y: off.ltTargetY,
    duration: 2,
    ease: 'power3.inOut'
  }, 0);

  tl.to(lineBotWrap, {
    x: off.lbTargetX,
    y: off.lbTargetY,
    duration: 2,
    ease: 'power3.inOut'
  }, 0);
}

function fadeInCanvas() {
  gsap.to(canvas, {
    opacity: 1,
    duration: 1,
    ease: 'power2.inOut',
    onComplete: setupScrollTrigger
  });
}

function setupScrollTrigger() {
  document.body.style.overflowY = '';
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end:   'bottom bottom',
    scrub: 1,
    onUpdate(self) {
      const f = Math.round(self.progress * (TOTAL - 1));
      if (f === currentFrame) return;
      currentFrame = f;
      drawCover(images[currentFrame]);

      gsap.to(block1, { opacity: peakOpacity(f, 25, 55),   duration: 0.2, overwrite: true });
      gsap.to(block2, { opacity: peakOpacity(f, 75, 105),   duration: 0.2, overwrite: true });
      gsap.to(block3, { opacity: peakOpacity(f, 125, 155), duration: 0.2, overwrite: true });

      const formOp = rampOpacity(f, 190, 200);
      gsap.to(formBlock, { opacity: formOp, duration: 0.2, overwrite: true });
      formBlock.style.pointerEvents = formOp > 0 ? 'auto' : 'none';
    }
  });

  /* Fade out corner text/lines the moment scrolling begins */
  let scrollFadeTriggered = false;
  const introEls = [studio, daley, lineTopWrap, lineBotWrap];

  ScrollTrigger.create({
    trigger: document.body,
    start: '1px top',
    onEnter() {
      if (!scrollFadeTriggered) {
        scrollFadeTriggered = true;
        gsap.to(introEls, {
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut'
        });
      }
    }
  });
}

/* ── Lock scroll until intro animation completes ── */
document.body.style.overflowY = 'hidden';

/* ── Form submission ── */
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const btn  = form.querySelector('button[type="submit"]');
  const msg  = document.getElementById('form-message');

  btn.disabled    = true;
  btn.textContent = 'Sending…';
  msg.textContent = '';
  msg.className   = '';

  try {
    const res = await fetch('https://formspree.io/f/xbdqppnz', {
      method:  'POST',
      body:    new FormData(form),
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      form.reset();
      btn.textContent = 'Sent';
      msg.textContent = 'Message sent!';
      msg.className   = 'form-msg-ok';
    } else {
      const json = await res.json().catch(() => ({}));
      btn.disabled    = false;
      btn.textContent = 'Submit';
      msg.textContent = json.errors?.[0]?.message || 'Something went wrong. Please try again.';
      msg.className   = 'form-msg-err';
    }
  } catch {
    btn.disabled    = false;
    btn.textContent = 'Submit';
    msg.textContent = 'Network error. Please try again.';
    msg.className   = 'form-msg-err';
  }
});

/* ── Kick off ── */
preloadAll(init);
