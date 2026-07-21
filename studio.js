import {
  ambientDrift,
  applyEffects,
  cursorRipple,
  flowLayout,
  hullFromImage,
  wave,
} from './dist/index.js'
import {
  mountArtemisDemo,
  mountElementsDemo,
  mountFlowHero,
} from './demos/demo-site.js'

const WELCOME_STORAGE_KEY = 'pretext-studio:welcome-seen'
const DEFAULT_COLUMN_WIDTH = 620
const STORY_COLUMN_WIDTH = 560
const SAMPLE_TEXT = [
  'Artemis II will carry four astronauts around the far side of the Moon and back, the first crewed lunar voyage in over fifty years. The mission tests the systems a longer stay will one day depend on.',
  'For about ten days the crew will travel farther from Earth than any human has gone before, then turn toward home.',
].join('\n')

const READING_TEXT = [
  'Before this goes out, read it at the speed of another person. Notice where you rush, where a line needs air, and where you start rewriting in your head.',
  'The marker keeps your place while you rehearse a talk, check a difficult email, or see whether a paragraph lands before you send it.',
  'Let it move one line at a time. Your only job is to stay with the words.',
].join('\n')

const STORY_TEXT = 'The storm had gone before midnight, leaving the fire escape silver with rain. Across the courtyard, one kitchen light stayed on. A curtain lifted, settled, and lifted again while the building held its breath. On the desk, the paragraph waited for morning, keeping a little weather of its own.'

const PREMISE_TEXT = 'A paragraph is usually a wall of words. Give it one thing to care about—a shape, a reader, a pace—and it starts to behave like a place. The words move over, hold their line, and keep reading exactly the way they should.'

const FONT_FAMILIES = {
  editorial: '"Source Serif 4", Georgia, serif',
  humanist: 'Charter, "Bitstream Charter", "Sitka Text", Georgia, serif',
  sans: '"Avenir Next", Avenir, "Segoe UI", Helvetica, sans-serif',
}

const SCENE_LIMITS = {
  width: [160, 820],
  fontSize: [15, 24],
  lineHeight: [18, 60],
  paragraphGap: [0, 80],
  margin: [0, 80],
  radius: [8, 410],
  shapeWidth: [16, 820],
  shapeHeight: [16, 1200],
  polygonWidth: [1, 820],
  polygonHeight: [1, 1200],
  position: [0, 100000],
  imageThreshold: [0, 255],
  imageScale: [50, 150],
  imageDescriptionLength: 300,
}

const IMAGE_SAMPLE_LIMIT = {
  maxEdge: 1024,
  maxPixels: 1024 * 1024,
}

const BEHAVIOR_TEXT_LIMIT = 1500

const BEHAVIOR_DEFS = {
  ambientDrift: {
    label: 'Breathe',
    mode: 'continuous',
    modeLabel: 'Continuous',
    folio: 'Breathe / 01',
    kicker: 'A passage in quiet motion',
    title: 'The letters keep a measured breath.',
    deck: 'A continuous ambient drift moves the passage without changing its portable text.',
    factory: ambientDrift,
    values: {
      speed: { label: 'Speed', min: 0.05, max: 1, step: 0.05, default: 0.2, unit: 'rate' },
      amplitude: { label: 'Amplitude', min: 1, max: 8, step: 0.5, default: 4, unit: 'px' },
    },
  },
  wave: {
    label: 'Wave',
    mode: 'continuous',
    modeLabel: 'Continuous',
    folio: 'Wave / 02',
    kicker: 'A line carries the rhythm',
    title: 'The sentence rises, then settles.',
    deck: 'A spatial wave moves through the characters with editable speed, amplitude, and frequency.',
    factory: wave,
    values: {
      speed: { label: 'Speed', min: 0.1, max: 2, step: 0.1, default: 1, unit: 'rate' },
      amplitude: { label: 'Amplitude', min: 1, max: 10, step: 0.5, default: 3, unit: 'px' },
      frequency: { label: 'Frequency', min: 0.01, max: 0.12, step: 0.005, default: 0.05, unit: 'rad/px' },
    },
  },
  cursorRipple: {
    label: 'Pointer ripple',
    mode: 'pointer',
    modeLabel: 'Responds to pointer',
    folio: 'Pointer ripple / 03',
    kicker: 'A local response in the line',
    title: 'The nearby letters answer the pointer.',
    deck: 'A radius around the pointer moves nearby letters; it is not a single-glyph hover.',
    factory: cursorRipple,
    values: {
      speed: { label: 'Speed', min: 0.1, max: 2, step: 0.1, default: 0.7, unit: 'rate' },
      strength: { label: 'Strength', min: 2, max: 16, step: 0.5, default: 8, unit: 'px' },
      decay: { label: 'Spatial decay', min: 0.005, max: 0.04, step: 0.001, default: 0.02, unit: 'per px' },
    },
  },
}

function defaultBehaviorValues() {
  return Object.fromEntries(
    Object.entries(BEHAVIOR_DEFS).map(([id, definition]) => [
      id,
      Object.fromEntries(
        Object.entries(definition.values).map(([key, value]) => [key, value.default]),
      ),
    ]),
  )
}

const PRESETS = {
  pullQuoteRight: {
    folio: 'Pull quote right / 01',
    kicker: 'A note in the margin',
    title: 'Attention changes the shape of a page.',
    deck: 'Move the selected object and watch the reading measure negotiate around it.',
    embedLabel: 'Pull',
    shape: 'rect',
    margin: 18,
    scale: 1,
    position(width, size) {
      return { x: width - size.width, y: 48 }
    },
  },
  heroInset: {
    folio: 'Hero inset / 02',
    kicker: 'An object at the opening',
    title: 'The first paragraph begins around a figure.',
    deck: 'A centered lead object turns the opening into a deliberate threshold.',
    embedLabel: 'Lead',
    shape: 'rect',
    margin: 24,
    scale: 1.24,
    position(width, size) {
      return { x: (width - size.width) / 2, y: 0 }
    },
  },
  magazineSpread: {
    folio: 'Magazine spread / 03',
    kicker: 'A figure holds the page',
    title: 'One strong shape sets the editorial rhythm.',
    deck: 'This single-embed study adapts the opposing-figure spread for direct composition.',
    embedLabel: 'Figure',
    shape: 'ellipse',
    margin: 16,
    scale: 1.06,
    position() {
      return { x: 0, y: 190 }
    },
  },
}

const state = {
  kind: 'layout',
  preset: 'pullQuoteRight',
  text: SAMPLE_TEXT,
  fontFamily: 'editorial',
  fontSize: 18,
  lineHeight: 30,
  paragraphGap: 22,
  columnWidth: DEFAULT_COLUMN_WIDTH,
  embedSource: 'primitive',
  shape: { type: 'rect', width: 184, height: 114 },
  image: {
    ready: false,
    shape: null,
    baseWidth: 0,
    baseHeight: 0,
    threshold: 32,
    scale: 100,
    description: '',
    decorative: false,
  },
  margin: 18,
  position: { x: 0, y: 48 },
  behavior: {
    id: 'ambientDrift',
    valuesById: defaultBehaviorValues(),
  },
  editorial: {
    kicker: '',
    headline: '',
    deck: '',
  },
}

const skipLink = document.querySelector('#skip-link')
const landingView = document.querySelector('#landing-view')
const composerView = document.querySelector('#composer-view')
const readingView = document.querySelector('#reading-view')
const appViews = [landingView, composerView, readingView]
const makeDesignButton = document.querySelector('#make-design')
const revisitProofScenesButton = document.querySelector('#revisit-proof-scenes')
const outcomeButtons = [...document.querySelectorAll('[data-outcome]')]
const landingProofs = [...document.querySelectorAll('[data-landing-proof]')]
const openFullProofButton = document.querySelector('#open-full-proof')
const homeButtons = [...document.querySelectorAll('[data-action="home"]')]

const welcome = document.querySelector('#welcome')
const firstPaintWelcomeState = document.documentElement.dataset.welcomeState
if (firstPaintWelcomeState === 'returning') welcome.hidden = true
const welcomeScreens = [...document.querySelectorAll('[data-welcome-screen]')]
const welcomeSkipButton = document.querySelector('#welcome-skip')
const welcomeBackButton = document.querySelector('#welcome-back')
const welcomeNextButton = document.querySelector('#welcome-next')
const welcomeCount = document.querySelector('#welcome-count')
const welcomeClosing = document.querySelector('#welcome-closing')

const guideStepOne = document.querySelector('#guide-step-one')
const guideStepTwo = document.querySelector('#guide-step-two')
const guideText = document.querySelector('#guide-text')
const guideContinueButton = document.querySelector('#guide-continue')
const guideExampleButton = document.querySelector('#guide-example')
const guideBackButton = document.querySelector('#guide-back')
const guideSkipButtons = [...document.querySelectorAll('[data-guide-skip]')]
const intentButtons = [...document.querySelectorAll('[data-intent]')]
const studioSurface = document.querySelector('#studio-surface')
const composerTabButtons = [...document.querySelectorAll('[data-composer-tab]')]
const textEditorCard = document.querySelector('#text-editor-card')
const textNextButtons = [...document.querySelectorAll('[data-text-next]')]
const liveComposer = document.querySelector('#live-composer')
const workspaceHeader = document.querySelector('.workspace-header')
const workspaceEyebrow = document.querySelector('#workspace-eyebrow')
const layoutControlsPanel = document.querySelector('#layout-controls-panel')
const behaviorControlsPanel = document.querySelector('#behavior-controls-panel')
const controlRail = document.querySelector('#control-rail')
const takeSceneButton = document.querySelector('#take-scene-button')
const openStoryButton = document.querySelector('#open-story')
const editStoryButton = document.querySelector('#edit-story')

const takeawayScrim = document.querySelector('#takeaway-scrim')
const takeawayModal = document.querySelector('#takeaway-modal')
const takeawayCloseButton = document.querySelector('#takeaway-close')

const stage = document.querySelector('#stage')
const compositionPage = document.querySelector('#composition-page')
const flowRegion = document.querySelector('#flow-region')
const flowLines = document.querySelector('#flow-lines')
const embedObject = document.querySelector('#embed-object')
const imagePreview = document.querySelector('#image-preview')
const imageHullOutline = document.querySelector('#image-hull-outline')
const imageHullPolygon = document.querySelector('#image-hull-polygon')
const imagePlaceholder = document.querySelector('#image-placeholder')
const linearSource = document.querySelector('#linear-source')
const status = document.querySelector('#studio-status')

const articleText = document.querySelector('#article-text')
const fontFamily = document.querySelector('#font-family')
const fontSize = document.querySelector('#font-size')
const lineHeight = document.querySelector('#line-height')
const columnWidth = document.querySelector('#column-width')
const fitPassageButton = document.querySelector('#fit-passage')
const paragraphGap = document.querySelector('#paragraph-gap')
const embedMargin = document.querySelector('#embed-margin')

const fontSizeOutput = document.querySelector('#font-size-output')
const lineHeightOutput = document.querySelector('#line-height-output')
const columnWidthOutput = document.querySelector('#column-width-output')
const paragraphGapOutput = document.querySelector('#paragraph-gap-output')
const embedMarginOutput = document.querySelector('#embed-margin-output')

const metricLines = document.querySelector('#metric-lines')
const metricWidth = document.querySelector('#metric-width')
const metricReflows = document.querySelector('#metric-reflows')
const positionX = document.querySelector('#position-x')
const positionY = document.querySelector('#position-y')
const emptyState = document.querySelector('#empty-state')
const viewportNote = document.querySelector('#viewport-note')
const behaviorViewportNote = document.querySelector('#behavior-viewport-note')
const workspaceTitle = document.querySelector('#workspace-title')

const articlePresetLabel = document.querySelector('#article-preset-label')
const articleKicker = document.querySelector('#article-kicker')
const articleTitle = document.querySelector('#article-title')
const articleDeck = document.querySelector('#article-deck')
const authorEditorial = document.querySelector('#author-editorial')
const authorEditorialKicker = document.querySelector('#author-editorial-kicker')
const authorEditorialHeadline = document.querySelector('#author-editorial-headline')
const authorEditorialDeck = document.querySelector('#author-editorial-deck')
const editorialKicker = document.querySelector('#editorial-kicker')
const editorialHeadline = document.querySelector('#editorial-headline')
const editorialDeck = document.querySelector('#editorial-deck')

const presetButtons = [...document.querySelectorAll('[data-preset]')]
const sceneKindButtons = [...document.querySelectorAll('[data-scene-kind]')]
const behaviorButtons = [...document.querySelectorAll('[data-behavior]')]
const behaviorControls = document.querySelector('#behavior-controls')
const behaviorMode = document.querySelector('#behavior-mode')
const behaviorValueControls = document.querySelector('#behavior-value-controls')
const layoutInteraction = document.querySelector('#layout-context')
const positionReadout = document.querySelector('#position-readout')
const behaviorInteraction = document.querySelector('#behavior-interaction')
const motionState = document.querySelector('#motion-state')
const motionToggle = document.querySelector('#motion-toggle')
const motionReplay = document.querySelector('#motion-replay')
const shapeButtons = [...document.querySelectorAll('[data-shape]')]
const embedSourceButtons = [...document.querySelectorAll('[data-embed-source]')]
const primitiveControls = document.querySelector('#primitive-controls')
const imageControls = document.querySelector('#image-controls')
const imageFile = document.querySelector('#image-file')
const imageAttachmentState = document.querySelector('#image-attachment-state')
const alphaThreshold = document.querySelector('#alpha-threshold')
const alphaThresholdOutput = document.querySelector('#alpha-threshold-output')
const imageScale = document.querySelector('#image-scale')
const imageScaleOutput = document.querySelector('#image-scale-output')
const imageDescription = document.querySelector('#image-description')
const imageDecorative = document.querySelector('#image-decorative')
const imageSamplingNote = document.querySelector('#image-sampling-note')
const imageStatus = document.querySelector('#image-status')
const resetPositionButton = document.querySelector('#reset-position')
const copySceneJsonButton = document.querySelector('#copy-scene-json')
const copyCanvasExampleButton = document.querySelector('#copy-canvas-example')
const copyDomExampleButton = document.querySelector('#copy-dom-example')
const downloadSceneButton = document.querySelector('#download-scene')
const sceneJsonOutput = document.querySelector('#scene-json-output')
const canvasExampleOutput = document.querySelector('#canvas-example-output')
const domExampleOutput = document.querySelector('#dom-example-output')

const shapeDimensionFields = [...document.querySelectorAll('[data-dimension]')]
const shapeDimensionInputs = {
  radius: document.querySelector('#shape-radius'),
  width: document.querySelector('#shape-width'),
  height: document.querySelector('#shape-height'),
  radiusX: document.querySelector('#shape-radius-x'),
  radiusY: document.querySelector('#shape-radius-y'),
}

const sceneImportJson = document.querySelector('#scene-import-json')
const loadSceneButton = document.querySelector('#load-scene')
const viewStartersButton = document.querySelector('#view-starters')
const sceneImportStatus = document.querySelector('#scene-import-status')

const readingSurface = document.querySelector('#reading-surface')
const readingLines = document.querySelector('#reading-lines')
const readingMarker = document.querySelector('#reading-marker')
const readingMarkerTime = document.querySelector('#reading-marker-time')
const readingMarkerState = document.querySelector('#reading-marker-state')
const readingMarkerLine = document.querySelector('#reading-marker-line')
const readingSource = document.querySelector('#reading-source')
const readingToggle = document.querySelector('#reading-toggle')
const readingStep = document.querySelector('#reading-step')
const readingSeconds = document.querySelector('#reading-seconds')
const readingSecondsOutput = document.querySelector('#reading-seconds-output')
const readingAdvance = document.querySelector('#reading-advance')
const readingAdvanceOutput = document.querySelector('#reading-advance-output')
const readingCurrentLine = document.querySelector('#reading-current-line')
const readingTotalLines = document.querySelector('#reading-total-lines')
const readingEditToggle = document.querySelector('#reading-edit-toggle')
const readingEditor = document.querySelector('#reading-editor')
const readingText = document.querySelector('#reading-text')
const readingEditDone = document.querySelector('#reading-edit-done')

const WELCOME_ORDER = ['premise', 'flow-hero', 'elements', 'artemis-ii']
let currentView = 'landing'
let selectedOutcome = 'flow-hero'
let welcomeMode = 'off'
let welcomeOrder = []
let welcomeIndex = 0
let welcomeReturnFocus = null
let takeawayReturnFocus = null
let composerMode = 'layout'
let guideDraft = ''
let guideHasVisitorText = false
const proofControllers = new Map()
let readingController = null

let lineElements = []
let characterElements = []
let visualMode = ''
let lastResult = null
let lastAccessibleText = null
let actualWidth = 0
let livePosition = { ...state.position }
let reflowCount = 0
let dragging = null
let portableOutputReady = false
let imageDecodeToken = 0
let thresholdFrame = null
let authorHasChanged = false
let localImage = {
  url: null,
  sampleImageData: null,
  naturalWidth: 0,
  naturalHeight: 0,
  sampleWidth: 0,
  sampleHeight: 0,
  sampled: false,
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const motion = {
  rafId: null,
  elapsed: 0,
  lastTimestamp: null,
  cursor: null,
  userPaused: false,
  reducedOverride: false,
  result: null,
  effect: null,
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function copyShape(shape) {
  if (!shape) return null
  if (shape.type !== 'polygon') return { ...shape }
  return {
    type: 'polygon',
    points: shape.points.map((point) => ({ x: point.x, y: point.y })),
    width: shape.width,
    height: shape.height,
  }
}

function polygonArea(points) {
  let twiceArea = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    twiceArea += current.x * next.y - next.x * current.y
  }
  return Math.abs(twiceArea) / 2
}

function polygonShapesMatch(first, second, tolerance = 0.01) {
  if (!first || !second || first.points.length !== second.points.length) return false
  return first.points.every((point, index) => {
    const comparison = second.points[index]
    return Math.abs(point.x - comparison.x) <= tolerance
      && Math.abs(point.y - comparison.y) <= tolerance
  })
}

function segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd) {
  const cross = (a, b, c) => (
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  )
  const onSegment = (a, b, point) => (
    point.x >= Math.min(a.x, b.x) - 0.0000001
      && point.x <= Math.max(a.x, b.x) + 0.0000001
      && point.y >= Math.min(a.y, b.y) - 0.0000001
      && point.y <= Math.max(a.y, b.y) + 0.0000001
  )
  const first = cross(firstStart, firstEnd, secondStart)
  const second = cross(firstStart, firstEnd, secondEnd)
  const third = cross(secondStart, secondEnd, firstStart)
  const fourth = cross(secondStart, secondEnd, firstEnd)
  if (Math.sign(first) !== Math.sign(second) && Math.sign(third) !== Math.sign(fourth)) return true
  if (Math.abs(first) <= 0.0000001 && onSegment(firstStart, firstEnd, secondStart)) return true
  if (Math.abs(second) <= 0.0000001 && onSegment(firstStart, firstEnd, secondEnd)) return true
  if (Math.abs(third) <= 0.0000001 && onSegment(secondStart, secondEnd, firstStart)) return true
  if (Math.abs(fourth) <= 0.0000001 && onSegment(secondStart, secondEnd, firstEnd)) return true
  return false
}

function rectanglePolygon(width, height) {
  return {
    type: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    width,
    height,
  }
}

function setImageStatus(message, messageState = '') {
  imageStatus.textContent = message
  imageStatus.dataset.state = messageState
}

function releaseLocalImage() {
  if (localImage.url) URL.revokeObjectURL(localImage.url)
  localImage = {
    url: null,
    sampleImageData: null,
    naturalWidth: 0,
    naturalHeight: 0,
    sampleWidth: 0,
    sampleHeight: 0,
    sampled: false,
  }
  imagePreview.removeAttribute('src')
}

function announce(message, messageState = '') {
  status.textContent = ''
  status.dataset.state = messageState
  requestAnimationFrame(() => {
    status.textContent = message
  })
}

function pagePadding() {
  return stage.getBoundingClientRect().width < 620 ? 20 : 42
}

function measuredColumnWidth() {
  const stageWidth = stage.getBoundingClientRect().width
  const padding = pagePadding()
  const outerSpace = stageWidth < 620 ? 24 : 76
  const available = Math.max(210, stageWidth - outerSpace - padding * 2)
  return Math.min(state.columnWidth, Math.floor(available))
}

function currentFont() {
  return `${state.fontSize}px ${FONT_FAMILIES[state.fontFamily]}`
}

function emptyEditorialContext() {
  return { kicker: '', headline: '', deck: '' }
}

function portableEditorialContext(editorial = state.editorial) {
  const portable = Object.fromEntries(
    Object.entries(editorial).filter(([, value]) => value.trim()),
  )
  return Object.keys(portable).length ? portable : null
}

function syncEditorialInputs() {
  editorialKicker.value = state.editorial.kicker
  editorialHeadline.value = state.editorial.headline
  editorialDeck.value = state.editorial.deck
}

function syncEditorialPreview() {
  const fields = [
    [authorEditorialKicker, state.editorial.kicker],
    [authorEditorialHeadline, state.editorial.headline],
    [authorEditorialDeck, state.editorial.deck],
  ]
  fields.forEach(([element, value]) => {
    element.textContent = value
    element.hidden = !value.trim()
  })
  authorEditorial.hidden = !portableEditorialContext()
}

function semanticArticleNodes(text, editorial = null) {
  const nodes = []
  if (editorial) {
    const header = document.createElement('header')
    ;[
      ['kicker', 'p'],
      ['headline', 'h1'],
      ['deck', 'p'],
    ].forEach(([key, tagName]) => {
      if (!editorial[key]?.trim()) return
      const element = document.createElement(tagName)
      element.textContent = editorial[key]
      header.appendChild(element)
    })
    if (header.childElementCount) nodes.push(header)
  }
  text.split('\n').forEach((paragraphText) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = paragraphText || ' '
    nodes.push(paragraph)
  })
  return nodes
}

function resetTakeItState() {
  authorHasChanged = false
  syncTakeSceneVisibility()
}

function syncTakeSceneVisibility() {
  takeSceneButton.hidden = !(
    authorHasChanged
      && currentView === 'composer'
      && guideStepOne.hidden
      && guideStepTwo.hidden
  )
}

function markSceneChanged() {
  if (currentView !== 'composer' || !guideStepOne.hidden || !guideStepTwo.hidden) return
  authorHasChanged = true
  syncTakeSceneVisibility()
}

function hasSeenWelcome() {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // First-run state remains session-only when storage is unavailable.
  }
}

function syncProofActivity() {
  for (const [host, controller] of proofControllers) {
    const landingProof = host.closest('[data-landing-proof]')
    const welcomeScreen = host.closest('[data-welcome-screen]')
    const activeOnLanding = Boolean(
      landingProof
        && currentView === 'landing'
        && welcome.hidden
        && landingProof.dataset.landingProof === selectedOutcome,
    )
    const activeInWelcome = Boolean(
      welcomeScreen
        && !welcome.hidden
        && welcomeScreen.dataset.welcomeScreen === welcomeOrder[welcomeIndex],
    )
    controller.setActive(activeOnLanding || activeInWelcome)
  }
}

function showView(name) {
  currentView = name
  appViews.forEach((view) => {
    view.hidden = view.dataset.studioView !== name
  })
  readingController?.setActive(name === 'reading' && welcome.hidden)
  if (name === 'landing') {
    skipLink.href = '#landing-outcomes'
    skipLink.textContent = 'Skip to Studio choices'
  } else if (name === 'composer') {
    skipLink.href = '#studio-surface'
    skipLink.textContent = 'Skip to composer'
  } else {
    skipLink.href = '#reading-surface'
    skipLink.textContent = 'Skip to reading study'
  }
  syncTakeSceneVisibility()
  syncProofActivity()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function selectOutcome(name) {
  selectedOutcome = name
  outcomeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.outcome === name))
  })
  landingProofs.forEach((proof) => {
    proof.hidden = proof.dataset.landingProof !== name
  })
  openFullProofButton.textContent = name === 'reading'
    ? 'Open the reading study'
    : 'See the full scene'
  syncProofActivity()
}

function trapFocus(container, event) {
  const focusable = [...container.querySelectorAll(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && !element.disabled && element.getClientRects().length)
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function renderWelcome() {
  const current = welcomeOrder[welcomeIndex]
  welcomeScreens.forEach((screen) => {
    screen.hidden = screen.dataset.welcomeScreen !== current
  })
  const solo = welcomeMode === 'solo'
  welcomeSkipButton.hidden = solo
  welcomeCount.textContent = solo
    ? ''
    : `${String(welcomeIndex + 1).padStart(2, '0')} / ${String(welcomeOrder.length).padStart(2, '0')}`
  welcomeBackButton.disabled = welcomeIndex === 0
  const last = welcomeIndex === welcomeOrder.length - 1
  welcomeNextButton.textContent = solo
    ? 'Back to Studio'
    : last
      ? 'That’s Cool! Let Me Explore!'
      : 'Next'
  welcomeNextButton.classList.toggle('is-final', last && !solo)
  welcomeClosing.hidden = !(last && !solo)
  syncProofActivity()
}

function openWelcome(mode, screen = '') {
  welcomeMode = mode
  welcomeOrder = mode === 'solo'
    ? [screen]
    : mode === 'proofs'
      ? WELCOME_ORDER.slice(1)
      : [...WELCOME_ORDER]
  welcomeIndex = 0
  welcomeReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  welcome.hidden = false
  readingController?.setActive(false)
  renderWelcome()
  requestAnimationFrame(() => welcomeNextButton.focus({ preventScroll: true }))
}

function closeWelcome(shouldPersist) {
  const firstVisit = welcomeMode === 'first'
  welcome.hidden = true
  if (shouldPersist && firstVisit) markWelcomeSeen()
  welcomeMode = 'off'
  welcomeOrder = []
  welcomeIndex = 0
  readingController?.setActive(currentView === 'reading')
  syncProofActivity()
  const focusTarget = firstVisit && shouldPersist ? makeDesignButton : welcomeReturnFocus
  focusTarget?.focus?.({ preventScroll: true })
  welcomeReturnFocus = null
}

function stepWelcome(direction) {
  const nextIndex = welcomeIndex + direction
  if (nextIndex < 0) return
  if (nextIndex >= welcomeOrder.length) {
    closeWelcome(welcomeMode === 'first')
    return
  }
  welcomeIndex = nextIndex
  renderWelcome()
  welcomeNextButton.focus({ preventScroll: true })
}

function openTakeaway() {
  if (!authorHasChanged) return
  syncPortableOutput(serializeScene())
  takeawayReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  takeawayScrim.hidden = false
  requestAnimationFrame(() => takeawayCloseButton.focus({ preventScroll: true }))
}

function closeTakeaway(restoreFocus = true) {
  takeawayScrim.hidden = true
  if (restoreFocus) takeawayReturnFocus?.focus?.({ preventScroll: true })
  takeawayReturnFocus = null
}

function syncComposerMode() {
  const textMode = composerMode === 'text'
  textEditorCard.hidden = !textMode
  liveComposer.hidden = textMode
  controlRail.hidden = textMode
  composerTabButtons.forEach((button) => {
    const selected = button.dataset.composerTab === composerMode
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-selected', String(selected))
    button.tabIndex = selected ? 0 : -1
  })
  syncTakeSceneVisibility()
}

function setComposerMode(mode, focus = false) {
  if (!['text', 'layout', 'textBehavior'].includes(mode)) return
  composerMode = mode
  syncComposerMode()
  if (mode === 'text') {
    articleText.value = state.text
  } else {
    if (state.kind !== mode) state.kind = mode
    syncSceneKindInterface()
    requestAnimationFrame(render)
  }
  if (focus) {
    const target = mode === 'text'
      ? articleText
      : workspaceTitle
    target.tabIndex = -1
    target.focus({ preventScroll: true })
  }
}

function resetSceneDraft(text, kind = 'layout', behaviorId = kind === 'textBehavior' ? 'wave' : 'ambientDrift') {
  imageDecodeToken += 1
  releaseLocalImage()
  state.kind = kind
  state.preset = 'pullQuoteRight'
  state.text = text
  state.fontFamily = 'editorial'
  state.fontSize = 18
  state.lineHeight = 30
  state.paragraphGap = 22
  state.columnWidth = DEFAULT_COLUMN_WIDTH
  state.embedSource = 'primitive'
  state.shape = { type: 'rect', width: 184, height: 114 }
  state.image = {
    ready: false,
    shape: null,
    baseWidth: 0,
    baseHeight: 0,
    threshold: 32,
    scale: 100,
    description: '',
    decorative: false,
  }
  state.margin = 18
  state.position = presetPosition('pullQuoteRight', state.columnWidth, state.shape)
  state.behavior = {
    id: behaviorId,
    valuesById: defaultBehaviorValues(),
  }
  state.editorial = emptyEditorialContext()
  lastResult = null
  lastAccessibleText = null
  reflowCount = 0
  portableOutputReady = false
  resetMotionRuntime()
  sceneImportJson.value = ''
  setImportStatus('', '')
  syncPresetInterface()
  syncShapeInterface()
  syncEmbedSourceInterface()
  syncSceneKindInterface()
  syncControlsFromState()
  syncEditorialInputs()
  editStoryButton.hidden = true
  if (!liveComposer.hidden) render()
}

function startStoryDraft() {
  resetSceneDraft(STORY_TEXT, 'textBehavior', 'cursorRipple')
  state.columnWidth = STORY_COLUMN_WIDTH
  syncControlsFromState()
  editStoryButton.hidden = false
  authorHasChanged = true
  setComposerMode('textBehavior', true)
  syncTakeSceneVisibility()
  announce('Story starter loaded as an editable Pointer ripple text-behavior scene.')
}

function applyColumnWidth(nextWidth) {
  if (!Number.isFinite(nextWidth) || nextWidth <= 0 || nextWidth === state.columnWidth) return false
  const previousWidth = state.columnWidth
  state.position.x *= nextWidth / previousWidth
  state.columnWidth = nextWidth

  const shape = currentShape()
  const size = shapeSize(shape)
  if (size.width > nextWidth) {
    const fittedShape = scaledShape(shape, nextWidth / size.width)
    if (state.embedSource === 'image') {
      state.image.shape = fittedShape
      state.image.baseWidth = fittedShape.width
      state.image.baseHeight = fittedShape.height
      state.image.scale = 100
    } else {
      state.shape = fittedShape
    }
  }
  markSceneChanged()
  clampRequestedPosition()
  syncControlsFromState()
  render()
  return true
}

function fitMeasureToPassage() {
  const normalizedText = state.text.replace(/\s+/g, ' ').trim()
  if (!normalizedText) {
    announce('Add a passage before fitting its measure.', 'error')
    return
  }

  const characterCount = [...normalizedText].length
  const targetCharactersPerLine = 62
  const targetLineCount = Math.max(1, Math.round(characterCount / targetCharactersPerLine))
  let best = null
  for (let width = 360; width <= 680; width += 10) {
    const result = flowLayout({
      text: state.text,
      font: currentFont(),
      width,
      lineHeight: state.lineHeight,
      paragraphGap: state.paragraphGap,
      embeds: [],
    })
    const lineCount = Math.max(1, result.lines.length)
    const charactersPerLine = characterCount / lineCount
    const score = Math.abs(charactersPerLine - targetCharactersPerLine)
      + Math.abs(lineCount - targetLineCount) * 2
      + Math.abs(width - STORY_COLUMN_WIDTH) / 200
    if (!best || score < best.score) best = { width, score }
  }

  applyColumnWidth(best.width)
  announce(`Text measure fitted once to ${best.width} px. Typing will not change it.`, 'success')
  columnWidth.focus({ preventScroll: true })
}

function showGuideStep(step) {
  guideStepOne.hidden = step !== 1
  guideStepTwo.hidden = step !== 2
  studioSurface.hidden = true
  syncTakeSceneVisibility()
  const target = step === 1 ? guideText : intentButtons[0]
  target.focus({ preventScroll: true })
}

function startGuide() {
  showView('composer')
  guideDraft = ''
  guideHasVisitorText = false
  guideText.value = ''
  resetTakeItState()
  showGuideStep(1)
}

function finishGuide(intent) {
  const text = guideDraft.trim() ? guideDraft : SAMPLE_TEXT
  guideStepOne.hidden = true
  guideStepTwo.hidden = true
  if (intent === 'read') {
    readingController.setPassage(text)
    showView('reading')
    readingSurface.tabIndex = -1
    readingSurface.focus({ preventScroll: true })
    return
  }
  studioSurface.hidden = false
  const kind = intent === 'motion' ? 'textBehavior' : 'layout'
  resetSceneDraft(text, kind)
  authorHasChanged = guideHasVisitorText
  setComposerMode(kind, true)
  syncTakeSceneVisibility()
}

function defaultShape(type, width, presetKey = state.preset) {
  const scale = PRESETS[presetKey].scale

  if (type === 'circle') {
    return {
      type: 'circle',
      radius: Math.round(clamp(width * 0.082, 40, 58) * scale),
    }
  }

  if (type === 'ellipse') {
    const radiusX = Math.round(clamp(width * 0.132, 60, 90) * scale)
    return {
      type: 'ellipse',
      radiusX,
      radiusY: Math.round(radiusX * 0.58),
    }
  }

  const widthValue = Math.round(clamp(width * 0.27, 132, 188) * scale)
  return {
    type: 'rect',
    width: widthValue,
    height: Math.round(widthValue * 0.62),
  }
}

function scaledShape(shape, factor) {
  if (factor === 1) return copyShape(shape)
  if (shape.type === 'circle') {
    return { type: 'circle', radius: shape.radius * factor }
  }
  if (shape.type === 'ellipse') {
    return {
      type: 'ellipse',
      radiusX: shape.radiusX * factor,
      radiusY: shape.radiusY * factor,
    }
  }
  if (shape.type === 'polygon') {
    return {
      type: 'polygon',
      points: shape.points.map((point) => ({ x: point.x, y: point.y })),
      width: shape.width * factor,
      height: shape.height * factor,
    }
  }
  return {
    type: 'rect',
    width: shape.width * factor,
    height: shape.height * factor,
  }
}

function currentShape() {
  if (state.embedSource === 'image' && state.image.shape) return copyShape(state.image.shape)
  return copyShape(state.shape)
}

function shapeSize(shape) {
  if (shape.type === 'circle') {
    return { width: shape.radius * 2, height: shape.radius * 2 }
  }
  if (shape.type === 'ellipse') {
    return { width: shape.radiusX * 2, height: shape.radiusY * 2 }
  }
  return { width: shape.width, height: shape.height }
}

function shapeForWidth(shape, width) {
  const size = shapeSize(shape)
  if (size.width <= width) return copyShape(shape)
  return scaledShape(shape, width / size.width)
}

function createSemanticArticle(text, label) {
  const article = document.createElement('article')
  article.className = 'sr-only'
  article.setAttribute('aria-label', label)
  article.replaceChildren(...text.split('\n').map((paragraphText) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = paragraphText || ' '
    return paragraph
  }))
  return article
}

function syncProofLines(container, elements, result, font, lineHeight) {
  while (elements.length > result.lines.length) elements.pop()?.remove()
  while (elements.length < result.lines.length) {
    const line = document.createElement('span')
    line.className = 'proof-line'
    container.appendChild(line)
    elements.push(line)
  }
  elements.forEach((element, index) => {
    const line = result.lines[index]
    element.textContent = line.text
    element.style.left = `${line.x}px`
    element.style.top = `${line.y}px`
    element.style.font = font
    element.style.lineHeight = `${lineHeight}px`
  })
}

function placeProofObject(element, rect, insetX = 0, insetY = insetX) {
  element.style.left = `${rect.x + insetX}px`
  element.style.top = `${rect.y + insetY}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

class PremiseProof {
  constructor(host) {
    this.host = host
    this.active = false
    this.frameId = null
    this.lastPaint = 0
    this.lines = []
    this.frame = document.createElement('div')
    this.frame.className = 'proof-frame premise-proof'
    this.visual = document.createElement('div')
    this.visual.className = 'proof-visual-lines'
    this.visual.setAttribute('aria-hidden', 'true')
    this.orb = document.createElement('div')
    this.orb.className = 'proof-object premise-orb'
    this.orb.setAttribute('aria-hidden', 'true')
    this.frame.append(this.visual, this.orb)
    this.host.replaceChildren(this.frame, createSemanticArticle(PREMISE_TEXT, 'Paragraph making room demonstration'))
    this.onFrame = this.onFrame.bind(this)
    this.resizeObserver = new ResizeObserver(() => this.render(performance.now()))
    this.resizeObserver.observe(this.visual)
  }

  render(time) {
    const width = Math.floor(this.visual.getBoundingClientRect().width)
    if (width < 120) return
    const radius = clamp(width * 0.105, 30, 42)
    const y = reducedMotionQuery.matches ? 66 : 66 + Math.sin(time / 2100) * 28
    const position = { x: Math.max(0, width - radius * 2), y }
    const font = `16px ${FONT_FAMILIES.humanist}`
    const result = flowLayout({
      text: PREMISE_TEXT,
      font,
      width,
      lineHeight: 26,
      paragraphGap: 0,
      embeds: [{
        id: 'premise-form',
        shape: { type: 'circle', radius },
        margin: 14,
        position: { type: 'absolute', ...position },
      }],
    })
    syncProofLines(this.visual, this.lines, result, font, 26)
    const resolved = result.embeds.find((embed) => embed.id === 'premise-form')
    if (resolved) placeProofObject(this.orb, resolved.rect, this.visual.offsetLeft, this.visual.offsetTop)
    this.frame.dataset.lineCount = String(result.lines.length)
  }

  onFrame(time) {
    this.frameId = null
    if (!this.active || reducedMotionQuery.matches) return
    if (time - this.lastPaint >= 90) {
      this.lastPaint = time
      this.render(time)
    }
    this.frameId = requestAnimationFrame(this.onFrame)
  }

  setActive(active) {
    this.active = active
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
    this.render(performance.now())
    if (active && !reducedMotionQuery.matches) this.frameId = requestAnimationFrame(this.onFrame)
  }

  destroy() {
    this.setActive(false)
    this.resizeObserver.disconnect()
  }
}

const CANONICAL_DEMO_STYLESHEET = new URL('./demos/demo-site.css', import.meta.url).href

const CANONICAL_PROOF_STYLES = `
  :host {
    display: block;
    width: 100%;
    min-width: 0;
    --background: #f5f2ec;
    --surface: #edeae3;
    --surface-raised: #e7e4dc;
    --text-primary: #1c1814;
    --text-secondary: #5a5449;
    --text-muted: #9a9188;
    --accent: #b84c2a;
    --border: rgba(28, 24, 20, 0.12);
    --font-display: "Cormorant Garamond", Georgia, serif;
    --font-body: "Inter", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", monospace;
  }

  .canonical-proof-root {
    min-width: 0;
  }

  :host([data-proof-size="mini"]) .hero-stage canvas {
    height: clamp(21rem, 48vh, 31rem);
  }

  :host([data-proof-size="mini"]) .motion-demo {
    min-height: clamp(21rem, 48vh, 31rem);
  }

  :host([data-proof-size="mini"]) .themes-panel {
    min-height: clamp(20rem, 44vh, 28rem);
  }

  :host([data-proof-size="mini"]) .themes-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  :host([data-proof-size="welcome"]) .hero-stage canvas {
    height: clamp(18rem, 48vh, 30rem);
  }

  :host([data-proof-size="welcome"]) .motion-demo {
    min-height: clamp(18rem, 44vh, 27rem);
  }

  :host([data-proof-size="welcome"]) .themes-panel {
    min-height: clamp(18rem, 44vh, 27rem);
  }

  :host([data-proof-size="welcome"]) .panel-controls {
    padding-block: 10px;
  }
`

function createCanonicalRangeControl(labelText, min, max, value) {
  const label = document.createElement('label')
  label.className = 'range-control'
  const text = document.createElement('span')
  text.textContent = labelText
  const input = document.createElement('input')
  input.className = 'range-input'
  input.type = 'range'
  input.min = String(min)
  input.max = String(max)
  input.value = String(value)
  const output = document.createElement('output')
  output.className = 'range-output'
  label.append(text, input, output)
  return { label, input, output }
}

function createCanonicalArtemisControls() {
  const controls = document.createElement('div')
  controls.className = 'panel-controls'
  const pauseButton = document.createElement('button')
  pauseButton.className = 'button'
  pauseButton.type = 'button'
  pauseButton.textContent = 'Pause'
  const tempo = createCanonicalRangeControl('Tempo', 20, 100, 52)
  const sweep = createCanonicalRangeControl('Arc', 20, 100, 20)
  controls.append(pauseButton, tempo.label, sweep.label)
  return {
    controls,
    pauseButton,
    speedInput: tempo.input,
    speedOutput: tempo.output,
    sweepInput: sweep.input,
    sweepOutput: sweep.output,
  }
}

class CanonicalProofController {
  constructor(host) {
    this.host = host
    this.kind = host.dataset.proofKind
    this.active = false
    this.shadow = host.attachShadow({ mode: 'open' })

    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = CANONICAL_DEMO_STYLESHEET
    stylesheet.addEventListener('load', () => this.refresh())

    const adapterStyles = document.createElement('style')
    adapterStyles.textContent = CANONICAL_PROOF_STYLES
    this.shadow.append(stylesheet, adapterStyles)

    if (this.kind === 'flow-hero') {
      const frame = document.createElement('div')
      frame.className = 'canonical-proof-root hero-stage'
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-label', 'Animated waterfall visual')
      frame.appendChild(canvas)
      this.shadow.appendChild(frame)
      this.controller = mountFlowHero(canvas, { autoActivity: false })
      return
    }

    if (this.kind === 'elements') {
      const frame = document.createElement('div')
      frame.className = 'canonical-proof-root themes-demo'
      this.shadow.appendChild(frame)
      this.controller = mountElementsDemo(frame, { autoActivity: false })
      return
    }

    const frame = document.createElement('div')
    frame.className = 'canonical-proof-root motion-demo motion-demo-layout'
    this.shadow.appendChild(frame)
    const controls = host.dataset.proofSize === 'mini'
      ? {}
      : createCanonicalArtemisControls()
    if (controls.controls) this.shadow.appendChild(controls.controls)
    this.controller = mountArtemisDemo({
      root: frame,
      activeRoot: host,
      pauseButton: controls.pauseButton,
      speedInput: controls.speedInput,
      speedOutput: controls.speedOutput,
      sweepInput: controls.sweepInput,
      sweepOutput: controls.sweepOutput,
      autoActivity: false,
    })
  }

  refresh() {
    if (this.kind === 'flow-hero') this.controller.resize()
    else this.controller.handleResize(true)
  }

  setActive(active) {
    this.active = Boolean(active)
    this.controller.setActive(this.active)
    this.refresh()
  }

  destroy() {
    this.controller.destroy()
  }
}

class MiniReadingProof {
  constructor(host) {
    this.host = host
    this.active = false
    this.intervalId = null
    this.currentLine = 0
    this.lastStep = performance.now()
    this.lines = []
    this.frame = document.createElement('div')
    this.frame.className = 'proof-frame reading-surface'
    this.visual = document.createElement('div')
    this.visual.className = 'reading-lines'
    this.visual.setAttribute('aria-hidden', 'true')
    this.marker = document.createElement('div')
    this.marker.className = 'reading-marker'
    this.marker.setAttribute('aria-hidden', 'true')
    this.time = document.createElement('strong')
    this.time.textContent = '4s'
    this.state = document.createElement('span')
    this.state.textContent = 'next step'
    this.line = document.createElement('em')
    this.line.textContent = 'line 1'
    this.marker.append(this.time, this.state, this.line)
    this.frame.append(this.visual, this.marker)
    this.text = `${READING_TEXT.split('\n')[0]}\n${READING_TEXT.split('\n')[2]}`
    this.host.replaceChildren(this.frame, createSemanticArticle(this.text, 'Reading pace preview'))
    this.resizeObserver = new ResizeObserver(() => this.render())
    this.resizeObserver.observe(this.visual)
  }

  render() {
    const width = Math.floor(this.visual.getBoundingClientRect().width)
    if (width < 120) return
    const font = `13.5px ${FONT_FAMILIES.sans}`
    const baseline = flowLayout({ text: this.text, font, width, lineHeight: 26, paragraphGap: 16, embeds: [] })
    const total = Math.max(1, baseline.lines.length)
    this.currentLine = clamp(this.currentLine, 0, total - 1)
    const markerSize = { width: Math.min(110, width * 0.42), height: 56 }
    const markerY = baseline.lines[this.currentLine]?.y ?? 0
    const result = flowLayout({
      text: this.text,
      font,
      width,
      lineHeight: 26,
      paragraphGap: 16,
      embeds: [{ id: 'reading-marker', shape: { type: 'rect', ...markerSize }, margin: 10, position: { type: 'absolute', x: width - markerSize.width, y: markerY } }],
    })
    syncProofLines(this.visual, this.lines, result, font, 26)
    const marker = result.embeds.find((embed) => embed.id === 'reading-marker')
    if (marker) placeProofObject(this.marker, marker.rect, this.visual.offsetLeft, this.visual.offsetTop)
    this.line.textContent = `line ${this.currentLine + 1}`
    this.frame.dataset.textLineCount = String(total)
  }

  tick() {
    if (!this.active || reducedMotionQuery.matches) return
    const elapsed = performance.now() - this.lastStep
    if (elapsed >= 4000) {
      this.lastStep += 4000
      const total = Number(this.frame.dataset.textLineCount || 1)
      this.currentLine = this.currentLine >= total - 1 ? 0 : this.currentLine + 1
      this.render()
    }
    this.time.textContent = `${Math.max(1, Math.ceil((4000 - (performance.now() - this.lastStep)) / 1000))}s`
  }

  setActive(active) {
    this.active = active
    if (this.intervalId !== null) clearInterval(this.intervalId)
    this.intervalId = null
    this.lastStep = performance.now()
    this.render()
    if (active && !reducedMotionQuery.matches) this.intervalId = setInterval(() => this.tick(), 200)
  }

  destroy() {
    this.setActive(false)
    this.resizeObserver.disconnect()
  }
}

class ReadingController {
  constructor() {
    this.active = false
    this.paused = reducedMotionQuery.matches
    this.currentLine = 0
    this.seconds = Number(readingSeconds.value)
    this.advance = Number(readingAdvance.value)
    this.remainingMs = this.seconds * 1000
    this.lastTick = performance.now()
    this.intervalId = null
    this.lines = []
    this.text = READING_TEXT
    this.resizeObserver = new ResizeObserver(() => this.render())
    this.resizeObserver.observe(readingLines)
    this.bindControls()
    this.setPassage(READING_TEXT)
  }

  bindControls() {
    readingToggle.addEventListener('click', () => this.setPaused(!this.paused))
    readingStep.addEventListener('click', () => this.stepOnce())
    readingSeconds.addEventListener('input', () => {
      this.seconds = Number(readingSeconds.value)
      this.remainingMs = this.seconds * 1000
      this.lastTick = performance.now()
      this.syncControls()
    })
    readingAdvance.addEventListener('input', () => {
      this.advance = Number(readingAdvance.value)
      this.syncControls()
    })
    readingEditToggle.addEventListener('click', () => {
      readingText.value = this.text
      readingEditor.hidden = false
      readingEditToggle.setAttribute('aria-expanded', 'true')
      readingText.focus({ preventScroll: true })
    })
    readingEditDone.addEventListener('click', () => {
      this.setPassage(readingText.value.trim() || READING_TEXT)
      readingEditor.hidden = true
      readingEditToggle.setAttribute('aria-expanded', 'false')
      readingEditToggle.focus({ preventScroll: true })
    })
  }

  setPassage(text) {
    this.text = text
    this.currentLine = 0
    this.remainingMs = this.seconds * 1000
    this.lastTick = performance.now()
    readingText.value = text
    readingSource.replaceChildren(...text.split('\n').map((paragraphText) => {
      const paragraph = document.createElement('p')
      paragraph.textContent = paragraphText || ' '
      return paragraph
    }))
    this.render()
  }

  render() {
    const width = Math.floor(readingLines.getBoundingClientRect().width)
    if (width < 120) return
    const compact = width < 460
    const fontSizeValue = compact ? 16 : 18
    const lineHeightValue = compact ? 28 : 32
    const paragraphGapValue = compact ? 18 : 24
    const font = `${fontSizeValue}px ${FONT_FAMILIES.humanist}`
    const baseline = flowLayout({
      text: this.text,
      font,
      width,
      lineHeight: lineHeightValue,
      paragraphGap: paragraphGapValue,
      embeds: [],
    })
    const total = Math.max(1, baseline.lines.length)
    this.currentLine = clamp(this.currentLine, 0, total - 1)
    const markerSize = {
      width: Math.min(compact ? 112 : 138, width * 0.44),
      height: compact ? 62 : 68,
    }
    const markerY = baseline.lines[this.currentLine]?.y ?? 0
    const result = flowLayout({
      text: this.text,
      font,
      width,
      lineHeight: lineHeightValue,
      paragraphGap: paragraphGapValue,
      embeds: [{
        id: 'reading-marker',
        shape: { type: 'rect', ...markerSize },
        margin: compact ? 8 : 12,
        position: {
          type: 'absolute',
          x: Math.max(0, width - markerSize.width),
          y: markerY,
        },
      }],
    })
    syncProofLines(readingLines, this.lines, result, font, lineHeightValue)
    const marker = result.embeds.find((embed) => embed.id === 'reading-marker')
    if (marker) {
      placeProofObject(readingMarker, marker.rect, readingLines.offsetLeft, readingLines.offsetTop)
    }
    readingSurface.dataset.textLineCount = String(total)
    readingSurface.dataset.flowLineCount = String(result.lines.length)
    readingCurrentLine.textContent = String(this.currentLine + 1)
    readingTotalLines.textContent = String(total)
    readingMarkerLine.textContent = `line ${this.currentLine + 1}`
    this.syncControls()
  }

  syncControls() {
    readingSecondsOutput.value = `${this.seconds} sec`
    readingAdvanceOutput.value = `${this.advance} ${this.advance === 1 ? 'line' : 'lines'}`
    readingToggle.textContent = this.paused
      ? reducedMotionQuery.matches ? 'Preview motion' : 'Resume'
      : 'Pause'
    readingToggle.setAttribute('aria-pressed', String(!this.paused))
    readingMarkerState.textContent = this.paused ? 'paused' : 'next step'
    readingMarkerTime.textContent = `${Math.max(1, Math.ceil(this.remainingMs / 1000))}s`
    readingSurface.dataset.paused = String(this.paused)
  }

  stepOnce() {
    const total = Number(readingSurface.dataset.textLineCount || 1)
    this.currentLine = this.currentLine >= total - 1
      ? 0
      : Math.min(total - 1, this.currentLine + this.advance)
    this.remainingMs = this.seconds * 1000
    this.lastTick = performance.now()
    this.render()
  }

  tick() {
    if (!this.active || this.paused) return
    const now = performance.now()
    const delta = Math.min(500, now - this.lastTick)
    this.lastTick = now
    this.remainingMs -= delta
    if (this.remainingMs <= 0) this.stepOnce()
    else this.syncControls()
  }

  syncTimer() {
    if (this.intervalId !== null) clearInterval(this.intervalId)
    this.intervalId = null
    if (this.active && !this.paused) {
      this.lastTick = performance.now()
      this.intervalId = setInterval(() => this.tick(), 100)
    }
  }

  setPaused(paused) {
    this.paused = paused
    this.lastTick = performance.now()
    this.syncTimer()
    this.syncControls()
  }

  setActive(active) {
    this.active = active
    this.render()
    this.syncTimer()
  }

  handleReducedMotion() {
    if (reducedMotionQuery.matches) this.paused = true
    this.syncTimer()
    this.render()
  }

  destroy() {
    this.setActive(false)
    this.resizeObserver.disconnect()
  }
}

function createProofController(host) {
  switch (host.dataset.proofKind) {
    case 'premise': return new PremiseProof(host)
    case 'flow-hero':
    case 'elements':
    case 'artemis-ii': return new CanonicalProofController(host)
    case 'reading-mini': return new MiniReadingProof(host)
    default: throw new Error(`Unknown proof kind: ${host.dataset.proofKind}`)
  }
}

function flowBounds(width, size) {
  const visibleHeight = Math.max(lastResult?.height ?? state.lineHeight, size.height + state.lineHeight)
  return {
    maxX: Math.max(0, width - size.width),
    maxY: Math.max(0, visibleHeight - size.height),
  }
}

function clampRequestedPosition() {
  const size = shapeSize(currentShape())
  state.position.x = clamp(state.position.x, 0, Math.max(0, state.columnWidth - size.width))
  state.position.y = clamp(state.position.y, 0, SCENE_LIMITS.position[1])
}

function positionForRender(width, size) {
  const ratio = width < state.columnWidth ? width / state.columnWidth : 1
  return {
    x: clamp(state.position.x * ratio, 0, Math.max(0, width - size.width)),
    y: Math.max(0, state.position.y),
  }
}

function setRequestedPositionFromLive(x, y) {
  const size = shapeSize(currentShape())
  const ratio = actualWidth < state.columnWidth ? state.columnWidth / actualWidth : 1
  state.position.x = clamp(x * ratio, 0, Math.max(0, state.columnWidth - size.width))
  state.position.y = clamp(y, 0, SCENE_LIMITS.position[1])
}

function serializeLayoutScene(shape = shapeForWidth(currentShape(), actualWidth)) {
  const editorial = portableEditorialContext()
  const embed = {
    id: 'studio-embed',
    shape: copyShape(shape),
    margin: state.margin,
    position: {
      type: 'absolute',
      x: livePosition.x,
      y: livePosition.y,
    },
  }

  if (state.embedSource === 'image') {
    embed.asset = {
      type: 'image',
      requirement: 'author-owned',
      alphaThreshold: state.image.threshold,
      description: state.image.decorative ? '' : state.image.description,
      decorative: state.image.decorative,
    }
  }

  return {
    schema: 'pretext-studio.scene',
    version: editorial ? 3 : 2,
    kind: 'layout',
    composition: state.preset,
    article: {
      text: state.text,
    },
    layout: {
      width: actualWidth,
      font: currentFont(),
      lineHeight: state.lineHeight,
      paragraphGap: state.paragraphGap,
    },
    embed,
    ...(editorial ? { editorial } : {}),
  }
}

function serializeTextBehaviorScene() {
  const editorial = portableEditorialContext()
  const definition = BEHAVIOR_DEFS[state.behavior.id]
  const currentValues = state.behavior.valuesById[state.behavior.id]
  const values = Object.fromEntries(
    Object.keys(definition.values).map((key) => [key, currentValues[key]]),
  )
  return {
    schema: 'pretext-studio.scene',
    version: editorial ? 3 : 2,
    kind: 'textBehavior',
    article: { text: state.text },
    layout: {
      width: state.columnWidth,
      font: currentFont(),
      lineHeight: state.lineHeight,
      paragraphGap: state.paragraphGap,
    },
    behavior: {
      id: state.behavior.id,
      mode: definition.mode,
      values,
    },
    ...(editorial ? { editorial } : {}),
  }
}

function serializeScene() {
  return state.kind === 'textBehavior'
    ? serializeTextBehaviorScene()
    : serializeLayoutScene()
}

function layoutInputFromScene(scene) {
  return {
    text: scene.article.text,
    font: scene.layout.font,
    width: scene.layout.width,
    lineHeight: scene.layout.lineHeight,
    paragraphGap: scene.layout.paragraphGap,
    embeds: [{
      id: scene.embed.id,
      shape: copyShape(scene.embed.shape),
      margin: scene.embed.margin,
      position: { ...scene.embed.position },
    }],
  }
}

function generatedSemanticSourceSetup(visualTarget = '') {
  const visualSetup = visualTarget
    ? `
const visualEditorial = buildEditorialHeader(scene)
if (visualEditorial) {
  visualEditorial.setAttribute('aria-hidden', 'true')
  Object.assign(visualEditorial.style, {
    margin: '0 0 1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid currentColor',
  })
  ${visualTarget}.before(visualEditorial)
}`
    : ''

  return `function buildEditorialHeader(scene) {
  if (!scene.editorial) return null
  const header = document.createElement('header')
  ;[
    ['kicker', 'p'],
    ['headline', 'h1'],
    ['deck', 'p'],
  ].forEach(([key, tagName]) => {
    if (!scene.editorial[key]?.trim()) return
    const element = document.createElement(tagName)
    element.textContent = scene.editorial[key]
    header.appendChild(element)
  })
  return header.childElementCount ? header : null
}

function buildSemanticArticle(scene) {
  const nodes = []
  const header = buildEditorialHeader(scene)
  if (header) nodes.push(header)
  scene.article.text.split('\\n').forEach((text) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = text || ' '
    nodes.push(paragraph)
  })
  return nodes
}

source.replaceChildren(...buildSemanticArticle(scene))${visualSetup}`
}

function generateLayoutCanvasExample(scene) {
  const sceneJson = JSON.stringify(scene, null, 2)
  const imageSetup = scene.embed.asset
    ? `// Supply a path served by your own site. Studio never exports the local file.
const imageUrl = null
const authorImage = imageUrl ? await loadAuthorImage(imageUrl) : null`
    : 'const authorImage = null'

  return `// Install: npm install pretext-flow @chenglou/pretext
// HTML: <canvas id="scene-canvas" aria-hidden="true"></canvas>
//       <article id="scene-source" aria-label="Linear article text"></article>
//       <p id="scene-image-description"></p>
import { flowLayout } from 'pretext-flow'

const scene = ${sceneJson}
const canvas = document.querySelector('#scene-canvas')
const source = document.querySelector('#scene-source')
const imageDescription = document.querySelector('#scene-image-description')

if (!(canvas instanceof HTMLCanvasElement) || !(source instanceof HTMLElement)) {
  throw new Error('Add #scene-canvas and #scene-source to the page.')
}

${generatedSemanticSourceSetup()}

if (scene.embed.asset && !scene.embed.asset.decorative) {
  if (!(imageDescription instanceof HTMLElement)) {
    throw new Error('Add #scene-image-description beside the canvas.')
  }
  imageDescription.textContent = scene.embed.asset.description
  imageDescription.setAttribute('role', 'img')
  imageDescription.setAttribute('aria-label', scene.embed.asset.description)
} else if (imageDescription instanceof HTMLElement) {
  imageDescription.textContent = ''
  imageDescription.setAttribute('aria-hidden', 'true')
}

const result = flowLayout({
  text: scene.article.text,
  font: scene.layout.font,
  width: scene.layout.width,
  lineHeight: scene.layout.lineHeight,
  paragraphGap: scene.layout.paragraphGap,
  embeds: [scene.embed],
})

const resolvedEmbed = result.embeds.find((embed) => embed.id === scene.embed.id)
const logicalHeight = Math.max(
  result.height,
  resolvedEmbed ? resolvedEmbed.rect.y + resolvedEmbed.rect.height + scene.layout.lineHeight : 0,
)
const dpr = window.devicePixelRatio || 1
canvas.width = Math.ceil(scene.layout.width * dpr)
canvas.height = Math.ceil(logicalHeight * dpr)
canvas.style.width = \`\${scene.layout.width}px\`
canvas.style.height = \`\${logicalHeight}px\`

const context = canvas.getContext('2d')
if (!context) throw new Error('Canvas 2D context is unavailable.')

${imageSetup}

context.setTransform(dpr, 0, 0, dpr, 0, 0)
context.fillStyle = '#17120f'
context.font = scene.layout.font
context.textBaseline = 'top'

for (const line of result.lines) {
  context.fillText(line.text, line.x, line.y)
}

if (resolvedEmbed) drawEmbed(context, resolvedEmbed, authorImage)

function drawEmbed(ctx, resolved, image) {
  const { rect } = resolved
  ctx.save()
  traceShape(ctx, resolved.embed.shape, rect)

  if (resolved.embed.shape.type === 'polygon' && image) {
    ctx.clip()
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
  } else {
    ctx.fillStyle = resolved.embed.shape.type === 'polygon' ? '#e9e2d7' : '#5a1f18'
    ctx.fill()
  }

  if (resolved.embed.shape.type === 'polygon' && image) {
    ctx.restore()
    ctx.save()
    traceShape(ctx, resolved.embed.shape, rect)
  }
  ctx.strokeStyle = '#c8391a'
  ctx.lineWidth = 1
  ctx.stroke()

  if (resolved.embed.shape.type === 'polygon' && !image) {
    ctx.fillStyle = '#5a1f18'
    ctx.font = '700 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ATTACH AUTHOR IMAGE', rect.x + rect.width / 2, rect.y + rect.height / 2)
  }
  ctx.restore()
}

function traceShape(ctx, shape, rect) {
  ctx.beginPath()
  if (shape.type === 'circle') {
    ctx.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, 0, Math.PI * 2)
  } else if (shape.type === 'ellipse') {
    ctx.ellipse(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2, 0, 0, Math.PI * 2)
  } else if (shape.type === 'polygon') {
    shape.points.forEach((point, index) => {
      const x = rect.x + point.x * rect.width
      const y = rect.y + point.y * rect.height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
  } else {
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
  }
}

function loadAuthorImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', () => reject(new Error('The author image could not be loaded.')), { once: true })
    image.src = url
  })
}`
}

function generateLayoutDomExample(scene) {
  const sceneJson = JSON.stringify(scene, null, 2)
  const imageMount = scene.embed.asset
    ? `// Supply a path served by your own site. Studio never exports the local file.
const imageUrl = null`
    : 'const imageUrl = null'

  return `// Install: npm install pretext-flow @chenglou/pretext
// HTML: <section id="scene-shell">
//         <div id="scene-stage"></div>
//         <article id="scene-source" aria-label="Linear article text"></article>
//       </section>
import { flowLayout } from 'pretext-flow'

const scene = ${sceneJson}
${imageMount}
const stage = document.querySelector('#scene-stage')
const source = document.querySelector('#scene-source')

if (!(stage instanceof HTMLElement) || !(source instanceof HTMLElement)) {
  throw new Error('Add #scene-stage and #scene-source to the page.')
}

const result = flowLayout({
  text: scene.article.text,
  font: scene.layout.font,
  width: scene.layout.width,
  lineHeight: scene.layout.lineHeight,
  paragraphGap: scene.layout.paragraphGap,
  embeds: [scene.embed],
})

const resolvedEmbed = result.embeds.find((embed) => embed.id === scene.embed.id)
const stageHeight = Math.max(
  result.height,
  resolvedEmbed ? resolvedEmbed.rect.y + resolvedEmbed.rect.height + scene.layout.lineHeight : 0,
)

Object.assign(stage.style, {
  position: 'relative',
  boxSizing: 'border-box',
  width: \`\${scene.layout.width}px\`,
  maxWidth: '100%',
  height: \`\${stageHeight}px\`,
  overflow: 'hidden',
})

const lines = document.createElement('div')
lines.setAttribute('aria-hidden', 'true')
Object.assign(lines.style, {
  position: 'absolute',
  inset: '0',
  userSelect: 'text',
})
lines.replaceChildren(
  ...result.lines.map((line) => {
    const element = document.createElement('span')
    element.textContent = line.text
    Object.assign(element.style, {
      position: 'absolute',
      left: \`\${line.x}px\`,
      top: \`\${line.y}px\`,
      display: 'block',
      color: '#17120f',
      font: scene.layout.font,
      lineHeight: \`\${scene.layout.lineHeight}px\`,
      whiteSpace: 'pre',
      userSelect: 'text',
    })
    return element
  }),
)

const children = [lines]
if (resolvedEmbed) {
  const embed = document.createElement('div')
  const { rect } = resolvedEmbed
  Object.assign(embed.style, {
    position: 'absolute',
    left: \`\${rect.x}px\`,
    top: \`\${rect.y}px\`,
    width: \`\${rect.width}px\`,
    height: \`\${rect.height}px\`,
    background: resolvedEmbed.embed.shape.type === 'polygon' ? '#e9e2d7' : '#5a1f18',
    border: '1px solid #c8391a',
    borderRadius: primitiveBorderRadius(resolvedEmbed.embed.shape),
    overflow: 'hidden',
    pointerEvents: 'none',
  })

  if (scene.embed.asset) {
    const polygon = scene.embed.shape.points
      .map((point) => \`\${point.x * 100}% \${point.y * 100}%\`)
      .join(', ')
    embed.style.clipPath = \`polygon(\${polygon})\`

    if (scene.embed.asset.decorative) {
      embed.setAttribute('aria-hidden', 'true')
    } else {
      embed.setAttribute('role', 'img')
      embed.setAttribute('aria-label', scene.embed.asset.description)
    }

    if (imageUrl) {
      const image = document.createElement('img')
      image.alt = ''
      image.setAttribute('aria-hidden', 'true')
      Object.assign(image.style, { width: '100%', height: '100%', objectFit: 'contain' })
      image.src = imageUrl
      embed.replaceChildren(image)
    } else {
      const placeholder = document.createElement('span')
      placeholder.textContent = 'Attach author image'
      Object.assign(placeholder.style, {
        position: 'absolute',
        inset: '0',
        display: 'grid',
        placeItems: 'center',
        color: '#5a1f18',
        font: '700 10px sans-serif',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      })
      embed.replaceChildren(placeholder)
    }
  } else {
    embed.setAttribute('aria-hidden', 'true')
  }
  children.push(embed)
}
stage.replaceChildren(...children)

${generatedSemanticSourceSetup('stage')}

Object.assign(source.style, {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
})

function primitiveBorderRadius(shape) {
  if (shape.type === 'circle') return '50%'
  if (shape.type === 'ellipse') return '50%'
  if (shape.type === 'rect' || shape.type === 'polygon') return '0'
  throw new Error('Unsupported primitive shape.')
}`
}

function behaviorPointerHandlers(targetName) {
  return `
${targetName}.addEventListener('pointermove', (event) => {
  const rect = ${targetName}.getBoundingClientRect()
  cursor = {
    x: (event.clientX - rect.left) * scene.layout.width / rect.width,
    y: (event.clientY - rect.top) * logicalHeight / rect.height,
  }
  if (!paused && !guarded && (!reducedQuery.matches || reducedOverride)) {
    draw()
    startLoop()
  }
  updateControls()
})

const clearPointer = () => {
  cursor = null
  if (!paused && !guarded && (!reducedQuery.matches || reducedOverride)) draw()
  stopLoop()
  updateControls()
}
${targetName}.addEventListener('pointerleave', clearPointer)
${targetName}.addEventListener('pointercancel', clearPointer)`
}

function generateBehaviorCanvasExample(scene) {
  const sceneJson = JSON.stringify(scene, null, 2)
  const effectName = scene.behavior.id
  const pointerHandlers = scene.behavior.mode === 'pointer' ? behaviorPointerHandlers('canvas') : ''

  return `// Install: npm install pretext-flow @chenglou/pretext
// HTML: <canvas id="scene-canvas" aria-hidden="true"></canvas>
//       <article id="scene-source" aria-label="Linear article text"></article>
//       <button id="motion-toggle" type="button"></button>
//       <button id="motion-replay" type="button">Replay</button>
//       <p id="motion-status" role="status"></p>
import { flowLayout, applyEffects, ${effectName} } from 'pretext-flow'

const scene = ${sceneJson}
const TEXT_LIMIT = 1500
const canvas = document.querySelector('#scene-canvas')
const source = document.querySelector('#scene-source')
const motionToggle = document.querySelector('#motion-toggle')
const motionReplay = document.querySelector('#motion-replay')
const motionStatus = document.querySelector('#motion-status')

if (
  !(canvas instanceof HTMLCanvasElement)
    || !(source instanceof HTMLElement)
    || !(motionToggle instanceof HTMLButtonElement)
    || !(motionReplay instanceof HTMLButtonElement)
    || !(motionStatus instanceof HTMLElement)
) {
  throw new Error('Add the canvas, semantic source, motion controls, and status to the page.')
}

${generatedSemanticSourceSetup()}

const result = flowLayout({
  text: scene.article.text,
  font: scene.layout.font,
  width: scene.layout.width,
  lineHeight: scene.layout.lineHeight,
  paragraphGap: scene.layout.paragraphGap,
  embeds: [],
  characterPositions: true,
})
const effect = ${effectName}(scene.behavior.values)
const logicalHeight = Math.max(result.height, scene.layout.lineHeight)
const dpr = window.devicePixelRatio || 1
canvas.width = Math.ceil(scene.layout.width * dpr)
canvas.height = Math.ceil(logicalHeight * dpr)
canvas.style.width = scene.layout.width + 'px'
canvas.style.maxWidth = '100%'
canvas.style.height = logicalHeight + 'px'

const context = canvas.getContext('2d')
if (!context) throw new Error('Canvas 2D context is unavailable.')
context.setTransform(dpr, 0, 0, dpr, 0, 0)
context.fillStyle = '#17120f'
context.font = scene.layout.font
context.textBaseline = 'top'

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const guarded = [...scene.article.text].length > TEXT_LIMIT
let frame = null
let elapsed = 0
let lastTimestamp = null
let cursor = null
let paused = false
let reducedOverride = false

function shouldRun() {
  if (guarded || paused || (reducedQuery.matches && !reducedOverride)) return false
  return scene.behavior.mode === 'continuous' || cursor !== null
}

function draw() {
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, scene.layout.width, logicalHeight)
  context.fillStyle = '#17120f'
  context.font = scene.layout.font
  context.textBaseline = 'top'

  if (guarded) {
    for (const line of result.lines) context.fillText(line.text, line.x, line.y)
    return
  }

  const transforms = applyEffects(result, [effect], {
    time: elapsed,
    cursor,
    height: logicalHeight,
    width: scene.layout.width,
  })
  result.lines.forEach((line, lineIndex) => {
    ;(line.characters || []).forEach((character, characterIndex) => {
      const transform = transforms[lineIndex][characterIndex]
      context.save()
      context.globalAlpha = transform.opacity
      context.translate(character.x + transform.dx, line.y + transform.dy)
      context.rotate(transform.rotation)
      context.scale(transform.scale, transform.scale)
      context.fillText(character.char, 0, 0)
      context.restore()
    })
  })
}

function updateControls() {
  motionToggle.disabled = guarded
  motionReplay.disabled = guarded
  if (guarded) {
    motionToggle.textContent = 'Motion unavailable'
    motionStatus.textContent = 'Animation paused: ' + [...scene.article.text].length + ' characters exceed the 1,500-character guard.'
  } else if (reducedQuery.matches && !reducedOverride) {
    motionToggle.textContent = 'Preview motion'
    motionStatus.textContent = 'Reduced motion is active. Motion will not start without a deliberate preview.'
  } else if (paused) {
    motionToggle.textContent = 'Resume motion'
    motionStatus.textContent = 'Motion is paused at the current frame.'
  } else if (scene.behavior.mode === 'pointer' && !cursor) {
    motionToggle.textContent = 'Pause motion'
    motionStatus.textContent = 'Move the pointer inside the reading surface to preview the spatial ripple.'
  } else {
    motionToggle.textContent = 'Pause motion'
    motionStatus.textContent = scene.behavior.mode === 'pointer' ? 'Pointer ripple is responding.' : 'Motion is running.'
  }
}

function stopLoop() {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  lastTimestamp = null
}

function tick(timestamp) {
  frame = null
  if (!shouldRun()) return
  if (lastTimestamp !== null) elapsed += Math.min(100, timestamp - lastTimestamp)
  lastTimestamp = timestamp
  draw()
  frame = requestAnimationFrame(tick)
}

function startLoop() {
  if (!shouldRun() || frame !== null) return
  lastTimestamp = null
  frame = requestAnimationFrame(tick)
}

motionToggle.addEventListener('click', () => {
  if (guarded) return
  if (reducedQuery.matches && !reducedOverride) {
    reducedOverride = true
    paused = false
    draw()
    startLoop()
  } else if (paused) {
    paused = false
    draw()
    startLoop()
  } else {
    paused = true
    stopLoop()
  }
  updateControls()
})

motionReplay.addEventListener('click', () => {
  if (guarded) return
  elapsed = 0
  paused = false
  if (reducedQuery.matches) reducedOverride = true
  draw()
  startLoop()
  updateControls()
})

reducedQuery.addEventListener('change', () => {
  reducedOverride = false
  stopLoop()
  draw()
  updateControls()
  startLoop()
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop()
  else startLoop()
})
${pointerHandlers}

draw()
updateControls()
startLoop()`
}

function generateBehaviorDomExample(scene) {
  const sceneJson = JSON.stringify(scene, null, 2)
  const effectName = scene.behavior.id
  const pointerHandlers = scene.behavior.mode === 'pointer' ? behaviorPointerHandlers('stage') : ''

  return `// Install: npm install pretext-flow @chenglou/pretext
// HTML: <div id="scene-stage" aria-hidden="true"></div>
//       <article id="scene-source" aria-label="Linear article text"></article>
//       <button id="motion-toggle" type="button"></button>
//       <button id="motion-replay" type="button">Replay</button>
//       <p id="motion-status" role="status"></p>
import { flowLayout, applyEffects, ${effectName} } from 'pretext-flow'

const scene = ${sceneJson}
const TEXT_LIMIT = 1500
const stage = document.querySelector('#scene-stage')
const source = document.querySelector('#scene-source')
const motionToggle = document.querySelector('#motion-toggle')
const motionReplay = document.querySelector('#motion-replay')
const motionStatus = document.querySelector('#motion-status')

if (
  !(stage instanceof HTMLElement)
    || !(source instanceof HTMLElement)
    || !(motionToggle instanceof HTMLButtonElement)
    || !(motionReplay instanceof HTMLButtonElement)
    || !(motionStatus instanceof HTMLElement)
) {
  throw new Error('Add the visual stage, semantic source, motion controls, and status to the page.')
}

${generatedSemanticSourceSetup('stage')}
Object.assign(source.style, {
  position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px',
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0',
})

const result = flowLayout({
  text: scene.article.text,
  font: scene.layout.font,
  width: scene.layout.width,
  lineHeight: scene.layout.lineHeight,
  paragraphGap: scene.layout.paragraphGap,
  embeds: [],
  characterPositions: true,
})
const effect = ${effectName}(scene.behavior.values)
const logicalHeight = Math.max(result.height, scene.layout.lineHeight)
const guarded = [...scene.article.text].length > TEXT_LIMIT
Object.assign(stage.style, {
  position: 'relative', boxSizing: 'border-box', width: scene.layout.width + 'px',
  maxWidth: '100%', height: logicalHeight + 'px', overflow: 'hidden', userSelect: 'text',
})
stage.setAttribute('aria-hidden', 'true')

const characterNodes = []
if (guarded) {
  stage.replaceChildren(...result.lines.map((line) => {
    const element = document.createElement('span')
    element.textContent = line.text
    Object.assign(element.style, {
      position: 'absolute', left: line.x + 'px', top: line.y + 'px', display: 'block',
      color: '#17120f', font: scene.layout.font, lineHeight: scene.layout.lineHeight + 'px',
      whiteSpace: 'pre', userSelect: 'text',
    })
    return element
  }))
} else {
  const nodes = []
  result.lines.forEach((line) => {
    const lineNodes = []
    ;(line.characters || []).forEach((character) => {
      const element = document.createElement('span')
      element.textContent = character.char
      Object.assign(element.style, {
        position: 'absolute', left: character.x + 'px', top: line.y + 'px',
        display: 'block', width: character.width + 'px', color: '#17120f',
        font: scene.layout.font, lineHeight: scene.layout.lineHeight + 'px',
        whiteSpace: 'pre', userSelect: 'text', transformOrigin: '50% 50%',
      })
      lineNodes.push(element)
      nodes.push(element)
    })
    characterNodes.push(lineNodes)
  })
  stage.replaceChildren(...nodes)
}

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let frame = null
let elapsed = 0
let lastTimestamp = null
let cursor = null
let paused = false
let reducedOverride = false

function shouldRun() {
  if (guarded || paused || (reducedQuery.matches && !reducedOverride)) return false
  return scene.behavior.mode === 'continuous' || cursor !== null
}

function draw() {
  if (guarded) return
  const transforms = applyEffects(result, [effect], {
    time: elapsed,
    cursor,
    height: logicalHeight,
    width: scene.layout.width,
  })
  characterNodes.forEach((lineNodes, lineIndex) => {
    lineNodes.forEach((element, characterIndex) => {
      const transform = transforms[lineIndex][characterIndex]
      element.style.opacity = String(transform.opacity)
      element.style.transform = 'translate3d(' + transform.dx + 'px,' + transform.dy + 'px,0) rotate(' + transform.rotation + 'rad) scale(' + transform.scale + ')'
    })
  })
}

function updateControls() {
  motionToggle.disabled = guarded
  motionReplay.disabled = guarded
  if (guarded) {
    motionToggle.textContent = 'Motion unavailable'
    motionStatus.textContent = 'Animation paused: ' + [...scene.article.text].length + ' characters exceed the 1,500-character guard.'
  } else if (reducedQuery.matches && !reducedOverride) {
    motionToggle.textContent = 'Preview motion'
    motionStatus.textContent = 'Reduced motion is active. Motion will not start without a deliberate preview.'
  } else if (paused) {
    motionToggle.textContent = 'Resume motion'
    motionStatus.textContent = 'Motion is paused at the current frame.'
  } else if (scene.behavior.mode === 'pointer' && !cursor) {
    motionToggle.textContent = 'Pause motion'
    motionStatus.textContent = 'Move the pointer inside the reading surface to preview the spatial ripple.'
  } else {
    motionToggle.textContent = 'Pause motion'
    motionStatus.textContent = scene.behavior.mode === 'pointer' ? 'Pointer ripple is responding.' : 'Motion is running.'
  }
}

function stopLoop() {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  lastTimestamp = null
}

function tick(timestamp) {
  frame = null
  if (!shouldRun()) return
  if (lastTimestamp !== null) elapsed += Math.min(100, timestamp - lastTimestamp)
  lastTimestamp = timestamp
  draw()
  frame = requestAnimationFrame(tick)
}

function startLoop() {
  if (!shouldRun() || frame !== null) return
  lastTimestamp = null
  frame = requestAnimationFrame(tick)
}

motionToggle.addEventListener('click', () => {
  if (guarded) return
  if (reducedQuery.matches && !reducedOverride) {
    reducedOverride = true
    paused = false
    draw()
    startLoop()
  } else if (paused) {
    paused = false
    draw()
    startLoop()
  } else {
    paused = true
    stopLoop()
  }
  updateControls()
})

motionReplay.addEventListener('click', () => {
  if (guarded) return
  elapsed = 0
  paused = false
  if (reducedQuery.matches) reducedOverride = true
  draw()
  startLoop()
  updateControls()
})

reducedQuery.addEventListener('change', () => {
  reducedOverride = false
  stopLoop()
  draw()
  updateControls()
  startLoop()
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop()
  else startLoop()
})
${pointerHandlers}

draw()
updateControls()
startLoop()`
}

function generateCanvasExample(scene) {
  return scene.kind === 'textBehavior'
    ? generateBehaviorCanvasExample(scene)
    : generateLayoutCanvasExample(scene)
}

function generateDomExample(scene) {
  return scene.kind === 'textBehavior'
    ? generateBehaviorDomExample(scene)
    : generateLayoutDomExample(scene)
}

function portableBlockReason() {
  if (state.kind === 'textBehavior') return ''
  if (state.embedSource !== 'image') return ''
  if (!state.image.ready) return 'Choose a local image to create portable hull geometry.'
  if (!state.image.decorative && !state.image.description.trim()) {
    return 'Describe the image, or explicitly mark it decorative, before copying output.'
  }
  return ''
}

function syncPortableOutput(scene) {
  const blocked = portableBlockReason()
  if (blocked) {
    sceneJsonOutput.textContent = blocked
    canvasExampleOutput.textContent = blocked
    domExampleOutput.textContent = blocked
    copySceneJsonButton.disabled = true
    copyCanvasExampleButton.disabled = true
    copyDomExampleButton.disabled = true
    downloadSceneButton.disabled = true
    return
  }

  sceneJsonOutput.textContent = JSON.stringify(scene, null, 2)
  canvasExampleOutput.textContent = generateCanvasExample(scene)
  domExampleOutput.textContent = generateDomExample(scene)
  copySceneJsonButton.disabled = false
  copyCanvasExampleButton.disabled = false
  copyDomExampleButton.disabled = false
  downloadSceneButton.disabled = false

  if (!portableOutputReady) {
    portableOutputReady = true
    status.textContent = 'Current scene ready to copy.'
  }
}

class SceneImportError extends Error {}

function failImport(message) {
  throw new SceneImportError(message)
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireObject(value, label) {
  if (!isPlainObject(value)) failImport(`${label} must be a JSON object.`)
}

function requireExactKeys(value, expectedKeys, label) {
  requireObject(value, label)
  const keys = Object.keys(value)
  const missing = expectedKeys.find((key) => !Object.hasOwn(value, key))
  if (missing) failImport(`${label} is missing the required “${missing}” value.`)
  const unknown = keys.find((key) => !expectedKeys.includes(key))
  if (unknown) failImport(`${label} contains the unsupported “${unknown}” value.`)
}

function requireFiniteNumber(value, label, [minimum, maximum]) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    failImport(`${label} must be a finite number.`)
  }
  if (value < minimum || value > maximum) {
    failImport(`${label} must be between ${minimum} and ${maximum}.`)
  }
  return value
}

function fontChoiceFromString(font) {
  if (typeof font !== 'string') return null

  for (const [family, stack] of Object.entries(FONT_FAMILIES)) {
    const suffix = ` ${stack}`
    if (!font.endsWith(suffix)) continue
    const sizeText = font.slice(0, -suffix.length)
    const match = sizeText.match(/^(\d+(?:\.\d+)?)px$/)
    if (!match) continue
    const size = Number(match[1])
    if (Number.isFinite(size) && size >= SCENE_LIMITS.fontSize[0] && size <= SCENE_LIMITS.fontSize[1]) {
      return { family, size }
    }
  }

  return null
}

function requireInteger(value, label, limits) {
  const number = requireFiniteNumber(value, label, limits)
  if (!Number.isInteger(number)) failImport(`${label} must be a whole number.`)
  return number
}

function validatePrimitiveShape(shape, versionLabel = 'layout') {
  requireObject(shape, 'Embed shape')
  if (typeof shape.type !== 'string') failImport('Embed shape needs a type.')

  if (shape.type === 'circle') {
    requireExactKeys(shape, ['type', 'radius'], 'Circle shape')
    return {
      type: 'circle',
      radius: requireFiniteNumber(shape.radius, 'Circle radius', SCENE_LIMITS.radius),
    }
  }

  if (shape.type === 'rect') {
    requireExactKeys(shape, ['type', 'width', 'height'], 'Rectangle shape')
    return {
      type: 'rect',
      width: requireFiniteNumber(shape.width, 'Rectangle width', SCENE_LIMITS.shapeWidth),
      height: requireFiniteNumber(shape.height, 'Rectangle height', SCENE_LIMITS.shapeHeight),
    }
  }

  if (shape.type === 'ellipse') {
    requireExactKeys(shape, ['type', 'radiusX', 'radiusY'], 'Ellipse shape')
    return {
      type: 'ellipse',
      radiusX: requireFiniteNumber(shape.radiusX, 'Ellipse radius X', SCENE_LIMITS.radius),
      radiusY: requireFiniteNumber(shape.radiusY, 'Ellipse radius Y', SCENE_LIMITS.radius),
    }
  }

  failImport(`Studio ${versionLabel} supports circle, rectangle, and ellipse primitive embeds only.`)
}

function validatePolygonShape(shape) {
  requireExactKeys(shape, ['type', 'points', 'width', 'height'], 'Polygon shape')
  if (shape.type !== 'polygon') failImport('An image embed must use a polygon shape.')
  if (!Array.isArray(shape.points)) failImport('Polygon points must be a JSON array.')
  if (shape.points.length < 3 || shape.points.length > 2048) {
    failImport('A polygon must contain between 3 and 2048 normalized points.')
  }

  const points = shape.points.map((point, index) => {
    requireExactKeys(point, ['x', 'y'], `Polygon point ${index + 1}`)
    return {
      x: requireFiniteNumber(point.x, `Polygon point ${index + 1} x`, [0, 1]),
      y: requireFiniteNumber(point.y, `Polygon point ${index + 1} y`, [0, 1]),
    }
  })

  const distinct = new Set(points.map((point) => `${point.x},${point.y}`))
  if (distinct.size !== points.length || distinct.size < 3 || polygonArea(points) <= 0.000001) {
    failImport('The image polygon must have at least three distinct points and a non-zero area.')
  }


  for (let firstIndex = 0; firstIndex < points.length; firstIndex += 1) {
    const firstNext = (firstIndex + 1) % points.length
    for (let secondIndex = firstIndex + 1; secondIndex < points.length; secondIndex += 1) {
      const secondNext = (secondIndex + 1) % points.length
      const adjacent = firstIndex === secondNext || firstNext === secondIndex
      if (adjacent) continue
      if (segmentsIntersect(
        points[firstIndex],
        points[firstNext],
        points[secondIndex],
        points[secondNext],
      )) {
        failImport('The image polygon edges must not cross or overlap.')
      }
    }
  }

  let turnDirection = 0
  for (let index = 0; index < points.length; index += 1) {
    const first = points[index]
    const second = points[(index + 1) % points.length]
    const third = points[(index + 2) % points.length]
    const cross = (second.x - first.x) * (third.y - second.y)
      - (second.y - first.y) * (third.x - second.x)
    if (Math.abs(cross) <= 0.0000001) continue
    const direction = Math.sign(cross)
    if (turnDirection && direction !== turnDirection) {
      failImport('The image polygon must be convex and consistently ordered.')
    }
    turnDirection = direction
  }
  if (!turnDirection) failImport('The image polygon must enclose a usable area.')

  return {
    type: 'polygon',
    points,
    width: requireFiniteNumber(shape.width, 'Polygon display width', SCENE_LIMITS.polygonWidth),
    height: requireFiniteNumber(shape.height, 'Polygon display height', SCENE_LIMITS.polygonHeight),
  }
}

function validateArticleAndLayout(article, layout) {
  requireExactKeys(article, ['text'], 'Article')
  if (typeof article.text !== 'string') failImport('Article text must be an ordinary string.')

  requireExactKeys(layout, ['width', 'font', 'lineHeight', 'paragraphGap'], 'Layout')
  const width = requireFiniteNumber(layout.width, 'Layout width', SCENE_LIMITS.width)
  const fontChoice = fontChoiceFromString(layout.font)
  if (!fontChoice) failImport('That font is not one of the Studio typography choices.')
  const lineHeightValue = requireFiniteNumber(
    layout.lineHeight,
    'Line height',
    SCENE_LIMITS.lineHeight,
  )
  const paragraphGapValue = requireFiniteNumber(
    layout.paragraphGap,
    'Paragraph gap',
    SCENE_LIMITS.paragraphGap,
  )

  return {
    article: { text: article.text },
    layout: {
      width,
      font: layout.font,
      lineHeight: lineHeightValue,
      paragraphGap: paragraphGapValue,
    },
  }
}

function validateEditorialContext(value) {
  requireObject(value, 'Editorial context')
  const allowedKeys = ['kicker', 'headline', 'deck']
  const unsupported = Object.keys(value).find((key) => !allowedKeys.includes(key))
  if (unsupported) failImport(`Editorial context contains unsupported ${unsupported}.`)
  return Object.fromEntries(allowedKeys.flatMap((key) => {
    if (!Object.hasOwn(value, key)) return []
    if (typeof value[key] !== 'string') {
      failImport(`Editorial ${key} must be an ordinary string.`)
    }
    return [[key, value[key]]]
  }))
}

function validateAbsolutePosition(position, width, shape) {
  requireExactKeys(position, ['type', 'x', 'y'], 'Embed position')
  if (position.type !== 'absolute') failImport('Studio loads absolute embed positions only.')
  const x = requireFiniteNumber(position.x, 'Embed x position', SCENE_LIMITS.position)
  const y = requireFiniteNumber(position.y, 'Embed y position', SCENE_LIMITS.position)
  const size = shapeSize(shape)
  if (size.width > width + 0.01) {
    failImport(`Embed width must fit the ${formatNumber(width)} px scene width.`)
  }
  const maximumX = Math.max(0, width - size.width)
  if (x > maximumX + 0.01) {
    failImport(`Embed x position must fit the ${formatNumber(width)} px scene width.`)
  }
  return { type: 'absolute', x, y }
}

function validateSceneV1(value) {
  requireExactKeys(
    value,
    ['schema', 'version', 'composition', 'article', 'layout', 'embed'],
    'Scene',
  )

  if (value.schema !== 'pretext-studio.scene') {
    failImport('This is not a Pretext Studio scene. Check the schema value.')
  }
  if (value.version !== 1) failImport('This is not a version 1 layout scene.')
  if (!Object.hasOwn(PRESETS, value.composition)) {
    failImport('Choose a scene that uses a known Studio composition key.')
  }

  const common = validateArticleAndLayout(value.article, value.layout)

  requireExactKeys(value.embed, ['id', 'shape', 'margin', 'position'], 'Embed')
  if (value.embed.id !== 'studio-embed') failImport('The version 1 embed id must be “studio-embed”.')
  const shape = validatePrimitiveShape(value.embed.shape, 'version 1')
  const marginValue = requireFiniteNumber(value.embed.margin, 'Embed margin', SCENE_LIMITS.margin)
  const position = validateAbsolutePosition(value.embed.position, common.layout.width, shape)

  return {
    schema: 'pretext-studio.scene',
    version: 1,
    composition: value.composition,
    article: common.article,
    layout: common.layout,
    embed: {
      id: 'studio-embed',
      shape,
      margin: marginValue,
      position,
    },
  }
}

function validateSceneV2Layout(value) {
  requireExactKeys(
    value,
    ['schema', 'version', 'kind', 'composition', 'article', 'layout', 'embed'],
    'Scene',
  )
  if (value.schema !== 'pretext-studio.scene') {
    failImport('This is not a Pretext Studio scene. Check the schema value.')
  }
  if (value.version !== 2 || value.kind !== 'layout') {
    failImport('This is not a version 2 layout scene.')
  }
  if (!Object.hasOwn(PRESETS, value.composition)) {
    failImport('Choose a scene that uses a known Studio composition key.')
  }

  const common = validateArticleAndLayout(value.article, value.layout)
  requireObject(value.embed, 'Embed')
  const isImage = Object.hasOwn(value.embed, 'asset')
  requireExactKeys(
    value.embed,
    isImage ? ['id', 'shape', 'margin', 'position', 'asset'] : ['id', 'shape', 'margin', 'position'],
    'Embed',
  )
  if (value.embed.id !== 'studio-embed') failImport('The layout embed id must be “studio-embed”.')

  const shape = isImage
    ? validatePolygonShape(value.embed.shape)
    : validatePrimitiveShape(value.embed.shape, 'version 2 layout')
  const margin = requireFiniteNumber(value.embed.margin, 'Embed margin', SCENE_LIMITS.margin)
  const position = validateAbsolutePosition(value.embed.position, common.layout.width, shape)

  const embed = { id: 'studio-embed', shape, margin, position }
  if (isImage) {
    requireExactKeys(
      value.embed.asset,
      ['type', 'requirement', 'alphaThreshold', 'description', 'decorative'],
      'Image asset',
    )
    if (value.embed.asset.type !== 'image') failImport('Image asset type must be “image”.')
    if (value.embed.asset.requirement !== 'author-owned') {
      failImport('Image assets must use the “author-owned” requirement.')
    }
    const alphaThresholdValue = requireInteger(
      value.embed.asset.alphaThreshold,
      'Image alpha threshold',
      SCENE_LIMITS.imageThreshold,
    )
    if (typeof value.embed.asset.description !== 'string') {
      failImport('Image description must be an ordinary string.')
    }
    if (value.embed.asset.description.length > SCENE_LIMITS.imageDescriptionLength) {
      failImport(`Image description must be ${SCENE_LIMITS.imageDescriptionLength} characters or fewer.`)
    }
    if (typeof value.embed.asset.decorative !== 'boolean') {
      failImport('Image decorative state must be true or false.')
    }
    if (value.embed.asset.decorative && value.embed.asset.description !== '') {
      failImport('A decorative image must have an empty description.')
    }
    if (!value.embed.asset.decorative && !value.embed.asset.description.trim()) {
      failImport('Describe the image, or mark it decorative.')
    }
    embed.asset = {
      type: 'image',
      requirement: 'author-owned',
      alphaThreshold: alphaThresholdValue,
      description: value.embed.asset.description,
      decorative: value.embed.asset.decorative,
    }
  }

  return {
    schema: 'pretext-studio.scene',
    version: 2,
    kind: 'layout',
    composition: value.composition,
    article: common.article,
    layout: common.layout,
    embed,
  }
}

function validateSceneV2TextBehavior(value) {
  requireExactKeys(
    value,
    ['schema', 'version', 'kind', 'article', 'layout', 'behavior'],
    'Scene',
  )
  if (value.schema !== 'pretext-studio.scene') {
    failImport('This is not a Pretext Studio scene. Check the schema value.')
  }
  if (value.version !== 2 || value.kind !== 'textBehavior') {
    failImport('This is not a version 2 text-behavior scene.')
  }
  const common = validateArticleAndLayout(value.article, value.layout)
  requireExactKeys(value.behavior, ['id', 'mode', 'values'], 'Behavior')
  if (typeof value.behavior.id !== 'string' || !Object.hasOwn(BEHAVIOR_DEFS, value.behavior.id)) {
    failImport('Choose one of Studio’s three known text behaviors.')
  }
  const definition = BEHAVIOR_DEFS[value.behavior.id]
  if (value.behavior.mode !== definition.mode) {
    failImport(`${definition.label} must use the “${definition.mode}” behavior mode.`)
  }
  const valueKeys = Object.keys(definition.values)
  requireExactKeys(value.behavior.values, valueKeys, `${definition.label} values`)
  const values = Object.fromEntries(valueKeys.map((key) => {
    const contract = definition.values[key]
    return [
      key,
      requireFiniteNumber(
        value.behavior.values[key],
        `${definition.label} ${contract.label.toLowerCase()}`,
        [contract.min, contract.max],
      ),
    ]
  }))

  return {
    schema: 'pretext-studio.scene',
    version: 2,
    kind: 'textBehavior',
    article: common.article,
    layout: common.layout,
    behavior: {
      id: value.behavior.id,
      mode: definition.mode,
      values,
    },
  }
}

function validateSceneV3Layout(value) {
  requireExactKeys(
    value,
    ['schema', 'version', 'kind', 'composition', 'article', 'layout', 'embed', 'editorial'],
    'Scene',
  )
  if (value.version !== 3 || value.kind !== 'layout') {
    failImport('This is not a version 3 layout scene.')
  }
  const editorial = validateEditorialContext(value.editorial)
  const { editorial: ignoredEditorial, ...baseScene } = value
  const validated = validateSceneV2Layout({ ...baseScene, version: 2 })
  return { ...validated, version: 3, editorial }
}

function validateSceneV3TextBehavior(value) {
  requireExactKeys(
    value,
    ['schema', 'version', 'kind', 'article', 'layout', 'behavior', 'editorial'],
    'Scene',
  )
  if (value.version !== 3 || value.kind !== 'textBehavior') {
    failImport('This is not a version 3 text-behavior scene.')
  }
  const editorial = validateEditorialContext(value.editorial)
  const { editorial: ignoredEditorial, ...baseScene } = value
  const validated = validateSceneV2TextBehavior({ ...baseScene, version: 2 })
  return { ...validated, version: 3, editorial }
}

function validateScene(value) {
  requireObject(value, 'Scene')
  if (value.schema !== 'pretext-studio.scene') {
    failImport('This is not a Pretext Studio scene. Check the schema value.')
  }
  if (value.version === 1) return validateSceneV1(value)
  if (value.version === 2 && value.kind === 'layout') return validateSceneV2Layout(value)
  if (value.version === 2 && value.kind === 'textBehavior') {
    return validateSceneV2TextBehavior(value)
  }
  if (value.version === 3 && value.kind === 'layout') return validateSceneV3Layout(value)
  if (value.version === 3 && value.kind === 'textBehavior') {
    return validateSceneV3TextBehavior(value)
  }
  if (value.version === 2) {
    failImport(`Scene kind ${String(value.kind)} is not supported by this Studio milestone.`)
  }
  failImport(`Scene version ${String(value.version)} is not supported. Studio loads versions 1, 2, and 3.`)
}

function parseSceneJson(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch {
    failImport('That scene is not valid JSON. Check the punctuation and try again.')
  }
  return validateScene(value)
}

function setImportStatus(message, messageState = '', focusStatus = false) {
  sceneImportStatus.textContent = message
  sceneImportStatus.dataset.state = messageState
  if (messageState === 'error') sceneImportJson.setAttribute('aria-invalid', 'true')
  else sceneImportJson.removeAttribute('aria-invalid')
  if (focusStatus) sceneImportStatus.focus({ preventScroll: true })
}

function prepareComposerForImportedScene(kind) {
  guideStepOne.hidden = true
  guideStepTwo.hidden = true
  studioSurface.hidden = false
  showView('composer')
  composerMode = kind
  syncComposerMode()
}

function loadImportedLayoutScene(scene) {
  const fontChoice = fontChoiceFromString(scene.layout.font)
  flowLayout(layoutInputFromScene(scene))
  const importedImage = scene.version >= 2 && Boolean(scene.embed.asset)

  state.kind = 'layout'
  resetMotionRuntime()
  state.preset = scene.composition
  state.text = scene.article.text
  state.fontFamily = fontChoice.family
  state.fontSize = fontChoice.size
  state.lineHeight = scene.layout.lineHeight
  state.paragraphGap = scene.layout.paragraphGap
  state.columnWidth = scene.layout.width
  state.editorial = scene.version === 3
    ? { ...emptyEditorialContext(), ...scene.editorial }
    : emptyEditorialContext()
  if (importedImage) {
    releaseLocalImage()
    state.embedSource = 'image'
    state.image.ready = true
    state.image.shape = copyShape(scene.embed.shape)
    state.image.baseWidth = scene.embed.shape.width
    state.image.baseHeight = scene.embed.shape.height
    state.image.threshold = scene.embed.asset.alphaThreshold
    state.image.scale = 100
    state.image.description = scene.embed.asset.description
    state.image.decorative = scene.embed.asset.decorative
  } else {
    releaseLocalImage()
    state.embedSource = 'primitive'
    state.shape = copyShape(scene.embed.shape)
    Object.assign(state.image, {
      ready: false,
      shape: null,
      baseWidth: 0,
      baseHeight: 0,
      threshold: 32,
      scale: 100,
      description: '',
      decorative: false,
    })
  }
  state.margin = scene.embed.margin
  state.position = {
    x: scene.embed.position.x,
    y: scene.embed.position.y,
  }
  lastResult = null
  prepareComposerForImportedScene('layout')

  syncPresetInterface()
  syncShapeInterface()
  syncEmbedSourceInterface()
  syncSceneKindInterface()
  syncControlsFromState()
  syncEditorialInputs()
  render()

  const conversionNote = scene.version === 1
    ? ' The visible inputs are unchanged; the next copy uses the transparent version 2 layout form.'
    : ''
  const attachmentNote = importedImage
    ? ' The portable hull is active; reattach a local image to restore its visual preview.'
    : ''
  if (actualWidth < state.columnWidth - 0.01) {
    setImportStatus(
      `Scene loaded.${conversionNote}${attachmentNote} This viewport narrows the requested ${formatNumber(state.columnWidth)} px column to ${formatNumber(actualWidth)} px; copied output will use the live width.`,
      'success',
    )
  } else {
    setImportStatus(
      `Scene loaded. Every portable value is now active and editable.${conversionNote}${attachmentNote}`,
      'success',
    )
  }
}

function loadImportedBehaviorScene(scene) {
  const fontChoice = fontChoiceFromString(scene.layout.font)
  flowLayout({
    text: scene.article.text,
    font: scene.layout.font,
    width: scene.layout.width,
    lineHeight: scene.layout.lineHeight,
    paragraphGap: scene.layout.paragraphGap,
    embeds: [],
    characterPositions: true,
  })

  imageDecodeToken += 1
  releaseLocalImage()
  state.kind = 'textBehavior'
  state.text = scene.article.text
  state.fontFamily = fontChoice.family
  state.fontSize = fontChoice.size
  state.lineHeight = scene.layout.lineHeight
  state.paragraphGap = scene.layout.paragraphGap
  state.columnWidth = scene.layout.width
  state.editorial = scene.version === 3
    ? { ...emptyEditorialContext(), ...scene.editorial }
    : emptyEditorialContext()
  state.behavior.id = scene.behavior.id
  state.behavior.valuesById[scene.behavior.id] = { ...scene.behavior.values }
  lastResult = null
  resetMotionRuntime()
  prepareComposerForImportedScene('textBehavior')

  syncSceneKindInterface()
  syncBehaviorInterface()
  syncControlsFromState()
  syncEditorialInputs()
  render()

  if (actualWidth < state.columnWidth - 0.01) {
    setImportStatus(
      `Text-behavior scene loaded. This viewport narrows the requested ${formatNumber(state.columnWidth)} px column to ${formatNumber(actualWidth)} px; portable output retains the requested width.`,
      'success',
    )
  } else {
    setImportStatus('Text-behavior scene loaded. Its article, typography, behavior, and values are active.', 'success')
  }
}

function loadImportedScene(scene) {
  if (scene.kind === 'textBehavior') {
    loadImportedBehaviorScene(scene)
  } else {
    loadImportedLayoutScene(scene)
  }
}

function validatedRuntimeHull(imageData, threshold, width, height) {
  const derived = hullFromImage(imageData, threshold)
  const points = derived.points.map((point) => ({ x: point.x, y: point.y }))
  const distinct = new Set(points.map((point) => `${point.x},${point.y}`))
  const normalized = points.every((point) => (
    Number.isFinite(point.x)
      && Number.isFinite(point.y)
      && point.x >= 0
      && point.x <= 1
      && point.y >= 0
      && point.y <= 1
  ))
  if (!normalized || distinct.size < 3 || polygonArea(points) <= 0.000001) {
    throw new Error('That threshold does not leave a usable non-degenerate image hull.')
  }
  return { type: 'polygon', points, width, height }
}

function imageDisplayDimensions(naturalWidth, naturalHeight) {
  const targetLongEdge = Math.min(280, state.columnWidth * 0.45)
  let ratio = targetLongEdge / Math.max(naturalWidth, naturalHeight)
  const firstWidth = naturalWidth * ratio
  const firstHeight = naturalHeight * ratio
  if (Math.min(firstWidth, firstHeight) < 16) {
    ratio = 16 / Math.min(naturalWidth, naturalHeight)
  }

  const width = Number(formatNumber(naturalWidth * ratio))
  const height = Number(formatNumber(naturalHeight * ratio))
  if (
    width < SCENE_LIMITS.shapeWidth[0]
      || width > state.columnWidth
      || height < SCENE_LIMITS.shapeHeight[0]
      || height > SCENE_LIMITS.shapeHeight[1]
  ) {
    throw new Error('That image aspect ratio cannot fit the current Studio column without distortion.')
  }
  return { width, height }
}

async function decodeLocalImage(file, threshold, token, preservedDimensions = null) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    throw new Error('Choose an image file from your device.')
  }
  if (file.type === 'image/svg+xml') {
    throw new Error('Choose a raster image. SVG can reference resources outside this local preview.')
  }

  const candidateUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = candidateUrl
    await image.decode()
    if (token !== imageDecodeToken) throw new Error('A newer image selection replaced this one.')

    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    if (!naturalWidth || !naturalHeight) throw new Error('The image has no usable pixel dimensions.')

    const sampleRatio = Math.min(
      1,
      IMAGE_SAMPLE_LIMIT.maxEdge / naturalWidth,
      IMAGE_SAMPLE_LIMIT.maxEdge / naturalHeight,
      Math.sqrt(IMAGE_SAMPLE_LIMIT.maxPixels / (naturalWidth * naturalHeight)),
    )
    const sampleWidth = Math.max(1, Math.floor(naturalWidth * sampleRatio))
    const sampleHeight = Math.max(1, Math.floor(naturalHeight * sampleRatio))
    const canvas = document.createElement('canvas')
    canvas.width = sampleWidth
    canvas.height = sampleHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('This browser could not create a safe image sampling canvas.')

    context.drawImage(image, 0, 0, sampleWidth, sampleHeight)
    const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight)
    let hasVisibleAlpha = false
    for (let index = 3; index < imageData.data.length; index += 4) {
      if (imageData.data[index] > 0) {
        hasVisibleAlpha = true
        break
      }
    }
    if (!hasVisibleAlpha) throw new Error('That image is fully transparent and has no flow hull.')

    let dimensions = preservedDimensions
    if (dimensions) {
      const naturalRatio = naturalWidth / naturalHeight
      const preservedRatio = dimensions.width / dimensions.height
      if (Math.abs(naturalRatio - preservedRatio) / preservedRatio > 0.02) {
        throw new Error('That image does not match the portable hull’s display aspect ratio.')
      }
    } else {
      dimensions = imageDisplayDimensions(naturalWidth, naturalHeight)
    }
    const shape = validatedRuntimeHull(imageData, threshold, dimensions.width, dimensions.height)
    return {
      url: candidateUrl,
      sampleImageData: imageData,
      naturalWidth,
      naturalHeight,
      sampleWidth,
      sampleHeight,
      sampled: sampleRatio < 0.999999,
      shape,
    }
  } catch (error) {
    URL.revokeObjectURL(candidateUrl)
    throw error
  }
}

async function handleImageSelection(file) {
  const token = ++imageDecodeToken
  const reattaching = state.embedSource === 'image' && state.image.ready && !localImage.url
  const preservedShape = reattaching ? copyShape(state.image.shape) : null
  setImageStatus('Reading the image locally and deriving its alpha hull…')
  try {
    const candidate = await decodeLocalImage(
      file,
      state.image.threshold,
      token,
      preservedShape ? { width: preservedShape.width, height: preservedShape.height } : null,
    )
    if (reattaching && !polygonShapesMatch(candidate.shape, preservedShape)) {
      URL.revokeObjectURL(candidate.url)
      throw new Error('That image’s alpha hull does not match the portable hull being reattached.')
    }
    if (token !== imageDecodeToken) {
      URL.revokeObjectURL(candidate.url)
      return
    }

    const previousUrl = localImage.url
    localImage = {
      url: candidate.url,
      sampleImageData: candidate.sampleImageData,
      naturalWidth: candidate.naturalWidth,
      naturalHeight: candidate.naturalHeight,
      sampleWidth: candidate.sampleWidth,
      sampleHeight: candidate.sampleHeight,
      sampled: candidate.sampled,
    }
    if (previousUrl) URL.revokeObjectURL(previousUrl)

    state.embedSource = 'image'
    state.image.ready = true
    if (!reattaching) {
      state.image.shape = copyShape(candidate.shape)
      state.image.baseWidth = candidate.shape.width
      state.image.baseHeight = candidate.shape.height
      state.image.scale = 100
    }
    clampRequestedPosition()
    markSceneChanged()
    syncEmbedSourceInterface()
    syncControlsFromState()
    render()
    setImageStatus(
      reattaching
        ? `Local preview reattached. The existing ${preservedShape.points.length}-point portable hull remains active.`
        : `Local preview attached. The ${candidate.shape.points.length}-point hull is the portable geometry.`,
      'success',
    )
    announce('Local image attached and text rerouted around its alpha hull.', 'success')
  } catch (error) {
    if (token !== imageDecodeToken) return
    const message = error instanceof Error
      ? error.message
      : 'That image could not be decoded and sampled safely.'
    setImageStatus(`${message} The last valid scene is unchanged.`, 'error')
    announce('The image was not attached. The last valid scene is unchanged.', 'error')
  } finally {
    if (token === imageDecodeToken) imageFile.value = ''
  }
}

function queueThresholdUpdate(nextThreshold) {
  if (!localImage.sampleImageData || !state.image.ready) return
  if (thresholdFrame !== null) cancelAnimationFrame(thresholdFrame)
  thresholdFrame = requestAnimationFrame(() => {
    thresholdFrame = null
    const previousThreshold = state.image.threshold
    const previousShape = copyShape(state.image.shape)
    try {
      const nextShape = validatedRuntimeHull(
        localImage.sampleImageData,
        nextThreshold,
        previousShape.width,
        previousShape.height,
      )
      state.image.threshold = nextThreshold
      state.image.shape = nextShape
      markSceneChanged()
      render()
      setImageStatus(
        `Alpha threshold ${nextThreshold} produces a ${nextShape.points.length}-point portable hull.`,
        'success',
      )
    } catch (error) {
      state.image.threshold = previousThreshold
      state.image.shape = previousShape
      alphaThreshold.value = String(previousThreshold)
      alphaThresholdOutput.value = String(previousThreshold)
      const message = error instanceof Error ? error.message : 'That threshold has no usable hull.'
      setImageStatus(`${message} The previous hull remains active.`, 'error')
    }
  })
}

function updateLinearSource() {
  const editorial = portableEditorialContext()
  const accessibleState = JSON.stringify([state.text, editorial])
  syncEditorialPreview()
  if (lastAccessibleText === accessibleState) return
  lastAccessibleText = accessibleState
  linearSource.replaceChildren(...semanticArticleNodes(state.text, editorial))
}

function ensureVisualMode(mode) {
  if (visualMode === mode) return
  visualMode = mode
  flowLines.replaceChildren()
  lineElements = []
  characterElements = []
}

function syncLineElements(result, font) {
  ensureVisualMode('lines')
  while (lineElements.length > result.lines.length) {
    lineElements.pop()?.remove()
  }

  while (lineElements.length < result.lines.length) {
    const lineElement = document.createElement('span')
    lineElement.className = 'flow-line'
    flowLines.appendChild(lineElement)
    lineElements.push(lineElement)
  }

  lineElements.forEach((lineElement, index) => {
    const line = result.lines[index]
    lineElement.textContent = line.text
    lineElement.style.left = `${line.x}px`
    lineElement.style.top = `${line.y}px`
    lineElement.style.font = font
    lineElement.style.lineHeight = `${state.lineHeight}px`
  })
}

function syncCharacterElements(result, font) {
  ensureVisualMode('characters')
  const expectedLines = result.lines.length
  const structureMatches = characterElements.length === expectedLines
    && result.lines.every((line, index) => (
      characterElements[index]?.length === (line.characters?.length ?? 0)
    ))

  if (!structureMatches) {
    characterElements = []
    const elements = []
    result.lines.forEach((line) => {
      const lineCharacters = []
      ;(line.characters ?? []).forEach((character) => {
        const element = document.createElement('span')
        element.className = 'flow-character'
        element.textContent = character.char
        lineCharacters.push(element)
        elements.push(element)
      })
      characterElements.push(lineCharacters)
    })
    flowLines.replaceChildren(...elements)
  }

  result.lines.forEach((line, lineIndex) => {
    ;(line.characters ?? []).forEach((character, characterIndex) => {
      const element = characterElements[lineIndex][characterIndex]
      if (element.textContent !== character.char) element.textContent = character.char
      element.style.left = `${character.x}px`
      element.style.top = `${line.y}px`
      element.style.width = `${character.width}px`
      element.style.font = font
      element.style.lineHeight = `${state.lineHeight}px`
    })
  })
}

function syncEmbed(result, shape) {
  const resolved = result.embeds.find((embed) => embed.id === 'studio-embed')
  if (!resolved) return

  const imageEmbed = state.embedSource === 'image'
  embedObject.className = `embed-object embed-object--${imageEmbed ? 'image' : shape.type}`
  embedObject.style.left = `${resolved.rect.x}px`
  embedObject.style.top = `${resolved.rect.y}px`
  embedObject.style.width = `${resolved.rect.width}px`
  embedObject.style.height = `${resolved.rect.height}px`
  embedObject.dataset.x = String(Math.round(resolved.rect.x))
  embedObject.dataset.y = String(Math.round(resolved.rect.y))
  embedObject.dataset.shape = imageEmbed ? 'image' : shape.type

  if (imageEmbed) {
    const attached = Boolean(localImage.url)
    imagePreview.hidden = !attached
    imageHullOutline.hidden = false
    imagePlaceholder.hidden = attached
    if (attached && imagePreview.src !== localImage.url) imagePreview.src = localImage.url
    imagePlaceholder.textContent = state.image.ready ? 'Reattach local image' : 'Choose local image'
    imageHullPolygon.setAttribute(
      'points',
      shape.points.map((point) => `${point.x},${point.y}`).join(' '),
    )
    const description = state.image.decorative
      ? 'Selected decorative image embed'
      : state.image.description.trim()
        ? `Selected image embed: ${state.image.description.trim()}`
        : 'Selected image embed; description required'
    embedObject.setAttribute(
      'aria-label',
      `${description}, at x ${Math.round(resolved.rect.x)}, y ${Math.round(resolved.rect.y)}. Drag it, or use the arrow keys to move it.`,
    )
  } else {
    imagePreview.hidden = true
    imageHullOutline.hidden = true
    imagePlaceholder.hidden = true
    const shapeName = shape.type === 'rect' ? 'rectangle' : shape.type
    embedObject.setAttribute(
      'aria-label',
      `Selected ${shapeName} embed at x ${Math.round(resolved.rect.x)}, y ${Math.round(resolved.rect.y)}. Drag it, or use the arrow keys to move it.`,
    )
  }
  embedObject.querySelector('.embed-object__label').textContent = PRESETS[state.preset].embedLabel
}

function syncOutputs(width) {
  fontSizeOutput.value = `${formatNumber(state.fontSize)} px`
  lineHeightOutput.value = `${formatNumber(state.lineHeight)} px`
  paragraphGapOutput.value = `${formatNumber(state.paragraphGap)} px`
  embedMarginOutput.value = `${formatNumber(state.margin)} px`
  columnWidthOutput.value = width === state.columnWidth
    ? `${formatNumber(state.columnWidth)} px`
    : `${formatNumber(state.columnWidth)} px / ${formatNumber(width)} live`

  alphaThresholdOutput.value = String(state.image.threshold)
  if (state.image.shape) {
    imageScaleOutput.value = `${formatNumber(state.image.shape.width)} × ${formatNumber(state.image.shape.height)} px / ${state.image.scale}%`
  } else {
    imageScaleOutput.value = `${state.image.scale}%`
  }

  metricWidth.textContent = `${formatNumber(width)} px`
  positionX.textContent = formatNumber(livePosition.x)
  positionY.textContent = formatNumber(livePosition.y)
}

function syncShapeDimensionInterface() {
  const visibleDimensions = state.shape.type === 'circle'
    ? ['radius']
    : state.shape.type === 'ellipse'
      ? ['radiusX', 'radiusY']
      : ['width', 'height']

  shapeDimensionFields.forEach((field) => {
    const dimension = field.dataset.dimension
    field.hidden = !visibleDimensions.includes(dimension)
    if (!field.hidden) shapeDimensionInputs[dimension].value = formatNumber(state.shape[dimension])
  })
}

function syncEmbedSourceInterface() {
  embedSourceButtons.forEach((button) => {
    const selected = button.dataset.embedSource === state.embedSource
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-checked', String(selected))
    button.tabIndex = selected ? 0 : -1
  })
  primitiveControls.hidden = state.embedSource !== 'primitive'
  imageControls.hidden = state.embedSource !== 'image'

  const needsAttachment = state.embedSource === 'image' && state.image.ready && !localImage.url
  imageAttachmentState.hidden = !needsAttachment
  alphaThreshold.disabled = !localImage.sampleImageData
  imageScale.disabled = !state.image.ready
  imageDescription.disabled = state.embedSource !== 'image' || state.image.decorative
  imageDecorative.disabled = state.embedSource !== 'image'

  imageSamplingNote.hidden = !localImage.sampled
  imageSamplingNote.textContent = localImage.sampled
    ? `Alpha was sampled at ${localImage.sampleWidth} × ${localImage.sampleHeight} px; the working limit is ${IMAGE_SAMPLE_LIMIT.maxEdge} px per edge and ${IMAGE_SAMPLE_LIMIT.maxPixels.toLocaleString()} pixels.`
    : ''
}

function syncControlsFromState() {
  articleText.value = state.text
  fontFamily.value = state.fontFamily
  fontSize.value = formatNumber(state.fontSize)
  lineHeight.value = formatNumber(state.lineHeight)
  paragraphGap.value = formatNumber(state.paragraphGap)
  columnWidth.value = formatNumber(state.columnWidth)
  embedMargin.value = formatNumber(state.margin)
  alphaThreshold.value = String(state.image.threshold)
  imageScale.value = String(state.image.scale)
  imageDescription.value = state.image.description
  imageDescription.disabled = state.embedSource !== 'image' || state.image.decorative
  imageDecorative.checked = state.image.decorative
  if (state.image.ready && state.image.baseWidth > 0) {
    const widthLimitedMaximum = Math.floor((state.columnWidth / state.image.baseWidth) * 100 / 5) * 5
    imageScale.max = String(clamp(widthLimitedMaximum, SCENE_LIMITS.imageScale[0], SCENE_LIMITS.imageScale[1]))
  } else {
    imageScale.max = String(SCENE_LIMITS.imageScale[1])
  }
  syncShapeDimensionInterface()
  syncEmbedSourceInterface()
}

function syncViewportNote() {
  const constrained = actualWidth < state.columnWidth - 0.01
  const shapeConstrained = shapeSize(currentShape()).width > actualWidth + 0.01
  viewportNote.hidden = !constrained
  viewportNote.textContent = constrained
    ? `This viewport narrows the requested ${formatNumber(state.columnWidth)} px column to ${formatNumber(actualWidth)} px.${shapeConstrained ? ' The embed is proportionally fitted to the live column.' : ''} Copied output uses the live geometry.`
    : ''
}

function behaviorCharacterCount() {
  return [...state.text].length
}

function behaviorGuarded() {
  return behaviorCharacterCount() > BEHAVIOR_TEXT_LIMIT
}

function cancelMotionFrame() {
  if (motion.rafId !== null) cancelAnimationFrame(motion.rafId)
  motion.rafId = null
  motion.lastTimestamp = null
}

function resetMotionRuntime() {
  cancelMotionFrame()
  motion.elapsed = 0
  motion.cursor = null
  motion.userPaused = false
  motion.reducedOverride = false
  motion.result = null
  motion.effect = null
}

function motionCanRun() {
  if (state.kind !== 'textBehavior' || behaviorGuarded()) return false
  if (motion.userPaused || (reducedMotionQuery.matches && !motion.reducedOverride)) return false
  return BEHAVIOR_DEFS[state.behavior.id].mode === 'continuous' || motion.cursor !== null
}

function paintBehaviorTransforms() {
  if (
    state.kind !== 'textBehavior'
      || behaviorGuarded()
      || !motion.result
      || !motion.effect
      || visualMode !== 'characters'
  ) return

  const transforms = applyEffects(motion.result, [motion.effect], {
    time: motion.elapsed,
    cursor: motion.cursor,
    height: Math.max(motion.result.height, state.lineHeight),
    width: actualWidth,
  })
  characterElements.forEach((lineElementsForBehavior, lineIndex) => {
    lineElementsForBehavior.forEach((element, characterIndex) => {
      const transform = transforms[lineIndex][characterIndex]
      element.style.opacity = String(transform.opacity)
      element.style.transform = `translate3d(${transform.dx}px, ${transform.dy}px, 0) rotate(${transform.rotation}rad) scale(${transform.scale})`
    })
  })
}

function motionTick(timestamp) {
  motion.rafId = null
  if (!motionCanRun()) return
  if (motion.lastTimestamp !== null) {
    motion.elapsed += Math.min(100, timestamp - motion.lastTimestamp)
  }
  motion.lastTimestamp = timestamp
  paintBehaviorTransforms()
  motion.rafId = requestAnimationFrame(motionTick)
}

function startMotionFrame() {
  if (!motionCanRun() || motion.rafId !== null) return
  motion.lastTimestamp = null
  motion.rafId = requestAnimationFrame(motionTick)
}

function updateMotionInterface() {
  if (state.kind !== 'textBehavior') return
  const definition = BEHAVIOR_DEFS[state.behavior.id]
  const count = behaviorCharacterCount()
  const guarded = count > BEHAVIOR_TEXT_LIMIT
  motionToggle.disabled = guarded
  motionReplay.disabled = guarded

  if (guarded) {
    motionToggle.textContent = 'Motion unavailable'
    motionState.textContent = `Animation paused: ${count} characters exceed the 1,500-character guard. Editing and all portable output remain available.`
  } else if (reducedMotionQuery.matches && !motion.reducedOverride) {
    motionToggle.textContent = 'Preview motion'
    motionState.textContent = 'Reduced motion is active. This scene stays still until you deliberately preview it.'
  } else if (motion.userPaused) {
    motionToggle.textContent = 'Resume motion'
    motionState.textContent = `${definition.label} is paused at the current frame.`
  } else if (definition.mode === 'pointer' && !motion.cursor) {
    motionToggle.textContent = 'Pause motion'
    motionState.textContent = 'Move the pointer inside the reading surface to preview the spatial ripple.'
  } else {
    motionToggle.textContent = 'Pause motion'
    motionState.textContent = definition.mode === 'pointer'
      ? 'Pointer ripple is responding across its spatial decay radius.'
      : `${definition.label} is running continuously.`
  }
}

function syncBehaviorViewportNote() {
  const constrained = actualWidth < state.columnWidth - 0.01
  behaviorViewportNote.hidden = !constrained
  behaviorViewportNote.textContent = constrained
    ? `This viewport narrows the requested ${formatNumber(state.columnWidth)} px column to ${formatNumber(actualWidth)} px. Portable output retains the requested width.`
    : ''
}

function renderLayoutScene() {
  cancelMotionFrame()
  motion.result = null
  motion.effect = null
  const nextWidth = measuredColumnWidth()
  const padding = pagePadding()
  actualWidth = nextWidth

  const shape = shapeForWidth(currentShape(), actualWidth)
  const size = shapeSize(shape)
  livePosition = positionForRender(actualWidth, size)

  compositionPage.style.setProperty('--page-pad', `${padding}px`)
  compositionPage.style.width = `${actualWidth + padding * 2}px`
  flowRegion.style.width = `${actualWidth}px`

  const scene = serializeLayoutScene(shape)
  const font = scene.layout.font
  const result = flowLayout(layoutInputFromScene(scene))

  lastResult = result
  reflowCount += 1

  const displayHeight = Math.max(
    state.lineHeight,
    result.height,
    livePosition.y + size.height + state.lineHeight,
  )
  flowRegion.style.height = `${displayHeight}px`

  syncLineElements(result, font)
  embedObject.hidden = false
  syncEmbed(result, shape)
  updateLinearSource()
  syncOutputs(actualWidth)
  syncViewportNote()
  syncPortableOutput(scene)
  emptyState.hidden = state.text.trim().length > 0

  metricLines.textContent = String(result.lines.length)
  metricReflows.textContent = String(reflowCount)
  flowRegion.dataset.layoutVersion = String(reflowCount)
  flowRegion.dataset.lineCount = String(result.lines.length)
  document.documentElement.classList.add('interactive-ready')
}

function renderTextBehaviorScene() {
  cancelMotionFrame()
  const nextWidth = measuredColumnWidth()
  const padding = pagePadding()
  actualWidth = nextWidth

  compositionPage.style.setProperty('--page-pad', `${padding}px`)
  compositionPage.style.width = `${actualWidth + padding * 2}px`
  flowRegion.style.width = `${actualWidth}px`
  embedObject.hidden = true

  const scene = serializeTextBehaviorScene()
  const result = flowLayout({
    text: scene.article.text,
    font: scene.layout.font,
    width: actualWidth,
    lineHeight: scene.layout.lineHeight,
    paragraphGap: scene.layout.paragraphGap,
    embeds: [],
    characterPositions: true,
  })
  lastResult = result
  reflowCount += 1

  const displayHeight = Math.max(state.lineHeight, result.height)
  flowRegion.style.height = `${displayHeight}px`
  if (behaviorGuarded()) syncLineElements(result, scene.layout.font)
  else syncCharacterElements(result, scene.layout.font)

  motion.result = result
  motion.effect = BEHAVIOR_DEFS[state.behavior.id].factory(
    state.behavior.valuesById[state.behavior.id],
  )
  paintBehaviorTransforms()
  updateLinearSource()
  syncOutputs(actualWidth)
  syncBehaviorViewportNote()
  syncPortableOutput(scene)
  emptyState.hidden = state.text.trim().length > 0

  metricLines.textContent = String(result.lines.length)
  metricReflows.textContent = String(reflowCount)
  flowRegion.dataset.layoutVersion = String(reflowCount)
  flowRegion.dataset.lineCount = String(result.lines.length)
  updateMotionInterface()
  startMotionFrame()
  document.documentElement.classList.add('interactive-ready')
}

function render() {
  if (composerView.hidden || studioSurface.hidden || liveComposer.hidden) return
  if (state.kind === 'textBehavior') renderTextBehaviorScene()
  else renderLayoutScene()
}

function presetPosition(presetKey, width, shape = currentShape()) {
  const size = shapeSize(shape)
  const position = PRESETS[presetKey].position(width, size)
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
  }
}

function syncPresetInterface() {
  const preset = PRESETS[state.preset]

  presetButtons.forEach((button) => {
    const selected = button.dataset.preset === state.preset
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-checked', String(selected))
    button.tabIndex = selected ? 0 : -1
  })

  articlePresetLabel.textContent = preset.folio
  articleKicker.textContent = preset.kicker
  articleTitle.textContent = preset.title
  articleDeck.textContent = preset.deck
}

function behaviorNumberText(value, contract) {
  const stepText = String(contract.step)
  const precision = stepText.includes('.') ? stepText.split('.')[1].length : 0
  return Number(value).toFixed(precision)
}

function behaviorOutputText(value, contract) {
  const number = behaviorNumberText(value, contract)
  if (contract.unit === 'rate') return number
  return `${number} ${contract.unit}`
}

function syncBehaviorInterface() {
  const definition = BEHAVIOR_DEFS[state.behavior.id]
  const currentValues = state.behavior.valuesById[state.behavior.id]
  behaviorButtons.forEach((button) => {
    const selected = button.dataset.behavior === state.behavior.id
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-checked', String(selected))
    button.tabIndex = selected ? 0 : -1
  })

  behaviorMode.textContent = definition.modeLabel
  articlePresetLabel.textContent = definition.folio
  articleKicker.textContent = definition.kicker
  articleTitle.textContent = definition.title
  articleDeck.textContent = definition.deck

  const controls = Object.entries(definition.values).map(([key, contract]) => {
    const id = `behavior-${state.behavior.id}-${key}`
    const label = document.createElement('label')
    label.className = 'range-field behavior-value'
    label.htmlFor = id

    const labelLine = document.createElement('span')
    labelLine.className = 'behavior-value__label'
    const name = document.createElement('span')
    name.textContent = contract.label
    const bounds = document.createElement('span')
    bounds.className = 'behavior-value__bounds'
    bounds.textContent = `${behaviorNumberText(contract.min, contract)}–${behaviorNumberText(contract.max, contract)} ${contract.unit}`
    labelLine.append(name, bounds)

    const control = document.createElement('span')
    control.className = 'range-field__control'
    const input = document.createElement('input')
    input.id = id
    input.type = 'range'
    input.min = String(contract.min)
    input.max = String(contract.max)
    input.step = String(contract.step)
    input.value = String(currentValues[key])
    input.dataset.behaviorValue = key
    const output = document.createElement('output')
    output.setAttribute('for', id)
    output.value = behaviorOutputText(currentValues[key], contract)
    control.append(input, output)
    label.append(labelLine, control)

    input.addEventListener('input', () => {
      const value = Number(input.value)
      if (!Number.isFinite(value)) return
      state.behavior.valuesById[state.behavior.id][key] = value
      output.value = behaviorOutputText(value, contract)
      markSceneChanged()
      render()
    })
    return label
  })
  behaviorValueControls.replaceChildren(...controls)
}

function syncSceneKindInterface() {
  sceneKindButtons.forEach((button) => {
    const selected = button.dataset.sceneKind === state.kind
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-checked', String(selected))
    button.setAttribute('aria-selected', String(selected))
    button.tabIndex = selected ? 0 : -1
  })
  const layoutScene = state.kind === 'layout'
  layoutControlsPanel.hidden = !layoutScene
  behaviorControlsPanel.hidden = layoutScene
  resetPositionButton.hidden = !layoutScene
  layoutInteraction.hidden = !layoutScene
  positionReadout.hidden = !layoutScene
  behaviorInteraction.hidden = layoutScene

  if (layoutScene) {
    workspaceEyebrow.textContent = 'Live layout'
    workspaceTitle.textContent = 'The text makes room.'
    syncPresetInterface()
  } else {
    workspaceEyebrow.textContent = 'Live behavior'
    workspaceTitle.textContent = 'The characters carry the motion.'
    syncBehaviorInterface()
  }
}

function syncShapeInterface() {
  shapeButtons.forEach((button) => {
    const selected = button.dataset.shape === state.shape.type
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-checked', String(selected))
    button.tabIndex = selected ? 0 : -1
  })
  syncShapeDimensionInterface()
}

function applyPreset(presetKey, shouldAnnounce = true) {
  const preset = PRESETS[presetKey]
  state.preset = presetKey
  if (state.embedSource === 'primitive') {
    state.shape = defaultShape(preset.shape, state.columnWidth, presetKey)
  }
  state.margin = preset.margin
  state.position = presetPosition(presetKey, state.columnWidth, currentShape())
  if (shouldAnnounce) markSceneChanged()
  syncPresetInterface()
  syncShapeInterface()
  syncControlsFromState()
  render()

  if (shouldAnnounce) {
    const selectedButton = presetButtons.find((button) => button.dataset.preset === presetKey)
    announce(`${selectedButton.querySelector('.preset-option__name').textContent} composition selected.`)
  }
}

function selectSceneKind(kind) {
  if (kind !== 'layout' && kind !== 'textBehavior') return
  if (kind === state.kind) {
    setComposerMode(kind, true)
    return
  }
  if (kind === 'textBehavior') {
    imageDecodeToken += 1
    releaseLocalImage()
  }
  state.kind = kind
  markSceneChanged()
  resetMotionRuntime()
  syncSceneKindInterface()
  syncControlsFromState()
  setComposerMode(kind)
  announce(
    kind === 'layout'
      ? 'Layout scene selected. The current layout draft is active.'
      : 'Text behavior selected. The layout embed is no longer part of the active scene.',
  )
}

function selectBehavior(behaviorId) {
  if (!Object.hasOwn(BEHAVIOR_DEFS, behaviorId)) return
  if (behaviorId === state.behavior.id) return
  state.behavior.id = behaviorId
  markSceneChanged()
  resetMotionRuntime()
  syncBehaviorInterface()
  render()
  announce(`${BEHAVIOR_DEFS[behaviorId].label} behavior selected.`)
}

function selectEmbedSource(source) {
  if (source !== 'primitive' && source !== 'image') return
  if (source === state.embedSource) return

  if (state.embedSource === 'image') {
    imageDecodeToken += 1
    releaseLocalImage()
  }

  if (source === 'image' && !state.image.shape) {
    const primitiveSize = shapeSize(state.shape)
    const width = Math.min(primitiveSize.width, state.columnWidth)
    const height = Math.max(16, primitiveSize.height * (width / primitiveSize.width))
    state.image.shape = rectanglePolygon(width, height)
    state.image.baseWidth = width
    state.image.baseHeight = height
    state.image.scale = 100
    state.image.ready = false
  }

  state.embedSource = source
  markSceneChanged()
  clampRequestedPosition()
  syncEmbedSourceInterface()
  syncShapeInterface()
  syncControlsFromState()
  render()

  if (source === 'image') {
    const message = state.image.ready
      ? 'Image hull selected. Reattach a local image to restore the visual preview.'
      : 'Local image source selected. Choose a raster image to derive its portable hull.'
    setImageStatus(message)
    announce(message)
  } else {
    announce('Primitive embed selected. Any active local preview was released.')
  }
}

function moveEmbed(x, y, shouldAnnounce = false) {
  const shape = currentShape()
  const size = shapeSize(shape)
  const bounds = flowBounds(actualWidth, size)
  setRequestedPositionFromLive(
    clamp(x, 0, bounds.maxX),
    clamp(y, 0, bounds.maxY),
  )
  markSceneChanged()
  render()

  if (shouldAnnounce) {
    announce(`Embed moved to x ${Math.round(livePosition.x)}, y ${Math.round(livePosition.y)}.`)
  }
}

function localPoint(event) {
  const rect = flowRegion.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function bindRadioGroup(buttons, valueFromButton, selectValue) {
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectValue(valueFromButton(button)))
    button.addEventListener('keydown', (event) => {
      let nextIndex = null
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % buttons.length
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + buttons.length) % buttons.length
      } else if (event.key === 'Home') {
        nextIndex = 0
      } else if (event.key === 'End') {
        nextIndex = buttons.length - 1
      }

      if (nextIndex !== null) {
        event.preventDefault()
        buttons[nextIndex].focus()
        selectValue(valueFromButton(buttons[nextIndex]))
      }
    })
  })
}

function fallbackCopy(text) {
  const activeElement = document.activeElement
  const selection = document.getSelection()
  const savedRanges = []

  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      savedRanges.push(selection.getRangeAt(index).cloneRange())
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.inset = '0 auto auto -9999px'
  document.body.appendChild(textarea)
  textarea.focus({ preventScroll: true })
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  textarea.remove()
  activeElement?.focus?.({ preventScroll: true })

  if (selection) {
    selection.removeAllRanges()
    savedRanges.forEach((range) => selection.addRange(range))
  }

  return copied
}

async function writeClipboard(text) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Continue to the user-gesture copy fallback.
    }
  }

  return fallbackCopy(text)
}

async function copyCurrentOutput(outputType) {
  const blocked = portableBlockReason()
  if (blocked) {
    announce(blocked, 'error')
    return
  }
  const scene = serializeScene()
  syncPortableOutput(scene)

  const outputs = {
    json: { text: sceneJsonOutput.textContent, label: 'Scene JSON' },
    canvas: { text: canvasExampleOutput.textContent, label: 'Canvas implementation' },
    dom: { text: domExampleOutput.textContent, label: 'DOM example' },
  }
  const output = outputs[outputType]
  if (!output) return
  const copied = await writeClipboard(output.text)

  if (copied) {
    announce(`${output.label} copied from the current scene.`, 'success')
  } else {
    announce(`${output.label} could not be copied. Open Inspect current output and copy it manually.`, 'error')
  }
}

function downloadCurrentScene() {
  const blocked = portableBlockReason()
  if (blocked) {
    announce(blocked, 'error')
    return
  }

  try {
    const scene = validateScene(serializeScene())
    const blob = new Blob([`${JSON.stringify(scene, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pretext-studio.scene.json'
    link.hidden = true
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    announce('Portable scene downloaded. It contains scene inputs only.', 'success')
  } catch {
    announce('The current scene could not be downloaded. The working scene is unchanged.', 'error')
  }
}

bindRadioGroup(outcomeButtons, (button) => button.dataset.outcome, selectOutcome)

makeDesignButton.addEventListener('click', startGuide)
revisitProofScenesButton.addEventListener('click', () => openWelcome('proofs'))

openFullProofButton.addEventListener('click', () => {
  if (selectedOutcome === 'reading') {
    readingController.setPassage(READING_TEXT)
    showView('reading')
    readingSurface.tabIndex = -1
    requestAnimationFrame(() => readingSurface.focus({ preventScroll: true }))
  } else {
    openWelcome('solo', selectedOutcome)
  }
})

homeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeTakeaway()
    showView('landing')
    requestAnimationFrame(() => makeDesignButton.focus({ preventScroll: true }))
  })
})

welcomeSkipButton.addEventListener('click', () => closeWelcome(welcomeMode === 'first'))
welcomeBackButton.addEventListener('click', () => stepWelcome(-1))
welcomeNextButton.addEventListener('click', () => stepWelcome(1))

takeSceneButton.addEventListener('click', openTakeaway)
takeawayCloseButton.addEventListener('click', closeTakeaway)
takeawayScrim.addEventListener('pointerdown', (event) => {
  if (event.target === takeawayScrim) closeTakeaway()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!takeawayScrim.hidden) {
      event.preventDefault()
      closeTakeaway()
      return
    }
    if (!welcome.hidden) {
      event.preventDefault()
      closeWelcome(false)
      return
    }
  }
  if (event.key !== 'Tab') return
  if (!takeawayScrim.hidden) trapFocus(takeawayModal, event)
  else if (!welcome.hidden) trapFocus(welcome, event)
})

guideContinueButton.addEventListener('click', () => {
  guideDraft = guideText.value
  guideHasVisitorText = Boolean(guideDraft.trim())
  showGuideStep(2)
})

guideExampleButton.addEventListener('click', () => {
  guideDraft = SAMPLE_TEXT
  guideHasVisitorText = false
  showGuideStep(2)
})

guideBackButton.addEventListener('click', () => showGuideStep(1))

guideSkipButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!guideStepOne.hidden) {
      guideDraft = guideText.value
      guideHasVisitorText = Boolean(guideDraft.trim())
    }
    finishGuide('room')
  })
})

intentButtons.forEach((button) => {
  button.addEventListener('click', () => finishGuide(button.dataset.intent))
})

function activateComposerTab(button, focus = true) {
  const mode = button.dataset.composerTab
  if (mode === 'text') setComposerMode('text', focus)
  else selectSceneKind(mode)
}

composerTabButtons.forEach((button, index) => {
  button.addEventListener('click', () => activateComposerTab(button))
  button.addEventListener('keydown', (event) => {
    let nextIndex = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % composerTabButtons.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + composerTabButtons.length) % composerTabButtons.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = composerTabButtons.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const next = composerTabButtons[nextIndex]
    next.focus()
    activateComposerTab(next, false)
  })
})

textNextButtons.forEach((button) => {
  button.addEventListener('click', () => selectSceneKind(button.dataset.textNext))
})

openStoryButton.addEventListener('click', startStoryDraft)
editStoryButton.addEventListener('click', () => setComposerMode('text', true))

bindRadioGroup(presetButtons, (button) => button.dataset.preset, (preset) => applyPreset(preset))

bindRadioGroup(
  behaviorButtons,
  (button) => button.dataset.behavior,
  (behaviorId) => selectBehavior(behaviorId),
)

bindRadioGroup(
  embedSourceButtons,
  (button) => button.dataset.embedSource,
  (source) => selectEmbedSource(source),
)

bindRadioGroup(shapeButtons, (button) => button.dataset.shape, (shape) => {
  state.shape = defaultShape(shape, state.columnWidth)
  markSceneChanged()
  clampRequestedPosition()
  syncShapeInterface()
  render()
  announce(`${shape === 'rect' ? 'Rectangle' : `${shape[0].toUpperCase()}${shape.slice(1)}`} embed selected.`)
})

articleText.addEventListener('input', (event) => {
  state.text = event.target.value
  markSceneChanged()
  render()
})

;[
  [editorialKicker, 'kicker'],
  [editorialHeadline, 'headline'],
  [editorialDeck, 'deck'],
].forEach(([input, key]) => {
  input.addEventListener('input', () => {
    state.editorial[key] = input.value
    markSceneChanged()
    render()
  })
})

fontFamily.addEventListener('change', (event) => {
  state.fontFamily = event.target.value
  markSceneChanged()
  render()
})

fontSize.addEventListener('input', (event) => {
  state.fontSize = Number(event.target.value)
  markSceneChanged()
  render()
})

lineHeight.addEventListener('input', (event) => {
  state.lineHeight = Number(event.target.value)
  markSceneChanged()
  render()
})

paragraphGap.addEventListener('input', (event) => {
  state.paragraphGap = Number(event.target.value)
  markSceneChanged()
  render()
})

columnWidth.addEventListener('input', (event) => {
  const nextWidth = Number(event.target.value)
  applyColumnWidth(nextWidth)
})

fitPassageButton.addEventListener('click', fitMeasureToPassage)

embedMargin.addEventListener('input', (event) => {
  state.margin = Number(event.target.value)
  markSceneChanged()
  render()
})

Object.entries(shapeDimensionInputs).forEach(([dimension, input]) => {
  input.addEventListener('input', () => {
    const value = Number(input.value)
    const minimum = Number(input.min)
    const maximum = Number(input.max)
    if (!Number.isFinite(value) || value < minimum || value > maximum) return
    const candidate = { ...state.shape, [dimension]: value }
    if (shapeSize(candidate).width > state.columnWidth) {
      input.value = formatNumber(state.shape[dimension])
      announce(`That primitive must fit the ${formatNumber(state.columnWidth)} px column.`, 'error')
      return
    }
    state.shape = candidate
    markSceneChanged()
    clampRequestedPosition()
    render()
  })

  input.addEventListener('blur', () => {
    if (Object.hasOwn(state.shape, dimension)) input.value = formatNumber(state.shape[dimension])
  })
})

imageFile.addEventListener('change', () => {
  const [file] = imageFile.files ?? []
  if (file) handleImageSelection(file)
})

alphaThreshold.addEventListener('input', () => {
  const value = Number(alphaThreshold.value)
  if (!Number.isInteger(value)) return
  alphaThresholdOutput.value = String(value)
  queueThresholdUpdate(value)
})

imageScale.addEventListener('input', () => {
  if (!state.image.ready || !state.image.baseWidth || !state.image.baseHeight) return
  const value = Number(imageScale.value)
  if (!Number.isFinite(value)) return
  const width = state.image.baseWidth * value / 100
  const height = state.image.baseHeight * value / 100
  if (
    value < SCENE_LIMITS.imageScale[0]
      || value > SCENE_LIMITS.imageScale[1]
      || width > state.columnWidth
      || height > SCENE_LIMITS.shapeHeight[1]
  ) {
    imageScale.value = String(state.image.scale)
    setImageStatus('That scale would not fit the current column. The previous size remains active.', 'error')
    return
  }
  state.image.scale = value
  state.image.shape = {
    ...state.image.shape,
    width: Number(formatNumber(width)),
    height: Number(formatNumber(height)),
  }
  markSceneChanged()
  clampRequestedPosition()
  render()
  setImageStatus(
    `Displayed image is ${formatNumber(state.image.shape.width)} × ${formatNumber(state.image.shape.height)} px; its aspect ratio is unchanged.`,
    'success',
  )
})

imageDescription.addEventListener('input', () => {
  state.image.description = imageDescription.value
  markSceneChanged()
  render()
  if (!state.image.decorative && !state.image.description.trim()) {
    setImageStatus('Describe the image, or mark it decorative, before copying output.', 'error')
  } else {
    setImageStatus('Image accessibility metadata is ready.', 'success')
  }
})

imageDecorative.addEventListener('change', () => {
  state.image.decorative = imageDecorative.checked
  markSceneChanged()
  imageDescription.disabled = state.image.decorative
  render()
  setImageStatus(
    state.image.decorative
      ? 'The image is marked decorative; generated output will not announce it.'
      : state.image.description.trim()
        ? 'The image description will be announced once in generated output.'
        : 'Add an image description before copying output.',
    state.image.decorative || state.image.description.trim() ? 'success' : 'error',
  )
})

embedObject.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  const point = localPoint(event)
  dragging = {
    pointerId: event.pointerId,
    offsetX: point.x - livePosition.x,
    offsetY: point.y - livePosition.y,
  }
  embedObject.focus({ preventScroll: true })
  embedObject.setPointerCapture?.(event.pointerId)
  document.body.classList.add('dragging-embed')
  event.preventDefault()
})

embedObject.addEventListener('pointermove', (event) => {
  if (!dragging || event.pointerId !== dragging.pointerId) return
  const point = localPoint(event)
  moveEmbed(point.x - dragging.offsetX, point.y - dragging.offsetY)
  event.preventDefault()
})

function finishDrag(event) {
  if (!dragging || event.pointerId !== dragging.pointerId) return
  embedObject.releasePointerCapture?.(event.pointerId)
  dragging = null
  document.body.classList.remove('dragging-embed')
  announce(`Embed placed at x ${Math.round(livePosition.x)}, y ${Math.round(livePosition.y)}.`)
}

embedObject.addEventListener('pointerup', finishDrag)
embedObject.addEventListener('pointercancel', finishDrag)

embedObject.addEventListener('keydown', (event) => {
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }
  const direction = directions[event.key]
  if (!direction) return

  event.preventDefault()
  const step = event.shiftKey ? 40 : 16
  moveEmbed(
    livePosition.x + direction[0] * step,
    livePosition.y + direction[1] * step,
    true,
  )
})

flowRegion.addEventListener('pointermove', (event) => {
  if (state.kind !== 'textBehavior' || BEHAVIOR_DEFS[state.behavior.id].mode !== 'pointer') return
  const rect = flowRegion.getBoundingClientRect()
  motion.cursor = {
    x: (event.clientX - rect.left) * actualWidth / rect.width,
    y: (event.clientY - rect.top) * flowRegion.offsetHeight / rect.height,
  }
  if (
    !motion.userPaused
      && !behaviorGuarded()
      && (!reducedMotionQuery.matches || motion.reducedOverride)
  ) {
    paintBehaviorTransforms()
    startMotionFrame()
  }
  updateMotionInterface()
})

function clearBehaviorPointer() {
  if (state.kind !== 'textBehavior' || BEHAVIOR_DEFS[state.behavior.id].mode !== 'pointer') return
  motion.cursor = null
  if (
    !motion.userPaused
      && !behaviorGuarded()
      && (!reducedMotionQuery.matches || motion.reducedOverride)
  ) paintBehaviorTransforms()
  cancelMotionFrame()
  updateMotionInterface()
}

flowRegion.addEventListener('pointerleave', clearBehaviorPointer)
flowRegion.addEventListener('pointercancel', clearBehaviorPointer)

document.addEventListener('pointermove', (event) => {
  if (
    motion.cursor
      && state.kind === 'textBehavior'
      && BEHAVIOR_DEFS[state.behavior.id].mode === 'pointer'
      && !flowRegion.contains(event.target)
  ) clearBehaviorPointer()
})

motionToggle.addEventListener('click', () => {
  if (behaviorGuarded()) return
  if (reducedMotionQuery.matches && !motion.reducedOverride) {
    motion.reducedOverride = true
    motion.userPaused = false
    paintBehaviorTransforms()
    startMotionFrame()
  } else if (motion.userPaused) {
    motion.userPaused = false
    paintBehaviorTransforms()
    startMotionFrame()
  } else {
    motion.userPaused = true
    cancelMotionFrame()
  }
  updateMotionInterface()
})

motionReplay.addEventListener('click', () => {
  if (behaviorGuarded()) return
  motion.elapsed = 0
  motion.userPaused = false
  if (reducedMotionQuery.matches) motion.reducedOverride = true
  paintBehaviorTransforms()
  startMotionFrame()
  updateMotionInterface()
})

reducedMotionQuery.addEventListener('change', () => {
  motion.reducedOverride = false
  cancelMotionFrame()
  if (state.kind === 'textBehavior') {
    paintBehaviorTransforms()
    updateMotionInterface()
    startMotionFrame()
  }
  readingController?.handleReducedMotion()
  syncProofActivity()
})

document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelMotionFrame()
  else startMotionFrame()
})

resetPositionButton.addEventListener('click', () => {
  state.position = presetPosition(state.preset, state.columnWidth, currentShape())
  markSceneChanged()
  clampRequestedPosition()
  render()
  embedObject.focus({ preventScroll: true })
  announce('Embed position reset to the selected composition.')
})

copySceneJsonButton.addEventListener('click', () => copyCurrentOutput('json'))
copyCanvasExampleButton.addEventListener('click', () => copyCurrentOutput('canvas'))
copyDomExampleButton.addEventListener('click', () => copyCurrentOutput('dom'))
downloadSceneButton.addEventListener('click', downloadCurrentScene)

loadSceneButton.addEventListener('click', () => {
  try {
    const scene = parseSceneJson(sceneImportJson.value)
    loadImportedScene(scene)
    markSceneChanged()
    closeTakeaway(false)
    requestAnimationFrame(() => {
      workspaceTitle.tabIndex = -1
      workspaceTitle.scrollIntoView({ behavior: 'auto', block: 'start' })
      workspaceTitle.focus({ preventScroll: true })
      announce('Imported scene loaded into the editable rendered result.', 'success')
    })
  } catch (error) {
    const message = error instanceof SceneImportError
      ? error.message
      : 'That scene could not be laid out. Check its numeric values and try again.'
    setImportStatus(message, 'error', true)
  }
})

sceneImportJson.addEventListener('input', () => {
  sceneImportJson.removeAttribute('aria-invalid')
  if (sceneImportStatus.dataset.state === 'error') {
    sceneImportStatus.textContent = 'Current scene unchanged. Load when the JSON is ready.'
    sceneImportStatus.dataset.state = ''
  }
})

viewStartersButton.addEventListener('click', () => {
  const starter = state.kind === 'layout' ? layoutControlsPanel : behaviorControlsPanel
  const buttons = state.kind === 'layout' ? presetButtons : behaviorButtons
  closeTakeaway()
  setComposerMode(state.kind)
  starter.scrollIntoView({ behavior: 'auto', block: 'start' })
  const selected = buttons.find((button) => button.getAttribute('aria-checked') === 'true')
  selected?.focus({ preventScroll: true })
})

document.querySelectorAll('[data-proof-kind]').forEach((host) => {
  proofControllers.set(host, createProofController(host))
})
readingController = new ReadingController()

syncPresetInterface()
syncShapeInterface()
syncEmbedSourceInterface()
syncSceneKindInterface()
syncControlsFromState()
syncEditorialInputs()
syncComposerMode()
selectOutcome('flow-hero')
showView('landing')

const resizeObserver = new ResizeObserver(() => {
  if (composerView.hidden || liveComposer.hidden || studioSurface.hidden) return
  const width = measuredColumnWidth()
  if (!actualWidth || Math.abs(width - actualWidth) >= 1) {
    render()
  }
})
resizeObserver.observe(stage)

if (document.fonts?.ready) {
  document.fonts.ready
    .then(() => {
      render()
      readingController.render()
      syncProofActivity()
    })
    .catch(() => {})
}

if (firstPaintWelcomeState === 'first' || !hasSeenWelcome()) {
  openWelcome('first')
} else {
  welcome.hidden = true
}
delete document.documentElement.dataset.welcomeState

window.addEventListener('pagehide', () => {
  resizeObserver.disconnect()
  proofControllers.forEach((controller) => controller.destroy())
  readingController.destroy()
  cancelMotionFrame()
  imageDecodeToken += 1
  if (thresholdFrame !== null) cancelAnimationFrame(thresholdFrame)
  releaseLocalImage()
})
