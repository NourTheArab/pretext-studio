import {
  ambientDrift,
  createAnimationController,
  cursorRipple,
  easings,
  flowLayout,
  hitTest,
  hitTestCharacter,
  inkDensity,
  wave,
} from "../dist/index.js";

const INSTALL_COMMAND = "npm install pretext-flow";
const DEMO_FONT = '17px "Inter", system-ui, sans-serif';
const DEMO_LINE_HEIGHT = 29;
const DEMO_PADDING = 34;
const MOTION_FONT = '17px "Inter", system-ui, sans-serif';
const MOTION_LINE_HEIGHT = 31;
const EFFECTS_FONT = '17px "Inter", system-ui, sans-serif';
const EFFECTS_LINE_HEIGHT = 32;
const MOTION_PADDING = 28;
const READING_FONT = '17px "Inter", system-ui, sans-serif';
const READING_LINE_HEIGHT = 31;
const READING_PADDING = 28;
const HERO_WORDS = [
  "tap",
  "copy",
  "launch",
  "arc",
  "moon",
  "return",
  "read",
  "home",
];
const MOTION_LAYOUT_TEXT = [
  "Artemis II launched on April 1, 2026 and sent four astronauts aboard Orion on NASA's first crewed lunar flyby in more than half a century.",
  "By April 10, Orion had completed the swing around the Moon and returned to Earth, which makes the mission a good fit for a layout demo about one outbound arc, one lunar turn, and one route home.",
  "This panel turns that flight path into a layout problem. Earth and Moon stay in the article as real embeds, Orion moves between them, and the paragraph reroutes in live DOM text instead of flattening into a screenshot.",
  "The point is practical as much as visual. The mission note remains readable, copyable, and selectable while the route keeps changing under it.",
].join(" ");
const MOTION_EFFECTS_TEXT = [
  "The hallway window was open just enough to make the page stir. Every time the draft reached the paper, the paragraph shifted a little and then settled back into itself.",
  "That is the feeling this panel keeps chasing. The letters can drift and lean under the cursor, but the sentence still reads like a sentence and the story stays selectable.",
  "The effect is meant to feel literary instead of noisy. Motion belongs to the surface, not to a gimmick pasted on top of it.",
].join(" ");
const READING_TIMER_TEXT = [
  "A timed reading surface should guide the eye without turning the article into a separate app. Every few seconds the marker steps downward, asks the lines to reorganize, and leaves the copy selectable.",
  "That makes it useful for a study break, a speech rehearsal, or a classroom prompt where pace matters as much as typography. The timer is not floating on top as an afterthought. It is a real layout object, so the paragraph has to negotiate with it whenever the pace changes.",
  "Because the layout stays live, the same pattern could become a recitation coach, a reading companion, or a quiet accessibility tool tuned to one reader's speed. One moving embed turns into a practical interface instead of a visual trick.",
].join("\n");

const THEMES_FONT = '17px "Inter", system-ui, sans-serif';
const THEMES_LINE_HEIGHT = 31;
const THEMES_PADDING = 24;

const THEMES_DATA = {
  fire: {
    label: "Fire",
    eyebrow: "Heat rises",
    text: [
      "Fire does not apologize for taking the room. It holds its shape until the air carries it off, and the paragraph has to reroute around whatever heat it leaves behind.",
      "That is the whole idea. The ember moves. The margins shift. The sentence stays intact and still makes sense by the time it settles again.",
    ].join(" "),
  },
  sea: {
    label: "Sea",
    eyebrow: "Current turns",
    text: [
      "Everything at depth moves on a long delay. The current carries the line one way and then releases it, and the text has to find the next open channel without breaking the flow.",
      "That makes the sea a useful constraint. It does not obscure the copy. It just keeps the paragraph negotiating with the tide until the page goes still.",
    ].join(" "),
  },
  forest: {
    label: "Forest",
    eyebrow: "Leaves fall",
    text: [
      "A leaf takes the long way down. It does not announce itself. It just enters the column from somewhere above and the paragraph has to find whatever lane is still open.",
      "The text reroutes the same way a sentence reroutes when a word falls through. Quietly, and then it continues.",
    ].join(" "),
  },
  cosmos: {
    label: "Cosmos",
    eyebrow: "Orbit holds",
    text: [
      "The orbit does not pause for the text. The comet holds its path around the fixed point and the paragraph adjusts to whatever arc it is on without losing its thread.",
      "That is the relationship this panel is about. One thing moves in a fixed pattern. Everything around it stays readable.",
    ].join(" "),
  },
};

const CODE_SNIPPETS = {
  layout: [
    "import { flowLayout } from 'pretext-flow'",
    "",
    "const result = flowLayout({",
    "  text: article,",
    "  font: '18px Georgia',",
    "  width: 720,",
    "  lineHeight: 28,",
    "  embeds: [{",
    "    id: 'pullquote',",
    "    shape: { type: 'circle', radius: 56 },",
    "    position: { type: 'absolute', x: 40, y: 24 },",
    "    margin: 18,",
    "  }, {",
    "    id: 'note',",
    "    shape: { type: 'rect', width: 182, height: 118 },",
    "    position: { type: 'absolute', x: 410, y: 220 },",
    "    margin: 18,",
    "  }],",
    "})",
    "",
    "// result.lines  -> positioned text",
    "// result.embeds -> resolved embed rects",
    "// result.height -> total layout height",
  ].join("\n"),
  animate: [
    "import { createAnimationController, easings } from 'pretext-flow'",
    "",
    "const controller = createAnimationController({",
    "  text: paragraph,",
    "  font: '16px Georgia',",
    "  width: 560,",
    "  lineHeight: 24,",
    "  embeds: [{",
    "    id: 'orb',",
    "    shape: { type: 'circle', radius: 28 },",
    "    position: { type: 'absolute', x: 0, y: 0 },",
    "    path: {",
    "      segments,",
    "      duration: 6200,",
    "      easing: easings.easeInOut,",
    "      loop: 'loop',",
    "    },",
    "  }],",
    "})",
    "",
    "requestAnimationFrame(function frame(time) {",
    "  render(controller.tick(time))",
    "  requestAnimationFrame(frame)",
    "})",
  ].join("\n"),
  interact: [
    "import { hitTest, hitTestCharacter } from 'pretext-flow'",
    "",
    "const result = controller.tick(time)",
    "const point = { x: mouseX, y: mouseY }",
    "const embedId = hitTest(result, point, 4)",
    "const charHit = hitTestCharacter(result, point, lineHeight)",
    "",
    "if (embedId) {",
    "  controller.moveEmbed(embedId, {",
    "    type: 'absolute',",
    "    x: nextX,",
    "    y: nextY,",
    "  })",
    "}",
    "",
    "if (charHit) {",
    "  console.log(`line ${charHit.line + 1}: ${charHit.char}`)",
    "}",
  ].join("\n"),
};

const REFLOW_TEXT = [
  "A good layout should survive interruption. Drop a round pull, slide in a margin note, and the article should keep its order without feeling like it is recovering from damage.",
  "That is the whole promise of this demo. The pool and the note card are real embeds, so when you drag either one the copy is measured again, the blocked bands are recalculated, and the lines find the next open lane instead of collapsing into decorative hacks.",
  "It turns the layout engine into something you can actually design with. Pretext handles measurement and breaking. pretext-flow handles the shape-aware rerouting that makes moving editorial pieces feel calm and intentional.",
].join("\n");

function createReflowEmbeds(width) {
  return [
    {
      id: "pool",
      kind: "pool",
      label: "pool",
      shape: { type: "circle", radius: 58 },
      margin: 18,
      position: { x: clamp(width * 0.04, 10, Math.max(10, width - 116)), y: 16 },
    },
    {
      id: "note",
      kind: "note",
      label: "note",
      detail: "drag me too",
      shape: { type: "rect", width: 182, height: 118 },
      margin: 18,
      position: { x: clamp(width * 0.58, 120, Math.max(120, width - 182)), y: 248 },
    },
  ];
}

function initPage() {
  document.documentElement.classList.add("interactive-ready");
  bindInstallButton();
  initSnippetTabs();

  const hero = mountFlowHero(document.getElementById("hero-waterfall"));
  const reflowDemo = new ReflowDemo(document.getElementById("reflow-demo"));
  const motionLab = new MotionLab();
  const colorThemes = mountElementsDemo(document.getElementById("color-themes-demo"));
  const readingTimer = new ReadingTimerDemo(document.getElementById("reading-timer-demo"));

  if (document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        hero.resize();
        reflowDemo.render();
        motionLab.handleResize();
        readingTimer.handleResize();
      })
      .catch(() => {});
  }

  window.addEventListener("beforeunload", () => {
    hero.destroy();
    reflowDemo.destroy();
    motionLab.destroy();
    colorThemes.destroy();
    readingTimer.destroy();
  });
}

export function mountFlowHero(canvas, options = {}) {
  return new HeroWaterfall(canvas, options);
}

export function mountElementsDemo(root, options = {}) {
  return new ColorThemeDemo(root, options);
}

export function mountArtemisDemo(options = {}) {
  return new ArtemisDemo(options);
}

function bindInstallButton() {
  const button = document.getElementById("copy-install");
  const status = document.getElementById("copy-status");
  let timeoutId = 0;
  if (!button || !status) return;

  button.addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(INSTALL_COMMAND);
        status.textContent = "Install command copied.";
      } else {
        status.textContent = `Copy this command: ${INSTALL_COMMAND}`;
      }
    } catch {
      status.textContent = `Copy this command: ${INSTALL_COMMAND}`;
    }

    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      status.textContent = "";
    }, 2200);
  });
}

function initSnippetTabs() {
  const output = document.getElementById("snippet-output");
  const tabs = [...document.querySelectorAll(".snippet-tab")];
  if (!output || tabs.length === 0) return;

  const setSnippet = key => {
    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.snippet === key);
    });
    output.textContent = CODE_SNIPPETS[key] || CODE_SNIPPETS.layout;
  };

  tabs.forEach(tab => {
    tab.addEventListener("click", () => setSnippet(tab.dataset.snippet));
  });

  setSnippet("layout");
}

function createActivityMonitor(target, onChange, threshold = 0.4) {
  if (!target) return () => {};

  let inView = elementVisibilityRatio(target) >= threshold;
  const update = () => onChange(inView && !document.hidden);
  const recompute = () => {
    const next = elementVisibilityRatio(target) >= threshold;
    if (next !== inView) {
      inView = next;
      update();
    }
  };

  const onVisibilityChange = () => update();
  const onScroll = () => recompute();
  const onResize = () => recompute();

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(() => recompute(), {
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });
    observer.observe(target);
  }

  update();

  return () => {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
  };
}

function elementVisibilityRatio(target) {
  const rect = target.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!viewportHeight) return 0;

  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  return visibleHeight / Math.max(1, Math.min(rect.height || viewportHeight, viewportHeight));
}

class HeroWaterfall {
  constructor(canvas, { autoActivity = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext("2d");
    this.destroyed = false;
    this.isActive = false;
    this.rafId = 0;
    this.width = 0;
    this.height = 0;
    this.lastTime = 0;
    this.particles = [];
    this.storyIndex = 0;
    this.requestedActive = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.handleReducedMotion = () => this.setActive(this.requestedActive);

    if (!canvas || !this.ctx) return;

    this.frame = this.frame.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.reducedMotion.addEventListener?.("change", this.handleReducedMotion);
    if (autoActivity) {
      this.activityCleanup = createActivityMonitor(canvas, active => this.setActive(active), 0.35);
    }
    this.resize();
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.textBaseline = "middle";

    const targetCount = clamp(Math.round(this.width / 150), 6, 8);
    this.particles = Array.from({ length: targetCount }, (_, index) => {
      const progress = -0.2 + index * (1.18 / Math.max(1, targetCount - 1));
      return this.makeParticle(progress, index);
    });

    this.drawBackground();
    this.drawSink(0);
    this.drawFaucet();
    this.drawStream(0);
    this.drawParticles(0);

    if (this.isActive) {
      this.ensureFrame();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.resizeObserver?.disconnect();
    this.activityCleanup?.();
    this.reducedMotion?.removeEventListener?.("change", this.handleReducedMotion);
  }

  setActive(active) {
    this.requestedActive = Boolean(active);
    this.isActive = this.requestedActive && !this.reducedMotion.matches;
    this.lastTime = 0;
    if (!this.isActive && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.isActive) this.ensureFrame();
  }

  nextHeroWord() {
    const text = HERO_WORDS[this.storyIndex % HERO_WORDS.length];
    this.storyIndex += 1;
    return text;
  }

  laneForSlot(slot) {
    const pattern = [-0.34, -0.22, -0.1, 0.02, 0.14, 0.26, 0.36];
    return pattern[slot % pattern.length] + (Math.random() - 0.5) * 0.02;
  }

  makeParticle(progress = 0, slot = 0) {
    return {
      text: this.nextHeroWord(),
      progress,
      lane: this.laneForSlot(slot),
      speed: 0.18,
      alpha: 0.58 + Math.random() * 0.08,
      size: 18 + Math.random() * 2,
      swing: Math.random() * Math.PI * 2,
    };
  }

  ensureFrame() {
    if (this.destroyed || !this.isActive || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  frame(time) {
    this.rafId = 0;
    if (this.destroyed || !this.ctx || !this.isActive) return;
    if (!this.lastTime) this.lastTime = time;
    const delta = Math.min(40, time - this.lastTime);
    this.lastTime = time;

    this.drawBackground();
    this.drawSink(time);
    this.drawFaucet();
    this.drawStream(time);
    this.updateParticles(delta);
    this.drawParticles(time);

    this.ensureFrame();
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "rgba(247, 243, 236, 0.98)");
    gradient.addColorStop(0.32, "rgba(239, 233, 223, 0.98)");
    gradient.addColorStop(1, "rgba(227, 219, 207, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const glow = ctx.createRadialGradient(this.width * 0.4, this.height * 0.2, 18, this.width * 0.4, this.height * 0.2, 210);
    glow.addColorStop(0, "rgba(184, 76, 42, 0.18)");
    glow.addColorStop(1, "rgba(184, 76, 42, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(this.width * 0.1, 0, this.width * 0.72, this.height * 0.44);

    const wash = ctx.createLinearGradient(this.width * 0.1, this.height * 0.3, this.width * 0.78, this.height * 0.86);
    wash.addColorStop(0, "rgba(80, 61, 40, 0)");
    wash.addColorStop(1, "rgba(80, 61, 40, 0.07)");
    ctx.fillStyle = wash;
    ctx.fillRect(this.width * 0.12, this.height * 0.3, this.width * 0.7, this.height * 0.56);
  }

  drawFaucet() {
    const ctx = this.ctx;
    const pipeGradient = ctx.createLinearGradient(this.width * 0.22, this.height * 0.02, this.width * 0.56, this.height * 0.22);
    pipeGradient.addColorStop(0, "rgba(230, 224, 213, 0.98)");
    pipeGradient.addColorStop(0.48, "rgba(181, 164, 143, 0.98)");
    pipeGradient.addColorStop(1, "rgba(103, 84, 61, 0.98)");

    ctx.fillStyle = pipeGradient;
    roundRect(ctx, this.width * 0.29, this.height * 0.04, this.width * 0.16, 28, 14);
    ctx.fill();
    roundRect(ctx, this.width * 0.42, this.height * 0.045, 28, this.height * 0.16, 14);
    ctx.fill();
    roundRect(ctx, this.width * 0.34, this.height * 0.105, this.width * 0.18, 26, 13);
    ctx.fill();
    roundRect(ctx, this.width * 0.37, this.height * 0.018, 64, 14, 7);
    ctx.fill();

    ctx.strokeStyle = "rgba(48, 35, 21, 0.18)";
    ctx.lineWidth = 1;
    roundRect(ctx, this.width * 0.29, this.height * 0.04, this.width * 0.16, 28, 14);
    ctx.stroke();
    roundRect(ctx, this.width * 0.42, this.height * 0.045, 28, this.height * 0.16, 14);
    ctx.stroke();

    const nozzleGlow = ctx.createRadialGradient(this.width * 0.44, this.height * 0.18, 4, this.width * 0.44, this.height * 0.18, 42);
    nozzleGlow.addColorStop(0, "rgba(184, 76, 42, 0.22)");
    nozzleGlow.addColorStop(1, "rgba(184, 76, 42, 0)");
    ctx.fillStyle = nozzleGlow;
    ctx.fillRect(this.width * 0.39, this.height * 0.13, 120, 120);
  }

  drawSink(time) {
    const ctx = this.ctx;
    const basinX = this.width * 0.17;
    const basinY = this.height * 0.76;
    const basinWidth = this.width * 0.66;
    const basinHeight = this.height * 0.17;

    const rimGradient = ctx.createLinearGradient(basinX, basinY, basinX, basinY + basinHeight);
    rimGradient.addColorStop(0, "rgba(185, 173, 157, 0.98)");
    rimGradient.addColorStop(1, "rgba(103, 90, 73, 0.98)");
    ctx.fillStyle = rimGradient;
    roundRect(ctx, basinX, basinY, basinWidth, basinHeight, basinHeight * 0.44);
    ctx.fill();

    ctx.strokeStyle = "rgba(48, 35, 21, 0.18)";
    ctx.lineWidth = 1.2;
    roundRect(ctx, basinX, basinY, basinWidth, basinHeight, basinHeight * 0.44);
    ctx.stroke();

    const pool = ctx.createRadialGradient(this.width * 0.5, this.height * 0.87, 12, this.width * 0.5, this.height * 0.87, 190);
    pool.addColorStop(0, "rgba(184, 76, 42, 0.18)");
    pool.addColorStop(0.45, "rgba(120, 92, 66, 0.16)");
    pool.addColorStop(1, "rgba(90, 84, 73, 0)");
    ctx.fillStyle = pool;
    ctx.fillRect(this.width * 0.22, this.height * 0.71, this.width * 0.56, this.height * 0.24);
  }

  drawStream(time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = "round";

    for (let index = 0; index < 6; index += 1) {
      const lane = (index - 2.5) * 0.1;
      ctx.beginPath();
      const start = this.pathPoint(0, lane);
      ctx.moveTo(start.x, start.y);

      for (let step = 1; step <= 40; step += 1) {
        const point = this.pathPoint(step / 40, lane);
        ctx.lineTo(point.x, point.y);
      }

      ctx.strokeStyle = `rgba(110, 82, 57, ${0.22 + index * 0.055})`;
      ctx.lineWidth = 22 - index * 2.5;
      ctx.stroke();
    }

    for (let step = 0; step < 6; step += 1) {
      const pulse = (time * 0.00022 + step * 0.16) % 1;
      const point = this.pathPoint(pulse, (step - 2.5) * 0.035);
      ctx.beginPath();
      ctx.fillStyle = "rgba(184, 76, 42, 0.14)";
      ctx.arc(point.x, point.y, 5 + step, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  updateParticles(delta) {
    const speedScale = delta * 0.0007;
    this.particles.forEach((particle, index) => {
      particle.progress += particle.speed * speedScale;
      particle.swing += 0.01;
      if (particle.progress > 1.08) {
        particle.progress -= 1.28;
        particle.text = this.nextHeroWord();
        particle.lane = this.laneForSlot(index + this.storyIndex);
        particle.size = 18 + Math.random() * 2;
      }
    });
  }

  drawParticles(time) {
    const ctx = this.ctx;
    const particles = [...this.particles]
      .filter(particle => particle.progress >= 0.02 && particle.progress <= 0.98)
      .sort((a, b) => a.progress - b.progress);

    particles.forEach(particle => {
      const point = this.pathPoint(particle.progress, particle.lane * 0.16);
      const next = this.pathPoint(Math.min(1, particle.progress + 0.02), particle.lane * 0.16);
      const angle = Math.atan2(next.y - point.y, next.x - point.x) * 0.035;
      const alpha = particle.alpha * (0.98 + Math.sin(time * 0.0003 + particle.swing) * 0.02);

      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(angle);
      ctx.font = `500 ${particle.size}px "Cormorant Garamond"`;
      ctx.fillStyle = `rgba(44, 31, 17, ${alpha})`;
      ctx.shadowColor = "rgba(247, 241, 232, 0.52)";
      ctx.shadowBlur = 8;
      drawTrackedText(ctx, particle.text, 0, 0, 0.4);
      ctx.restore();
    });
  }

  pathPoint(progress, laneOffset = 0) {
    const t = clamp(progress, 0, 1);
    const start = { x: this.width * 0.44, y: this.height * 0.18 };
    const end = { x: this.width * 0.5, y: this.height * 0.82 };
    const point = cubicBezierPoint(
      start,
      { x: this.width * 0.37, y: this.height * 0.3 },
      { x: this.width * 0.58, y: this.height * 0.46 },
      end,
      t
    );

    const widthBias = Math.sin(t * Math.PI) * this.width * 0.058;
    const sway = Math.sin(t * 7 + laneOffset * 5) * 4;
    return {
      x: point.x + laneOffset * widthBias + sway,
      y: point.y,
    };
  }
}

class ReflowDemo {
  constructor(root) {
    this.root = root;
    this.resetButton = document.getElementById("reset-demo");
    this.metricLayout = document.getElementById("metric-layout");
    this.metricLines = document.getElementById("metric-lines");
    this.metricEmbeds = document.getElementById("metric-embeds");
    this.metricReflows = document.getElementById("metric-reflows");
    this.inspectEmbed = document.getElementById("inspect-embed");
    this.inspectCharacter = document.getElementById("inspect-character");
    this.inspectLine = document.getElementById("inspect-line");
    this.inspectPoint = document.getElementById("inspect-point");
    this.lines = [];
    this.embedEls = new Map();
    this.currentEmbeds = [];
    this.lastResult = null;
    this.reflows = 0;
    this.dragging = null;
    this.layoutMinHeight = 720;
    this.lastContentWidth = 0;

    if (!root) return;

    this.root.innerHTML = "";
    this.root.style.minHeight = `${this.layoutMinHeight}px`;

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(root);
    this.resetScene();
  }

  destroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    document.body.classList.remove("dragging-embed");
  }

  bindEvents() {
    this.resetButton?.addEventListener("click", () => this.resetScene());

    this.root.addEventListener("pointermove", event => {
      this.updateInspector(event);
    });

    this.root.addEventListener("pointerleave", () => {
      if (!this.dragging) {
        this.resetInspector();
      }
    });

    this.onWindowPointerMove = event => {
      if (!this.dragging) return;

      const { embed, size, offset } = this.dragging;
      const point = this.localPoint(event);
      embed.position.x = clamp(point.x - offset.x, 0, Math.max(0, this.contentWidth() - size.width));
      embed.position.y = clamp(point.y - offset.y, 0, Math.max(0, this.layoutMinHeight - DEMO_PADDING * 2 - size.height));
      this.render();
    };

    this.onWindowPointerUp = () => {
      this.dragging = null;
      document.body.classList.remove("dragging-embed");
    };

    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
  }

  contentWidth() {
    return Math.max(240, this.root.getBoundingClientRect().width - DEMO_PADDING * 2);
  }

  handleResize() {
    const width = this.contentWidth();
    if (!width) return;

    if (!this.lastContentWidth) {
      this.lastContentWidth = width;
      this.render();
      return;
    }

    if (Math.abs(width - this.lastContentWidth) < 2) {
      return;
    }

    const previousWidth = this.lastContentWidth;
    this.lastContentWidth = width;

    if (this.currentEmbeds.length === 0) {
      this.resetScene();
      return;
    }

    const ratio = width / previousWidth;
    this.currentEmbeds = this.currentEmbeds.map(embed => {
      const size = shapeSize(embed.shape);
      return {
        ...embed,
        position: {
          x: clamp(embed.position.x * ratio, 0, Math.max(0, width - size.width)),
          y: clamp(embed.position.y, 0, Math.max(0, this.layoutMinHeight - DEMO_PADDING * 2 - size.height)),
        },
      };
    });

    this.render();
  }

  resetScene() {
    this.lastContentWidth = this.contentWidth();
    this.currentEmbeds = createReflowEmbeds(this.lastContentWidth).map(embed => ({
      ...embed,
      position: { ...embed.position },
    }));
    this.syncEmbedElements();
    this.render();
  }

  syncEmbedElements() {
    const wanted = new Set(this.currentEmbeds.map(embed => embed.id));

    this.embedEls.forEach((node, id) => {
      if (!wanted.has(id)) {
        node.remove();
        this.embedEls.delete(id);
      }
    });

    this.currentEmbeds.forEach(embed => {
      if (this.embedEls.has(embed.id)) return;

      const node = document.createElement("div");
      node.className = `embed-node ${embedClassName(embed)}`;
      node.dataset.embedId = embed.id;
      node.innerHTML = embed.kind === "pool" ? "<span>POOL</span>" : "<span>NOTE</span>";

      node.addEventListener("pointerdown", event => this.startDrag(event, embed.id));
      this.root.appendChild(node);
      this.embedEls.set(embed.id, node);
    });
  }

  startDrag(event, embedId) {
    const embed = this.currentEmbeds.find(item => item.id === embedId);
    if (!embed) return;

    const size = shapeSize(embed.shape);
    const point = this.localPoint(event);
    this.dragging = {
      embed,
      size,
      offset: {
        x: point.x - embed.position.x,
        y: point.y - embed.position.y,
      },
    };

    document.body.classList.add("dragging-embed");
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  render() {
    if (!this.root) return;

    const width = this.contentWidth();
    if (!width) return;

    const layoutStart = performance.now();
    const result = flowLayout({
      text: REFLOW_TEXT,
      font: DEMO_FONT,
      width,
      lineHeight: DEMO_LINE_HEIGHT,
      paragraphGap: 28,
      characterPositions: true,
      embeds: this.currentEmbeds.map(embed => ({
        id: embed.id,
        shape: embed.shape,
        margin: embed.margin,
        position: {
          type: "absolute",
          x: embed.position.x,
          y: embed.position.y,
        },
      })),
    });
    const layoutMs = performance.now() - layoutStart;

    this.lastResult = result;
    this.reflows += 1;

    while (this.lines.length < result.lines.length) {
      const line = document.createElement("span");
      line.className = "flow-line";
      line.style.font = DEMO_FONT;
      line.style.lineHeight = `${DEMO_LINE_HEIGHT}px`;
      this.root.appendChild(line);
      this.lines.push(line);
    }

    this.lines.forEach((lineEl, index) => {
      const line = result.lines[index];
      if (!line) {
        lineEl.style.display = "none";
        return;
      }
      lineEl.style.display = "";
      lineEl.textContent = line.text;
      lineEl.style.left = `${DEMO_PADDING + line.x}px`;
      lineEl.style.top = `${DEMO_PADDING + line.y}px`;
    });

    result.embeds.forEach(resolved => {
      const node = this.embedEls.get(resolved.id);
      if (!node) return;

      node.style.left = `${DEMO_PADDING + resolved.rect.x}px`;
      node.style.top = `${DEMO_PADDING + resolved.rect.y}px`;
      node.style.width = `${resolved.rect.width}px`;
      node.style.height = `${resolved.rect.height}px`;
      node.style.borderRadius = resolved.embed.shape.type === "circle" ? "999px" : "4px";
    });

    this.layoutMinHeight = Math.max(720, result.height + DEMO_PADDING * 2 + 24);
    this.root.style.minHeight = `${this.layoutMinHeight}px`;

    if (this.metricLayout) this.metricLayout.textContent = `${layoutMs.toFixed(1)}ms`;
    if (this.metricLines) this.metricLines.textContent = String(result.lines.length);
    if (this.metricEmbeds) this.metricEmbeds.textContent = String(result.embeds.length);
    if (this.metricReflows) this.metricReflows.textContent = String(this.reflows);
  }

  updateInspector(event) {
    if (!this.lastResult) return;

    const point = this.localPoint(event);
    const embedId = hitTest(this.lastResult, point, 4);
    const charHit = hitTestCharacter(this.lastResult, point, DEMO_LINE_HEIGHT);

    if (this.inspectEmbed) this.inspectEmbed.textContent = embedId || "none";
    if (this.inspectCharacter) {
      this.inspectCharacter.textContent = charHit ? printableChar(charHit.char) : "none";
    }
    if (this.inspectLine) this.inspectLine.textContent = charHit ? String(charHit.line + 1) : "-";
    if (this.inspectPoint) {
      this.inspectPoint.textContent = `${Math.round(point.x)}, ${Math.round(point.y)}`;
    }

    this.embedEls.forEach((node, id) => {
      node.classList.toggle("is-hovered", id === embedId);
    });
  }

  resetInspector() {
    if (this.inspectEmbed) this.inspectEmbed.textContent = "none";
    if (this.inspectCharacter) this.inspectCharacter.textContent = "none";
    if (this.inspectLine) this.inspectLine.textContent = "-";
    if (this.inspectPoint) this.inspectPoint.textContent = "0, 0";
    this.embedEls.forEach(node => node.classList.remove("is-hovered"));
  }

  localPoint(event) {
    const rect = this.root.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - DEMO_PADDING,
      y: event.clientY - rect.top - DEMO_PADDING,
    };
  }
}

class MotionLab {
  constructor() {
    this.destroyed = false;
    this.isActive = false;
    this.rafId = 0;
    this.root = document.getElementById("effects");
    this.artemisDemo = mountArtemisDemo({
      root: document.getElementById("animation-demo"),
      activeRoot: this.root,
      pauseButton: document.getElementById("toggle-animation"),
      speedInput: document.getElementById("motion-speed"),
      speedOutput: document.getElementById("motion-speed-output"),
      sweepInput: document.getElementById("motion-sweep"),
      sweepOutput: document.getElementById("motion-sweep-output"),
      autoActivity: false,
    });
    this.effectsSurface = new AnimatedEffectsSurface(document.getElementById("effects-demo"));
    this.effectsPauseButton = document.getElementById("toggle-effects");
    this.intensityInput = document.getElementById("effects-intensity");
    this.intensityOutput = document.getElementById("effects-intensity-output");

    this.bindControls();
    this.updateControlLabels();
    this.frame = this.frame.bind(this);
    this.activityCleanup = createActivityMonitor(this.root, active => {
      this.isActive = active;
      this.artemisDemo?.setActive(active);
      this.effectsSurface?.setViewportPaused(!active);
      if (active) {
        this.handleResize(); // only rebuilds if width actually changed
        this.ensureFrame();
      } else if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }, 0.4);
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.activityCleanup?.();
    this.artemisDemo?.destroy();
    this.effectsSurface?.destroy();
  }

  bindControls() {
    this.effectsPauseButton?.addEventListener("click", () => {
      const paused = this.effectsSurface.togglePause();
      this.effectsPauseButton.textContent = paused ? "Resume" : "Pause";
    });

    this.intensityInput?.addEventListener("input", event => {
      this.effectsSurface.setIntensity(event.target.value);
      this.updateControlLabels();
    });
  }

  updateControlLabels() {
    if (this.intensityOutput && this.intensityInput) {
      this.intensityOutput.textContent = intensityDescriptor(Number(this.intensityInput.value));
    }
  }

  ensureFrame() {
    if (this.destroyed || !this.isActive || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  handleResize(force = false) {
    this.artemisDemo?.handleResize(force);
    this.effectsSurface?.handleResize(force);
  }

  frame(time) {
    this.rafId = 0;
    if (this.destroyed || !this.isActive) return;
    this.effectsSurface?.tick(time);
    this.ensureFrame();
  }
}

class ArtemisDemo {
  constructor({
    root,
    activeRoot = root,
    pauseButton = null,
    speedInput = null,
    speedOutput = null,
    sweepInput = null,
    sweepOutput = null,
    autoActivity = true,
  } = {}) {
    this.root = root;
    this.activeRoot = activeRoot;
    this.pauseButton = pauseButton;
    this.speedInput = speedInput;
    this.speedOutput = speedOutput;
    this.sweepInput = sweepInput;
    this.sweepOutput = sweepOutput;
    this.destroyed = false;
    this.requestedActive = false;
    this.isActive = false;
    this.rafId = 0;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.handleReducedMotion = () => this.setActive(this.requestedActive);
    this.frame = this.frame.bind(this);
    this.layoutSurface = new AnimatedLayoutSurface(root, { autoActivity: false });

    this.bindControls();
    this.updateControlLabels();
    this.reducedMotion.addEventListener?.("change", this.handleReducedMotion);
    if (autoActivity && activeRoot) {
      this.activityCleanup = createActivityMonitor(activeRoot, active => this.setActive(active), 0.4);
    } else {
      this.layoutSurface.handleResize(true);
    }
  }

  bindControls() {
    this.pauseButton?.addEventListener("click", () => {
      const paused = this.layoutSurface.togglePause();
      this.pauseButton.textContent = paused ? "Resume" : "Pause";
      if (!paused) this.ensureFrame();
    });
    this.speedInput?.addEventListener("input", event => {
      this.layoutSurface.setSpeed(event.target.value);
      this.updateControlLabels();
    });
    this.sweepInput?.addEventListener("input", event => {
      this.layoutSurface.setSweep(event.target.value);
      this.updateControlLabels();
    });
  }

  updateControlLabels() {
    if (this.speedOutput && this.speedInput) {
      this.speedOutput.textContent = speedDescriptor(Number(this.speedInput.value));
    }
    if (this.sweepOutput && this.sweepInput) {
      this.sweepOutput.textContent = sweepDescriptor(Number(this.sweepInput.value));
    }
  }

  setActive(active) {
    this.requestedActive = Boolean(active);
    this.isActive = this.requestedActive && !this.reducedMotion.matches;
    if (this.pauseButton) this.pauseButton.hidden = this.reducedMotion.matches;
    this.layoutSurface.setViewportPaused(!this.isActive);
    this.layoutSurface.handleResize(true);
    if (!this.isActive && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.isActive) this.ensureFrame();
  }

  handleResize(force = false) {
    this.layoutSurface.handleResize(force);
  }

  ensureFrame() {
    if (this.destroyed || !this.isActive || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  frame(time) {
    this.rafId = 0;
    if (this.destroyed || !this.isActive) return;
    this.layoutSurface.tick(time);
    this.ensureFrame();
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.activityCleanup?.();
    this.reducedMotion.removeEventListener?.("change", this.handleReducedMotion);
    this.layoutSurface.destroy();
  }
}

class AnimatedLayoutSurface {
  constructor(root, { autoActivity = true } = {}) {
    this.root = root;
    this.lines = [];
    this.embedEls = new Map();
    this.speed = 52;
    this.sweep = 20;
    this.controller = null;
    this.guideOutbound = [];
    this.guideReturn = [];
    this.userPaused = false;
    this.viewportPaused = true;
    this.lastWidth = 0;

    if (!root) return;

    this.root.innerHTML = "";
    this.pathSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.pathSvg.classList.add("motion-guide");
    this.pathSvg.setAttribute("preserveAspectRatio", "none");
    this.pathPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.pathPath.setAttribute("vector-effect", "non-scaling-stroke");
    this.pathPath.classList.add("outbound-leg");
    this.pathPath2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.pathPath2.setAttribute("vector-effect", "non-scaling-stroke");
    this.pathPath2.classList.add("return-leg");
    this.pathSvg.append(this.pathPath, this.pathPath2);
    this.textLayer = document.createElement("div");
    this.textLayer.className = "motion-text-layer";
    this.root.append(this.pathSvg, this.textLayer);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(root);
    if (autoActivity) {
      this.activityCleanup = createActivityMonitor(root, active => {
        this.setViewportPaused(!active);
      }, 0.45);
    }
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.activityCleanup?.();
  }

  width() {
    return Math.max(200, this.root.getBoundingClientRect().width - MOTION_PADDING * 2);
  }

  togglePause() {
    this.userPaused = !this.userPaused;
    if (this.controller) {
      this.controller.paused = this.userPaused || this.viewportPaused;
    }
    return this.userPaused;
  }

  setViewportPaused(paused) {
    this.viewportPaused = paused;
    if (!paused && !this.controller) {
      // First-time activation only — build the controller.
      // Subsequent activations just unpause the existing one below.
      this.handleResize(true);
    }
    if (this.controller) {
      this.controller.paused = this.userPaused || this.viewportPaused;
    }
  }

  setSpeed(value) {
    this.speed = Number(value);
    if (!this.viewportPaused) {
      this.rebuild();
    }
  }

  setSweep(value) {
    this.sweep = Number(value);
    if (!this.viewportPaused) {
      this.rebuild();
    }
  }

  handleResize(force = false) {
    const width = this.width();
    if (!width) return;
    if (!force && this.lastWidth && Math.abs(width - this.lastWidth) < 2) return;
    this.lastWidth = width;
    if (this.viewportPaused && !force) {
      if (this.controller) {
        this.rebuild();
      }
      return;
    }
    this.rebuild();
  }

  rebuild() {
    if (!this.root) return;

    const elapsed = this.controller?.elapsed ?? 0;
    const width = this.width();
    const tempo = 0.72 + (this.speed / 100) * 0.92;
    const duration = 16400 / tempo; // longer path: two Earth orbits + translunar
    const mission = buildMissionGuide(width, this.sweep / 100);
    // Guide points are Orion centres so the dashed lines sit at Orion's visual centre
    this.guideOutbound = mission.outboundCenters;
    this.guideReturn   = mission.returnCenters;
    this.controller = createAnimationController({
      text: MOTION_LAYOUT_TEXT,
      font: MOTION_FONT,
      width,
      lineHeight: MOTION_LINE_HEIGHT,
      embeds: [
        {
          id: "earth",
          shape: { type: "circle", radius: mission.earth.radius },
          position: { type: "absolute", x: mission.earth.x, y: mission.earth.y },
          margin: 18,
        },
        {
          id: "moon",
          shape: { type: "circle", radius: mission.moon.radius },
          position: { type: "absolute", x: mission.moon.x, y: mission.moon.y },
          margin: 18,
        },
        {
          id: "orion",
          shape: { type: "rect", width: mission.orion.width, height: mission.orion.height },
          position: { type: "absolute", x: mission.points[0]?.x ?? 0, y: mission.points[0]?.y ?? 0 },
          margin: 14,
          keyframes: pointsToKeyframes(mission.points, duration),
          loop: "loop",
        },
      ],
    });

    primeController(this.controller, elapsed);
    this.controller.paused = this.userPaused || this.viewportPaused;
    this.render(this.controller.tick(performance.now()));
  }

  tick(time) {
    if (!this.controller || this.viewportPaused) return;
    this.render(this.controller.tick(time));
  }

  render(result) {
    const height = Math.max(420, result.height + MOTION_PADDING * 2 + 22);
    const rootWidth = Math.max(1, this.root.getBoundingClientRect().width);
    this.root.style.minHeight = `${height}px`;
    this.pathSvg.setAttribute("viewBox", `0 0 ${rootWidth} ${height}`);
    this.pathPath.setAttribute("d", pointsToSvgD(this.guideOutbound ?? [], MOTION_PADDING));
    this.pathPath2.setAttribute("d", pointsToSvgD(this.guideReturn ?? [], MOTION_PADDING));
    renderPlainLines(this.textLayer, this.lines, result, {
      padding: MOTION_PADDING,
      font: MOTION_FONT,
      lineHeight: MOTION_LINE_HEIGHT,
    });
    syncMotionEmbeds(this.root, this.embedEls, result, MOTION_PADDING);
  }
}

class AnimatedEffectsSurface {
  constructor(root) {
    this.root = root;
    this.lines = [];
    this.intensity = 34;
    this.cursor = null;
    this.controller = null;
    this.userPaused = false;
    this.viewportPaused = true;
    this.lastWidth = 0;

    if (!root) return;

    this.root.innerHTML = "";
    this.cursorGlow = document.createElement("div");
    this.cursorGlow.className = "motion-cursor-glow";
    this.textLayer = document.createElement("div");
    this.textLayer.className = "motion-text-layer";
    this.root.append(this.cursorGlow, this.textLayer);

    this.root.addEventListener("pointermove", event => {
      this.cursor = localMotionPoint(this.root, event, MOTION_PADDING);
      this.cursorGlow.style.opacity = "1";
      this.cursorGlow.style.left = `${this.cursor.x + MOTION_PADDING}px`;
      this.cursorGlow.style.top = `${this.cursor.y + MOTION_PADDING}px`;
      this.controller?.setCursor(this.cursor);
    });

    this.root.addEventListener("pointerleave", () => {
      this.cursor = null;
      this.cursorGlow.style.opacity = "0";
      this.controller?.setCursor(null);
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(root);
    this.activityCleanup = createActivityMonitor(root, active => {
      this.setViewportPaused(!active);
    }, 0.45);
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.activityCleanup?.();
  }

  width() {
    return Math.max(200, this.root.getBoundingClientRect().width - MOTION_PADDING * 2);
  }

  togglePause() {
    this.userPaused = !this.userPaused;
    if (this.controller) {
      this.controller.paused = this.userPaused || this.viewportPaused;
    }
    return this.userPaused;
  }

  setViewportPaused(paused) {
    this.viewportPaused = paused;
    if (!paused && !this.controller) {
      // First-time activation only — build the controller.
      this.handleResize(true);
    }
    if (this.controller) {
      this.controller.paused = this.userPaused || this.viewportPaused;
    }
  }

  setIntensity(value) {
    this.intensity = Number(value);
    if (!this.viewportPaused) {
      this.rebuild();
    }
  }

  handleResize(force = false) {
    const width = this.width();
    if (!width) return;
    if (!force && this.lastWidth && Math.abs(width - this.lastWidth) < 2) return;
    this.lastWidth = width;
    if (this.viewportPaused && !force) return;
    this.rebuild();
  }

  rebuild() {
    if (!this.root) return;

    const elapsed = this.controller?.elapsed ?? 0;
    const intensity = this.intensity / 100;
    this.controller = createAnimationController({
      text: MOTION_EFFECTS_TEXT,
      font: EFFECTS_FONT,
      width: this.width(),
      lineHeight: EFFECTS_LINE_HEIGHT,
      characterPositions: true,
      effects: [
        ambientDrift({ amplitude: 0.12 + intensity * 0.42, speed: 0.08 + intensity * 0.11 }),
        wave({ amplitude: 0.2 + intensity * 0.95, frequency: 0.04, speed: 0.34 + intensity * 0.36 }),
        cursorRipple({ strength: 0.9 + intensity * 3.4, decay: 0.032 - intensity * 0.008 }),
        inkDensity({ base: 0.985 - intensity * 0.03, variation: 0.015 + intensity * 0.03, speed: 0.03 + intensity * 0.03 }),
      ],
    });

    if (this.cursor) {
      this.controller.setCursor(this.cursor);
    }
    primeController(this.controller, elapsed);
    this.controller.paused = this.userPaused || this.viewportPaused;
    this.render(this.controller.tick(performance.now()));
  }

  tick(time) {
    if (!this.controller || this.viewportPaused) return;
    this.render(this.controller.tick(time));
  }

  render(result) {
    const height = Math.max(360, result.height + MOTION_PADDING * 2 + 14);
    this.root.style.minHeight = `${height}px`;
    renderCharacterLines(this.textLayer, this.lines, result, {
      padding: MOTION_PADDING,
      font: EFFECTS_FONT,
      lineHeight: EFFECTS_LINE_HEIGHT,
    });
  }
}

class ReadingTimerDemo {
  constructor(root) {
    this.root = root;
    this.lines = [];
    this.destroyed = false;
    this.rafId = 0;
    this.currentLine = 0;
    this.totalLines = 0;
    this.secondsPerStep = 5;
    this.linesPerStep = 1;
    this.userPaused = false;
    this.viewportPaused = true;
    this.elapsedIntoStep = 0;
    this.stepStartedAt = performance.now();
    this.lastWidth = 0;

    if (!root) return;

    this.toggleButton = document.getElementById("toggle-reading");
    this.secondsInput = document.getElementById("reading-seconds");
    this.secondsOutput = document.getElementById("reading-seconds-output");
    this.advanceInput = document.getElementById("reading-advance");
    this.advanceOutput = document.getElementById("reading-advance-output");
    this.lineOutput = document.getElementById("reading-line");
    this.totalLinesOutput = document.getElementById("reading-total-lines");
    this.countdownOutput = document.getElementById("reading-countdown");

    this.root.innerHTML = "";
    this.textLayer = document.createElement("div");
    this.textLayer.className = "reading-text-layer";
    this.marker = document.createElement("div");
    this.marker.className = "reading-marker";
    this.marker.innerHTML = [
      '<strong class="reading-marker-time">5s</strong>',
      '<span class="reading-marker-label">next step</span>',
      '<em class="reading-marker-line">line 1</em>',
    ].join("");
    this.markerTime = this.marker.querySelector(".reading-marker-time");
    this.markerLabel = this.marker.querySelector(".reading-marker-label");
    this.markerLine = this.marker.querySelector(".reading-marker-line");
    this.root.append(this.textLayer, this.marker);

    this.bindControls();
    this.updateLabels();
    this.frame = this.frame.bind(this);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(root);
    this.activityCleanup = createActivityMonitor(root, active => {
      this.setViewportPaused(!active);
    }, 0.4);
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.resizeObserver?.disconnect();
    this.activityCleanup?.();
  }

  bindControls() {
    this.toggleButton?.addEventListener("click", () => {
      this.togglePause();
    });

    this.secondsInput?.addEventListener("input", event => {
      this.secondsPerStep = Number(event.target.value);
      this.elapsedIntoStep = 0;
      this.stepStartedAt = performance.now();
      this.updateLabels();
      this.updateCountdownDisplay(this.secondsPerStep * 1000);
    });

    this.advanceInput?.addEventListener("input", event => {
      this.linesPerStep = Number(event.target.value);
      this.updateLabels();
      this.render();
    });
  }

  width() {
    return Math.max(280, this.root.getBoundingClientRect().width - READING_PADDING * 2);
  }

  ensureFrame() {
    if (this.destroyed || this.viewportPaused || this.userPaused || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  setViewportPaused(paused) {
    const duration = this.secondsPerStep * 1000;
    const now = performance.now();
    const previous = this.viewportPaused;
    this.viewportPaused = paused;

    if (paused === previous) {
      if (!paused) {
        this.handleResize(true);
        this.ensureFrame();
      }
      return;
    }

    if (paused) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.elapsedIntoStep = Math.min(duration, now - this.stepStartedAt);
    } else {
      this.stepStartedAt = now - this.elapsedIntoStep;
      this.handleResize(true);
      this.ensureFrame();
    }
    this.updateToggleLabel();
    this.updateCountdownDisplay(Math.max(0, duration - this.elapsedIntoStep));
  }

  togglePause() {
    const now = performance.now();
    if (this.userPaused) {
      this.userPaused = false;
      this.stepStartedAt = now - this.elapsedIntoStep;
      this.ensureFrame();
    } else {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.userPaused = true;
      this.elapsedIntoStep = Math.min(this.secondsPerStep * 1000, now - this.stepStartedAt);
    }
    this.updateToggleLabel();
    this.updateCountdownDisplay(Math.max(0, this.secondsPerStep * 1000 - this.elapsedIntoStep));
  }

  updateToggleLabel() {
    if (!this.toggleButton) return;
    this.toggleButton.textContent = this.userPaused ? "Resume" : "Pause";
  }

  updateLabels() {
    if (this.secondsOutput) {
      this.secondsOutput.textContent = `${this.secondsPerStep} sec`;
    }
    if (this.advanceOutput) {
      this.advanceOutput.textContent = `${this.linesPerStep} ${this.linesPerStep === 1 ? "line" : "lines"}`;
    }
  }

  handleResize(force = false) {
    const width = this.width();
    if (!width) return;
    if (!force && this.lastWidth && Math.abs(width - this.lastWidth) < 2) return;
    this.lastWidth = width;
    if (this.viewportPaused && !force) return;
    this.render();
  }

  frame(time) {
    this.rafId = 0;
    if (this.destroyed || this.viewportPaused || this.userPaused) return;

    const duration = this.secondsPerStep * 1000;
    while (time - this.stepStartedAt >= duration) {
      this.stepStartedAt += duration;
      this.advanceStep();
    }
    this.elapsedIntoStep = time - this.stepStartedAt;

    const remaining = Math.max(0, duration - this.elapsedIntoStep);
    this.updateCountdownDisplay(remaining);
    this.ensureFrame();
  }

  advanceStep() {
    const ceiling = Math.max(0, this.totalLines - 3);
    if (this.currentLine + this.linesPerStep > ceiling) {
      this.currentLine = 0;
    } else {
      this.currentLine += this.linesPerStep;
    }
    this.render();
  }

  render() {
    if (!this.root) return;

    const width = this.width();
    if (!width) return;

    const markerWidth = clamp(width * 0.18, 118, 156);
    const markerHeight = 72;
    const lineEstimate = Math.max(this.totalLines, 16);
    const markerX = Math.max(20, width - markerWidth - 20);
    const markerY = clamp(
      18 + this.currentLine * READING_LINE_HEIGHT,
      18,
      Math.max(18, lineEstimate * READING_LINE_HEIGHT - markerHeight - 12)
    );

    const result = flowLayout({
      text: READING_TIMER_TEXT,
      font: READING_FONT,
      width,
      lineHeight: READING_LINE_HEIGHT,
      paragraphGap: 24,
      embeds: [
        {
          id: "marker",
          shape: { type: "rect", width: markerWidth, height: markerHeight },
          margin: 18,
          position: { type: "absolute", x: markerX, y: markerY },
        },
      ],
    });

    this.totalLines = result.lines.length;
    this.currentLine = clamp(this.currentLine, 0, Math.max(0, this.totalLines - 1));

    const height = Math.max(360, result.height + READING_PADDING * 2 + 18);
    this.root.style.minHeight = `${height}px`;

    renderPlainLines(this.textLayer, this.lines, result, {
      padding: READING_PADDING,
      font: READING_FONT,
      lineHeight: READING_LINE_HEIGHT,
    });

    const marker = result.embeds.find(embed => embed.id === "marker");
    if (marker) {
      this.marker.style.left = `${READING_PADDING + marker.rect.x}px`;
      this.marker.style.top = `${READING_PADDING + marker.rect.y}px`;
      this.marker.style.width = `${marker.rect.width}px`;
      this.marker.style.height = `${marker.rect.height}px`;
    }

    if (this.lineOutput) {
      this.lineOutput.textContent = String(Math.min(this.totalLines, this.currentLine + 1));
    }
    if (this.totalLinesOutput) {
      this.totalLinesOutput.textContent = String(this.totalLines);
    }

    this.updateCountdownDisplay(Math.max(0, this.secondsPerStep * 1000 - this.elapsedIntoStep));
  }

  updateCountdownDisplay(remainingMs) {
    if (this.countdownOutput) {
      this.countdownOutput.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
    }
    if (this.markerTime) {
      this.markerTime.textContent = `${Math.max(1, Math.ceil(remainingMs / 1000))}s`;
    }
    if (this.markerLabel) {
      this.markerLabel.textContent = this.userPaused ? "paused" : "next step";
    }
    if (this.markerLine) {
      const visibleLine = Math.max(1, Math.min(this.totalLines || 1, this.currentLine + 1));
      this.markerLine.textContent = `line ${visibleLine}`;
    }
  }
}

class ColorThemeDemo {
  constructor(root, { autoActivity = true } = {}) {
    this.root = root;
    this.lines = [];
    this.embedEls = new Map();
    this.controller = null;
    this.rafId = 0;
    this.viewportPaused = true;
    this.lastWidth = 0;
    this.activeTheme = 'fire';
    this.requestedActive = false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.handleReducedMotion = () => this.setActive(this.requestedActive);

    if (!root) return;

    this.root.innerHTML = "";

    // Theme picker buttons
    this.picker = document.createElement("div");
    this.picker.className = "themes-picker";
    for (const key of Object.keys(THEMES_DATA)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "themes-btn";
      btn.dataset.theme = key;
      btn.textContent = THEMES_DATA[key].label;
      if (key === this.activeTheme) btn.setAttribute("aria-pressed", "true");
      btn.addEventListener("click", () => this.selectTheme(key));
      this.picker.appendChild(btn);
    }

    // Panel: holds text layer + embeds
    this.panel = document.createElement("div");
    this.panel.className = "themes-panel";
    this.panel.dataset.theme = this.activeTheme;

    this.eyebrow = document.createElement("p");
    this.eyebrow.className = "themes-eyebrow";
    this.eyebrow.textContent = THEMES_DATA[this.activeTheme].eyebrow;

    this.textLayer = document.createElement("div");
    this.textLayer.className = "themes-text-layer";

    this.panel.append(this.eyebrow, this.textLayer);
    this.root.append(this.picker, this.panel);

    this.frame = this.frame.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.panel);
    this.reducedMotion.addEventListener?.("change", this.handleReducedMotion);
    if (autoActivity) {
      this.activityCleanup = createActivityMonitor(this.root, active => this.setActive(active), 0.40);
    } else {
      this.handleResize(true);
    }
  }

  destroy() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
    this.resizeObserver?.disconnect();
    this.activityCleanup?.();
    this.reducedMotion.removeEventListener?.("change", this.handleReducedMotion);
  }

  setActive(active) {
    this.requestedActive = Boolean(active);
    this.setViewportPaused(!this.requestedActive || this.reducedMotion.matches);
    if (!this.controller) this.handleResize(true);
  }

  width() {
    return Math.max(200, this.panel.getBoundingClientRect().width - THEMES_PADDING * 2);
  }

  selectTheme(theme) {
    if (theme === this.activeTheme) return;
    this.activeTheme = theme;
    this.panel.dataset.theme = theme;
    this.eyebrow.textContent = THEMES_DATA[theme].eyebrow;
    // Update button aria-pressed states
    this.picker.querySelectorAll(".themes-btn").forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.theme === theme ? "true" : "false");
    });
    // Null the controller so rebuild() treats this as a fresh start (elapsed = 0)
    this.controller = null;
    this.rebuild();
    if (!this.viewportPaused) this.ensureFrame();
  }

  setViewportPaused(paused) {
    this.viewportPaused = paused;
    if (!paused && !this.controller) {
      this.handleResize(true);
    }
    if (this.controller) {
      this.controller.paused = this.viewportPaused;
    }
    if (!paused) this.ensureFrame();
  }

  handleResize(force = false) {
    const width = this.width();
    if (!width) return;
    if (!force && this.lastWidth && Math.abs(width - this.lastWidth) < 2) return;
    this.lastWidth = width;
    if (this.viewportPaused && !force) {
      if (this.controller) this.rebuild();
      return;
    }
    this.rebuild();
  }

  rebuild() {
    if (!this.root) return;
    const elapsed = this.controller?.elapsed ?? 0;
    const config = buildThemeConfig(this.activeTheme, this.width());
    this.controller = createAnimationController({
      text: config.text,
      font: THEMES_FONT,
      width: this.width(),
      lineHeight: THEMES_LINE_HEIGHT,
      embeds: config.embeds,
    });
    primeController(this.controller, elapsed);
    this.controller.paused = this.viewportPaused;
    this.render(this.controller.tick(performance.now()));
  }

  ensureFrame() {
    if (this.viewportPaused || this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  frame(time) {
    this.rafId = 0;
    if (this.viewportPaused || !this.controller) return;
    this.render(this.controller.tick(time));
    this.ensureFrame();
  }

  render(result) {
    if (!result) return;
    const height = Math.max(320, result.height + THEMES_PADDING * 2 + 16);
    this.panel.style.minHeight = `${height}px`;
    renderPlainLines(this.textLayer, this.lines, result, {
      padding: THEMES_PADDING,
      font: THEMES_FONT,
      lineHeight: THEMES_LINE_HEIGHT,
    });
    syncThemeEmbeds(this.panel, this.embedEls, result, THEMES_PADDING);
  }
}

function primeController(controller, elapsed) {
  const now = performance.now();
  const start = Math.max(0, now - elapsed);
  controller.tick(start);
  controller.tick(now);
}

function renderPlainLines(layer, lineEls, result, options) {
  while (lineEls.length > result.lines.length) {
    lineEls.pop()?.remove();
  }

  while (lineEls.length < result.lines.length) {
    const lineEl = document.createElement("div");
    lineEl.className = "motion-line";
    layer.appendChild(lineEl);
    lineEls.push(lineEl);
  }

  lineEls.forEach((lineEl, index) => {
    const line = result.lines[index];
    if (!line) {
      lineEl.style.display = "none";
      return;
    }

    lineEl.style.display = "";
    lineEl.style.left = `${options.padding + line.x}px`;
    lineEl.style.top = `${options.padding + line.y}px`;
    lineEl.style.font = options.font;
    lineEl.style.lineHeight = `${options.lineHeight}px`;
    lineEl.textContent = line.text;
  });
}

function renderCharacterLines(layer, lineEls, result, options) {
  while (lineEls.length > result.lines.length) {
    lineEls.pop()?.remove();
  }

  while (lineEls.length < result.lines.length) {
    const lineEl = document.createElement("div");
    lineEl.className = "motion-line";
    layer.appendChild(lineEl);
    lineEls.push(lineEl);
  }

  lineEls.forEach((lineEl, lineIndex) => {
    const line = result.lines[lineIndex];
    if (!line) {
      lineEl.style.display = "none";
      return;
    }

    lineEl.style.display = "";
    lineEl.style.left = `${options.padding + line.x}px`;
    lineEl.style.top = `${options.padding + line.y}px`;
    lineEl.style.font = options.font;
    lineEl.style.lineHeight = `${options.lineHeight}px`;

    const glyphs = line.characters?.map(character => character.char) ?? Array.from(line.text);
    while (lineEl.childNodes.length < glyphs.length) {
      const charEl = document.createElement("span");
      charEl.className = "motion-char";
      lineEl.appendChild(charEl);
    }
    while (lineEl.childNodes.length > glyphs.length) {
      lineEl.lastChild.remove();
    }

    glyphs.forEach((glyph, charIndex) => {
      const charEl = lineEl.childNodes[charIndex];
      const transform = result.characterTransforms?.[lineIndex]?.[charIndex];
      const dx = clamp(transform?.dx ?? 0, -6, 6);
      const dy = clamp(transform?.dy ?? 0, -7, 7);
      const rotation = clamp(transform?.rotation ?? 0, -0.18, 0.18);
      const scale = clamp(transform?.scale ?? 1, 0.95, 1.06);
      charEl.textContent = glyph;
      charEl.style.opacity = String(clamp(transform?.opacity ?? 1, 0.84, 1));
      charEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}rad) scale(${scale})`;
    });
  });
}

function syncMotionEmbeds(root, embedEls, result, padding) {
  const wanted = new Set(result.embeds.map(embed => embed.id));

  embedEls.forEach((node, id) => {
    if (!wanted.has(id)) {
      node.remove();
      embedEls.delete(id);
    }
  });

  result.embeds.forEach(embed => {
    let node = embedEls.get(embed.id);
    if (!node) {
      node = document.createElement("div");
      node.innerHTML = '<span class="motion-embed__label"></span>';
      root.appendChild(node);
      embedEls.set(embed.id, node);
    }

    const meta = motionEmbedMeta(embed.id);
    node.className = `motion-embed ${meta.className}`;
    const label = node.querySelector(".motion-embed__label");
    if (label) {
      label.textContent = meta.label;
    }

    node.style.left = `${padding + embed.rect.x}px`;
    node.style.top = `${padding + embed.rect.y}px`;
    node.style.width = `${embed.rect.width}px`;
    node.style.height = `${embed.rect.height}px`;
  });
}

function motionEmbedMeta(id) {
  if (id === "earth") {
    return { className: "motion-embed--earth", label: "Earth" };
  }
  if (id === "moon") {
    return { className: "motion-embed--moon", label: "Moon" };
  }
  return { className: "motion-embed--orion", label: "Orion" };
}

function buildMissionGuide(width, sweep) {
  const compact = width < 460;

  const earthRadius = compact ? 40 : 58;
  const moonRadius  = compact ? 22 : 32;
  const orion       = compact ? { width: 60, height: 22 } : { width: 78, height: 26 };
  const hPad        = compact ? 14 : 22;
  const earthCx     = hPad + earthRadius;
  const cy          = compact ? 160 : 182;
  const moonCx      = Math.max(
    earthCx + earthRadius + moonRadius + (compact ? 88 : 130),
    width - hPad - moonRadius,
  );

  const earth       = { x: earthCx - earthRadius, y: cy - earthRadius, radius: earthRadius };
  const moon        = { x: moonCx  - moonRadius,  y: cy - moonRadius,  radius: moonRadius  };
  const earthCenter = { x: earthCx, y: cy };
  const moonCenter  = { x: moonCx,  y: cy };

  // ── Artemis II — double-spiral + figure-8 ────────────────────────────────
  // Phase 1  inner checkout orbit  (tight loop around Earth)         → amber
  // Phase 1b transition arc        (steps out to outer orbit)        → amber
  // Phase 2  outer transfer orbit  (full loop; exits at TLI)         → amber
  // Phase 3  translunar outbound   (rises ABOVE cy toward Moon)      → amber
  // Phase 4a Moon approach arc     (upper-left → far side)           → amber
  // Phase 4b Moon departure arc    (far side → lower-left)           → blue
  // Phase 5  trans-Earth return    (dips BELOW cy, crosses outbound  → blue
  //                                 to complete the figure-8)

  // Inner checkout orbit: fixed small margin above Earth surface
  const eoR1 = earthRadius + (compact ? 14 : 19);

  // Outer transfer orbit: grows with sweep (near-side = compact ring, wide loop = large oval)
  const eoR2 = earthRadius + (compact ? 20 : 28) + sweep * (compact ? 44 : 64);

  // Translunar arc geometry
  const outH = (compact ? 56 : 80)  + sweep * (compact ? 14 : 18);
  const retD = (compact ? 44 : 64)  + sweep * (compact ? 12 : 16);
  const midX = earthCx + (moonCx - earthCx) * 0.50;

  // Moon flyby clearance
  const mfR  = moonRadius + (compact ? 12 : 18) + sweep * (compact ? 6 : 10);

  // Key orbit angles (screen y-down; increasing angle = clockwise visually)
  const reentryAngle   =  0.52;   // inner orbit re-entry point, lower-right
  const innerXferAngle =  0.12;   // inner orbit transfer-out point, just above horizontal
  const outerStartAngle =  0.16;  // outer orbit starts here (slight step past innerXfer)
  const tliAngle       = -0.38;   // TLI injection, upper-right on outer orbit

  const mfApproachAngle = -Math.PI * 0.78;  // Moon upper-left approach (~-140°)
  const mfDepartAngle   =  Math.PI * 0.78;  // Moon lower-left departure (~+140°)

  // Waypoints
  const reentryPt    = pointOnCircle(earthCenter, eoR1, reentryAngle);
  const innerXferPt  = pointOnCircle(earthCenter, eoR1, innerXferAngle);
  const outerStartPt = pointOnCircle(earthCenter, eoR2, outerStartAngle);
  const tliPt        = pointOnCircle(earthCenter, eoR2, tliAngle);
  const mfApproachPt = pointOnCircle(moonCenter,  mfR,  mfApproachAngle);
  const mfDepartPt   = pointOnCircle(moonCenter,  mfR,  mfDepartAngle);

  // ── Phase 1: inner checkout orbit (counterclockwise, almost full circle) ──
  const innerLoopPts = sampleArcPoints(
    earthCenter, eoR1, reentryAngle, innerXferAngle + 2 * Math.PI, 28,
  );

  // ── Phase 1b: radial step from inner to outer orbit on right side ─────────
  const xferMidX = earthCx + (eoR1 + eoR2) / 2;
  const transitionPts = sampleCubicCurve(
    innerXferPt,
    { x: xferMidX, y: innerXferPt.y  + (compact ? 5 : 7) },
    { x: xferMidX, y: outerStartPt.y - (compact ? 3 : 5) },
    outerStartPt,
    5,
  );

  // ── Phase 2: outer transfer orbit (counterclockwise, almost full circle) ──
  const outerLoopPts = sampleArcPoints(
    earthCenter, eoR2, outerStartAngle, tliAngle + 2 * Math.PI, 32,
  );

  // ── Phase 3: translunar outbound (bezier rising above cy toward Moon) ─────
  const outCtrl1 = { x: earthCx + eoR2 + (compact ? 22 : 32), y: cy - outH * 0.52 };
  const outCtrl2 = { x: midX    + (compact ? 14 : 20),         y: cy - outH        };
  const outboundPts = sampleCubicCurve(tliPt, outCtrl1, outCtrl2, mfApproachPt, 24);

  // ── Phase 4: Moon farside flyby ───────────────────────────────────────────
  const moonFlyby1 = sampleArcPoints(moonCenter, mfR, mfApproachAngle, 0,            12);
  const moonFlyby2 = sampleArcPoints(moonCenter, mfR, 0,              mfDepartAngle, 12);

  // ── Phase 5: trans-Earth return (bezier dipping below cy, figure-8 cross) ─
  const retCtrl1 = { x: midX    - (compact ? 10 : 14),         y: cy + retD        };
  const retCtrl2 = { x: earthCx + eoR1 + (compact ? 16 : 24), y: cy + retD * 0.46 };
  const returnPts = sampleCubicCurve(mfDepartPt, retCtrl1, retCtrl2, reentryPt, 24);

  // ── Two-colour guide arrays and full animation path ───────────────────────
  const outboundCenters = mergeSampledPoints(
    innerLoopPts, transitionPts, outerLoopPts, outboundPts, moonFlyby1,
  );
  const returnCenters = mergeSampledPoints(moonFlyby2, returnPts);
  const centers       = mergeSampledPoints(outboundCenters, returnCenters);
  const points        = centers.map(p => ({
    x: p.x - orion.width / 2,
    y: p.y - orion.height / 2,
  }));

  return { earth, moon, orion, points, centers, outboundCenters, returnCenters };
}

function sampleEllipsePoints(cx, cy, rx, ry, tilt, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = (2 * Math.PI * i) / steps - Math.PI / 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    pts.push({
      x: cx + rx * cosA * cosT - ry * sinA * sinT,
      y: cy + rx * cosA * sinT + ry * sinA * cosT,
    });
  }
  return pts;
}

function buildThemeConfig(theme, width) {
  const compact = width < 440;
  const H = compact ? 260 : 340;
  const s = compact ? 0.75 : 1;   // scale factor for compact mode

  if (theme === 'fire') {
    // Hearth: fixed circle at lower-center-left
    const hR = Math.round(28 * s);
    const hCx = Math.round(width * 0.40);
    const hCy = H - Math.round(54 * s);
    // Ember: animated circle orbiting above the hearth in a tall loop
    const eR = Math.round(15 * s);
    const eCx = hCx;
    const eCy = Math.round(H * 0.42);
    const orbitRx = Math.round(62 * s);
    const orbitRy = Math.round(110 * s);
    const centers = sampleEllipsePoints(eCx, eCy, orbitRx, orbitRy, 0, 36);
    const embedPts = centers.map(p => ({ x: p.x - eR, y: p.y - eR }));
    return {
      text: THEMES_DATA.fire.text,
      embeds: [
        {
          id: 'hearth',
          shape: { type: 'circle', radius: hR },
          position: { type: 'absolute', x: hCx - hR, y: hCy - hR },
          margin: 14,
        },
        {
          id: 'ember',
          shape: { type: 'circle', radius: eR },
          position: { type: 'absolute', x: embedPts[0].x, y: embedPts[0].y },
          margin: 11,
          keyframes: pointsToKeyframes(embedPts, 10800),
          loop: 'loop',
        },
      ],
    };
  }

  if (theme === 'sea') {
    // Reef: fixed circle at bottom-right
    const rR = Math.round(22 * s);
    const rCx = Math.round(width * 0.80);
    const rCy = H - Math.round(50 * s);
    // Fish/wave: animated rect sweeping through a wide horizontal ellipse
    const fW = Math.round(36 * s);
    const fH = Math.round(18 * s);
    const fCx = Math.round(width * 0.48);
    const fCy = Math.round(H * 0.46);
    const orbitRx = Math.round(width * 0.36);
    const orbitRy = Math.round(55 * s);
    const centers = sampleEllipsePoints(fCx, fCy, orbitRx, orbitRy, 0, 34);
    const embedPts = centers.map(p => ({ x: p.x - fW / 2, y: p.y - fH / 2 }));
    return {
      text: THEMES_DATA.sea.text,
      embeds: [
        {
          id: 'reef',
          shape: { type: 'circle', radius: rR },
          position: { type: 'absolute', x: rCx - rR, y: rCy - rR },
          margin: 14,
        },
        {
          id: 'fish',
          shape: { type: 'rect', width: fW, height: fH, borderRadius: Math.round(9 * s) },
          position: { type: 'absolute', x: embedPts[0].x, y: embedPts[0].y },
          margin: 11,
          keyframes: pointsToKeyframes(embedPts, 9200),
          loop: 'loop',
        },
      ],
    };
  }

  if (theme === 'forest') {
    // Canopy: fixed circle at top-left (the tree)
    const cR = Math.round(32 * s);
    const cCx = Math.round(cR + 12 * s);
    const cCy = Math.round(cR + 18 * s);
    // Leaf: animated small rect falling in a tilted ellipse
    const lW = Math.round(26 * s);
    const lH = Math.round(16 * s);
    const lCx = Math.round(width * 0.54);
    const lCy = Math.round(H * 0.50);
    const orbitRx = Math.round(90 * s);
    const orbitRy = Math.round(128 * s);
    const centers = sampleEllipsePoints(lCx, lCy, orbitRx, orbitRy, 0.18, 36);
    const embedPts = centers.map(p => ({ x: p.x - lW / 2, y: p.y - lH / 2 }));
    return {
      text: THEMES_DATA.forest.text,
      embeds: [
        {
          id: 'canopy',
          shape: { type: 'circle', radius: cR },
          position: { type: 'absolute', x: cCx - cR, y: cCy - cR },
          margin: 14,
        },
        {
          id: 'leaf',
          shape: { type: 'rect', width: lW, height: lH, borderRadius: Math.round(7 * s) },
          position: { type: 'absolute', x: embedPts[0].x, y: embedPts[0].y },
          margin: 10,
          keyframes: pointsToKeyframes(embedPts, 11600),
          loop: 'loop',
        },
      ],
    };
  }

  // cosmos (default)
  // Planet: fixed circle at center of layout
  const pR = Math.round(24 * s);
  const pCx = Math.round(width * 0.52);
  const pCy = Math.round(H * 0.48);
  // Comet: animated rect on a tilted elliptical orbit around the planet
  const cW = Math.round(44 * s);
  const cH = Math.round(14 * s);
  const orbitRx = Math.round(116 * s);
  const orbitRy = Math.round(72 * s);
  const centers = sampleEllipsePoints(pCx, pCy, orbitRx, orbitRy, 0.30, 36);
  const embedPts = centers.map(p => ({ x: p.x - cW / 2, y: p.y - cH / 2 }));
  return {
    text: THEMES_DATA.cosmos.text,
    embeds: [
      {
        id: 'planet',
        shape: { type: 'circle', radius: pR },
        position: { type: 'absolute', x: pCx - pR, y: pCy - pR },
        margin: 14,
      },
      {
        id: 'comet',
        shape: { type: 'rect', width: cW, height: cH, borderRadius: Math.round(6 * s) },
        position: { type: 'absolute', x: embedPts[0].x, y: embedPts[0].y },
        margin: 10,
        keyframes: pointsToKeyframes(embedPts, 12400),
        loop: 'loop',
      },
    ],
  };
}

function syncThemeEmbeds(panel, embedEls, result, padding) {
  const wanted = new Set(result.embeds.map(e => e.id));
  embedEls.forEach((node, id) => {
    if (!wanted.has(id)) {
      node.remove();
      embedEls.delete(id);
    }
  });
  result.embeds.forEach(embed => {
    let node = embedEls.get(embed.id);
    if (!node) {
      node = document.createElement("div");
      node.className = `theme-embed theme-embed--${embed.id}`;
      panel.appendChild(node);
      embedEls.set(embed.id, node);
    }
    node.style.left = `${padding + embed.rect.x}px`;
    node.style.top = `${padding + embed.rect.y}px`;
    node.style.width = `${embed.rect.width}px`;
    node.style.height = `${embed.rect.height}px`;
  });
}

function sampleCubicCurve(p0, p1, p2, p3, steps) {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    points.push(cubicBezierPoint(p0, p1, p2, p3, index / steps));
  }
  return points;
}

function sampleArcPoints(center, radius, startAngle, endAngle, steps) {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = startAngle + (endAngle - startAngle) * (index / steps);
    points.push(pointOnCircle(center, radius, angle));
  }
  return points;
}

function mergeSampledPoints(...segments) {
  const points = [];
  segments.forEach(segment => {
    segment.forEach(point => {
      const previous = points[points.length - 1];
      if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) > 0.5) {
        points.push(point);
      }
    });
  });
  return points;
}

function pointsToKeyframes(points, duration) {
  if (points.length === 0) return [];
  return points.map((point, index) => ({
    time: duration * (index / Math.max(1, points.length - 1)),
    position: { type: "absolute", x: point.x, y: point.y },
    easing: "linear",
  }));
}

function pointsToSvgD(points, padding) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x + padding} ${points[0].y + padding}`;
  for (let index = 1; index < points.length; index += 1) {
    path += ` L ${points[index].x + padding} ${points[index].y + padding}`;
  }
  return path;
}

function localMotionPoint(root, event, padding) {
  const rect = root.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - padding,
    y: event.clientY - rect.top - padding,
  };
}

function speedDescriptor(value) {
  if (value < 38) return "slow burn";
  if (value < 68) return "flight pace";
  return "boost";
}

function sweepDescriptor(value) {
  if (value < 38) return "near side";
  if (value < 68) return "free-return";
  return "wide loop";
}

function intensityDescriptor(value) {
  if (value < 22) return "still";
  if (value < 58) return "page drift";
  return "gusty";
}

function drawTrackedText(ctx, text, x, y, tracking) {
  let cursorX = x;
  Array.from(text).forEach((glyph, index, glyphs) => {
    ctx.fillText(glyph, cursorX, y);
    cursorX += ctx.measureText(glyph).width;
    if (index < glyphs.length - 1) {
      cursorX += tracking;
    }
  });
}

function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function pointOnCircle(center, radius, angle) {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

function shapeSize(shape) {
  if (shape.type === "circle") {
    return { width: shape.radius * 2, height: shape.radius * 2 };
  }
  if (shape.type === "ellipse") {
    return { width: shape.radiusX * 2, height: shape.radiusY * 2 };
  }
  return { width: shape.width, height: shape.height };
}

function embedClassName(embed) {
  return embed.kind === "pool" ? "embed-node-pool" : "embed-node-note";
}

function printableChar(char) {
  return char === " " ? "space" : char;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

if (document.body?.dataset.demoSite === "canonical") initPage();
