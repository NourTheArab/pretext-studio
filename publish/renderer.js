import {
  ambientDrift,
  applyEffects,
  cursorRipple,
  flowLayout,
  wave,
} from 'pretext-flow'

const TEXT_LIMIT = 1500
const COMPOSITIONS = new Set(['pullQuoteRight', 'heroInset', 'magazineSpread'])
const BEHAVIORS = {
  ambientDrift: {
    label: 'Breathe',
    mode: 'continuous',
    factory: ambientDrift,
    values: {
      speed: [0.05, 1],
      amplitude: [1, 8],
    },
  },
  wave: {
    label: 'Wave',
    mode: 'continuous',
    factory: wave,
    values: {
      speed: [0.1, 2],
      amplitude: [1, 10],
      frequency: [0.01, 0.12],
    },
  },
  cursorRipple: {
    label: 'Pointer ripple',
    mode: 'pointer',
    factory: cursorRipple,
    values: {
      speed: [0.1, 2],
      strength: [2, 16],
      decay: [0.005, 0.04],
    },
  },
}

class StudioSceneError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StudioSceneError'
  }
}

function fail(message) {
  throw new StudioSceneError(message)
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, keys, label) {
  if (!isObject(value)) fail(`${label} must be an object.`)
  const actual = Object.keys(value)
  const missing = keys.find((key) => !Object.hasOwn(value, key))
  if (missing) fail(`${label} is missing ${missing}.`)
  const extra = actual.find((key) => !keys.includes(key))
  if (extra) fail(`${label} contains unsupported ${extra}.`)
}

function finite(value, label, minimum, maximum) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${label} must be a finite number.`)
  }
  if (value < minimum || value > maximum) {
    fail(`${label} must be between ${minimum} and ${maximum}.`)
  }
  return value
}

function polygonArea(points) {
  let twiceArea = 0
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    twiceArea += point.x * next.y - next.x * point.y
  })
  return Math.abs(twiceArea) / 2
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

function validatePrimitive(shape) {
  if (!isObject(shape) || typeof shape.type !== 'string') fail('Embed shape needs a type.')
  if (shape.type === 'circle') {
    exactKeys(shape, ['type', 'radius'], 'Circle')
    return { type: 'circle', radius: finite(shape.radius, 'Circle radius', 8, 410) }
  }
  if (shape.type === 'rect') {
    exactKeys(shape, ['type', 'width', 'height'], 'Rectangle')
    return {
      type: 'rect',
      width: finite(shape.width, 'Rectangle width', 16, 820),
      height: finite(shape.height, 'Rectangle height', 16, 1200),
    }
  }
  if (shape.type === 'ellipse') {
    exactKeys(shape, ['type', 'radiusX', 'radiusY'], 'Ellipse')
    return {
      type: 'ellipse',
      radiusX: finite(shape.radiusX, 'Ellipse radius X', 8, 410),
      radiusY: finite(shape.radiusY, 'Ellipse radius Y', 8, 410),
    }
  }
  fail('Studio layout scenes support circle, rectangle, and ellipse primitive embeds.')
}

function validatePolygon(shape) {
  exactKeys(shape, ['type', 'points', 'width', 'height'], 'Polygon')
  if (shape.type !== 'polygon' || !Array.isArray(shape.points)) {
    fail('An image embed must use polygon points.')
  }
  if (shape.points.length < 3 || shape.points.length > 2048) {
    fail('A polygon needs between 3 and 2048 points.')
  }
  const points = shape.points.map((point, index) => {
    exactKeys(point, ['x', 'y'], `Polygon point ${index + 1}`)
    return {
      x: finite(point.x, `Polygon point ${index + 1} x`, 0, 1),
      y: finite(point.y, `Polygon point ${index + 1} y`, 0, 1),
    }
  })
  const distinct = new Set(points.map((point) => `${point.x},${point.y}`))
  if (distinct.size !== points.length || polygonArea(points) <= 0.000001) {
    fail('The polygon must contain distinct points and usable area.')
  }
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length
      if (first === secondNext || firstNext === second) continue
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) {
        fail('Polygon edges must not cross or overlap.')
      }
    }
  }
  let direction = 0
  points.forEach((first, index) => {
    const second = points[(index + 1) % points.length]
    const third = points[(index + 2) % points.length]
    const cross = (second.x - first.x) * (third.y - second.y)
      - (second.y - first.y) * (third.x - second.x)
    if (Math.abs(cross) <= 0.0000001) return
    const nextDirection = Math.sign(cross)
    if (direction && direction !== nextDirection) fail('The polygon must be convex and ordered.')
    direction = nextDirection
  })
  if (!direction) fail('The polygon must enclose a usable area.')
  return {
    type: 'polygon',
    points,
    width: finite(shape.width, 'Polygon width', 1, 820),
    height: finite(shape.height, 'Polygon height', 1, 1200),
  }
}

function shapeSize(shape) {
  if (shape.type === 'circle') return { width: shape.radius * 2, height: shape.radius * 2 }
  if (shape.type === 'ellipse') return { width: shape.radiusX * 2, height: shape.radiusY * 2 }
  return { width: shape.width, height: shape.height }
}

function copyShape(shape) {
  return shape.type === 'polygon'
    ? { ...shape, points: shape.points.map((point) => ({ ...point })) }
    : { ...shape }
}

function scaleShape(shape, factor) {
  if (shape.type === 'circle') return { type: 'circle', radius: shape.radius * factor }
  if (shape.type === 'ellipse') {
    return { type: 'ellipse', radiusX: shape.radiusX * factor, radiusY: shape.radiusY * factor }
  }
  if (shape.type === 'polygon') {
    return { ...copyShape(shape), width: shape.width * factor, height: shape.height * factor }
  }
  return { type: 'rect', width: shape.width * factor, height: shape.height * factor }
}

function validateCommon(article, layout) {
  exactKeys(article, ['text'], 'Article')
  if (typeof article.text !== 'string') fail('Article text must be a string.')
  exactKeys(layout, ['width', 'font', 'lineHeight', 'paragraphGap'], 'Layout')
  if (typeof layout.font !== 'string' || !layout.font.trim()) fail('Layout font must be a CSS font string.')
  return {
    article: { text: article.text },
    layout: {
      width: finite(layout.width, 'Layout width', 160, 820),
      font: layout.font,
      lineHeight: finite(layout.lineHeight, 'Line height', 18, 60),
      paragraphGap: finite(layout.paragraphGap, 'Paragraph gap', 0, 80),
    },
  }
}

function validateEditorial(value) {
  if (!isObject(value)) fail('Editorial context must be an object.')
  const allowedKeys = ['kicker', 'headline', 'deck']
  const unsupported = Object.keys(value).find((key) => !allowedKeys.includes(key))
  if (unsupported) fail(`Editorial context contains unsupported ${unsupported}.`)
  return Object.fromEntries(allowedKeys.flatMap((key) => {
    if (!Object.hasOwn(value, key)) return []
    if (typeof value[key] !== 'string') fail(`Editorial ${key} must be a string.`)
    return [[key, value[key]]]
  }))
}

function validatePosition(position, width, shape) {
  exactKeys(position, ['type', 'x', 'y'], 'Embed position')
  if (position.type !== 'absolute') fail('Embed position must be absolute.')
  const x = finite(position.x, 'Embed x', 0, 100000)
  const y = finite(position.y, 'Embed y', 0, 100000)
  const size = shapeSize(shape)
  if (size.width > width + 0.01 || x > Math.max(0, width - size.width) + 0.01) {
    fail('Embed geometry must fit the layout width.')
  }
  return { type: 'absolute', x, y }
}

function validateLayoutScene(value, version) {
  const rootKeys = version === 1
    ? ['schema', 'version', 'composition', 'article', 'layout', 'embed']
    : ['schema', 'version', 'kind', 'composition', 'article', 'layout', 'embed']
  exactKeys(value, rootKeys, 'Scene')
  if (!COMPOSITIONS.has(value.composition)) fail('Scene composition is not supported.')
  const common = validateCommon(value.article, value.layout)
  const image = version === 2 && isObject(value.embed) && Object.hasOwn(value.embed, 'asset')
  exactKeys(
    value.embed,
    image ? ['id', 'shape', 'margin', 'position', 'asset'] : ['id', 'shape', 'margin', 'position'],
    'Embed',
  )
  if (value.embed.id !== 'studio-embed') fail('Embed id must be studio-embed.')
  const shape = image ? validatePolygon(value.embed.shape) : validatePrimitive(value.embed.shape)
  const embed = {
    id: 'studio-embed',
    shape,
    margin: finite(value.embed.margin, 'Embed margin', 0, 80),
    position: validatePosition(value.embed.position, common.layout.width, shape),
  }
  if (image) {
    exactKeys(
      value.embed.asset,
      ['type', 'requirement', 'alphaThreshold', 'description', 'decorative'],
      'Image asset',
    )
    if (value.embed.asset.type !== 'image' || value.embed.asset.requirement !== 'author-owned') {
      fail('Image assets must be author-owned images.')
    }
    const alphaThreshold = finite(value.embed.asset.alphaThreshold, 'Alpha threshold', 0, 255)
    if (!Number.isInteger(alphaThreshold)) fail('Alpha threshold must be a whole number.')
    if (typeof value.embed.asset.description !== 'string' || value.embed.asset.description.length > 300) {
      fail('Image description must be a string of 300 characters or fewer.')
    }
    if (typeof value.embed.asset.decorative !== 'boolean') fail('Image decorative state must be boolean.')
    if (value.embed.asset.decorative && value.embed.asset.description !== '') {
      fail('Decorative images must have an empty description.')
    }
    if (!value.embed.asset.decorative && !value.embed.asset.description.trim()) {
      fail('A non-decorative image needs a description.')
    }
    embed.asset = {
      type: 'image',
      requirement: 'author-owned',
      alphaThreshold,
      description: value.embed.asset.description,
      decorative: value.embed.asset.decorative,
    }
  }
  return {
    schema: 'pretext-studio.scene',
    version,
    ...(version === 2 ? { kind: 'layout' } : {}),
    composition: value.composition,
    article: common.article,
    layout: common.layout,
    embed,
  }
}

function validateBehaviorScene(value) {
  exactKeys(value, ['schema', 'version', 'kind', 'article', 'layout', 'behavior'], 'Scene')
  const common = validateCommon(value.article, value.layout)
  exactKeys(value.behavior, ['id', 'mode', 'values'], 'Behavior')
  const definition = BEHAVIORS[value.behavior.id]
  if (!definition || value.behavior.mode !== definition.mode) fail('Behavior id and mode do not match.')
  const keys = Object.keys(definition.values)
  exactKeys(value.behavior.values, keys, 'Behavior values')
  const values = Object.fromEntries(keys.map((key) => [
    key,
    finite(
      value.behavior.values[key],
      `${definition.label} ${key}`,
      definition.values[key][0],
      definition.values[key][1],
    ),
  ]))
  return {
    schema: 'pretext-studio.scene',
    version: 2,
    kind: 'textBehavior',
    article: common.article,
    layout: common.layout,
    behavior: { id: value.behavior.id, mode: definition.mode, values },
  }
}

function validateV3LayoutScene(value) {
  exactKeys(
    value,
    ['schema', 'version', 'kind', 'composition', 'article', 'layout', 'embed', 'editorial'],
    'Scene',
  )
  if (value.version !== 3 || value.kind !== 'layout') fail('This is not a version 3 layout scene.')
  const editorial = validateEditorial(value.editorial)
  const { editorial: ignoredEditorial, ...baseScene } = value
  const validated = validateLayoutScene({ ...baseScene, version: 2 }, 2)
  return { ...validated, version: 3, editorial }
}

function validateV3BehaviorScene(value) {
  exactKeys(
    value,
    ['schema', 'version', 'kind', 'article', 'layout', 'behavior', 'editorial'],
    'Scene',
  )
  if (value.version !== 3 || value.kind !== 'textBehavior') {
    fail('This is not a version 3 text-behavior scene.')
  }
  const editorial = validateEditorial(value.editorial)
  const { editorial: ignoredEditorial, ...baseScene } = value
  const validated = validateBehaviorScene({ ...baseScene, version: 2 })
  return { ...validated, version: 3, editorial }
}

export function validateStudioScene(value) {
  if (!isObject(value) || value.schema !== 'pretext-studio.scene') {
    fail('This is not a Pretext Studio scene.')
  }
  if (value.version === 1) return validateLayoutScene(value, 1)
  if (value.version === 2 && value.kind === 'layout') return validateLayoutScene(value, 2)
  if (value.version === 2 && value.kind === 'textBehavior') return validateBehaviorScene(value)
  if (value.version === 3 && value.kind === 'layout') return validateV3LayoutScene(value)
  if (value.version === 3 && value.kind === 'textBehavior') return validateV3BehaviorScene(value)
  fail('Renderer supports Studio version 1, version 2, and version 3 layout or text-behavior scenes.')
}

function visuallyHidden(element) {
  Object.assign(element.style, {
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
}

function primitiveRadius(shape) {
  return shape.type === 'circle' || shape.type === 'ellipse' ? '50%' : '0'
}

function editorialHeader(scene) {
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

function semanticArticleNodes(scene) {
  const nodes = []
  const header = editorialHeader(scene)
  if (header) nodes.push(header)
  scene.article.text.split('\n').forEach((paragraphText) => {
    const paragraph = document.createElement('p')
    paragraph.textContent = paragraphText || ' '
    nodes.push(paragraph)
  })
  return nodes
}

export function mountStudioScene(target, inputScene, options = {}) {
  if (!(target instanceof Element)) throw new TypeError('mountStudioScene needs a target Element.')
  const scene = validateStudioScene(inputScene)
  const kind = scene.version === 1 ? 'layout' : scene.kind
  const imageUrl = typeof options.imageUrl === 'string' && options.imageUrl.trim()
    ? options.imageUrl
    : null
  const root = document.createElement('section')
  const visibleEditorial = editorialHeader(scene)
  const visual = document.createElement('div')
  const source = document.createElement('article')
  const assetDescription = document.createElement('div')
  const controls = document.createElement('div')
  const toggle = document.createElement('button')
  const replay = document.createElement('button')
  const motionStatus = document.createElement('p')
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const runtime = {
    frame: null,
    elapsed: 0,
    lastTimestamp: null,
    cursor: null,
    paused: false,
    reducedOverride: false,
    result: null,
    effect: null,
    characterNodes: [],
    guarded: false,
    width: 0,
    height: 0,
    destroyed: false,
  }

  root.dataset.pretextStudioRenderer = kind
  Object.assign(root.style, {
    position: 'relative',
    display: 'grid',
    gap: '0.75rem',
    width: '100%',
    color: '#17120f',
  })
  visual.setAttribute('aria-hidden', 'true')
  Object.assign(visual.style, {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    userSelect: 'text',
  })
  source.setAttribute('aria-label', options.articleLabel || 'Linear article text')
  source.replaceChildren(...semanticArticleNodes(scene))
  visuallyHidden(source)
  visuallyHidden(assetDescription)
  assetDescription.setAttribute('aria-hidden', 'true')
  controls.setAttribute('role', 'group')
  controls.setAttribute('aria-label', 'Motion controls')
  Object.assign(controls.style, {
    display: kind === 'textBehavior' ? 'flex' : 'none',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
  })
  toggle.type = 'button'
  replay.type = 'button'
  replay.textContent = 'Replay'
  motionStatus.id = `pretext-motion-${Math.random().toString(36).slice(2)}`
  motionStatus.setAttribute('role', 'status')
  toggle.setAttribute('aria-describedby', motionStatus.id)
  replay.setAttribute('aria-describedby', motionStatus.id)
  ;[toggle, replay].forEach((button) => Object.assign(button.style, {
    minHeight: '2.5rem',
    padding: '0.55rem 0.75rem',
    border: '1px solid currentColor',
    borderRadius: '0',
    color: 'inherit',
    background: 'transparent',
    font: '700 0.75rem/1 sans-serif',
    cursor: 'pointer',
  }))
  Object.assign(motionStatus.style, {
    flexBasis: '100%',
    margin: '0',
    font: '0.78rem/1.5 sans-serif',
  })
  controls.append(toggle, replay, motionStatus)
  if (visibleEditorial) {
    visibleEditorial.setAttribute('aria-hidden', 'true')
    Object.assign(visibleEditorial.style, {
      maxWidth: '42rem',
      margin: '0 0 1.25rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(23, 18, 15, 0.28)',
    })
    const [kicker, headline, deck] = [
      scene.editorial.kicker?.trim() ? visibleEditorial.children[0] : null,
      scene.editorial.headline?.trim()
        ? visibleEditorial.querySelector('h1')
        : null,
      scene.editorial.deck?.trim()
        ? visibleEditorial.children[visibleEditorial.children.length - 1]
        : null,
    ]
    if (kicker) Object.assign(kicker.style, { margin: '0 0 0.5rem', font: '700 0.72rem/1.3 sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' })
    if (headline) Object.assign(headline.style, { margin: '0', font: '400 clamp(2rem, 6vw, 4rem)/0.98 Baskerville, Georgia, serif' })
    if (deck) Object.assign(deck.style, { margin: '0.8rem 0 0', font: '1rem/1.5 Baskerville, Georgia, serif' })
    root.append(visibleEditorial)
  }
  root.append(visual, controls, source, assetDescription)
  target.replaceChildren(root)

  function availableWidth() {
    const measured = Math.floor(target.getBoundingClientRect().width)
    return Math.max(1, Math.min(scene.layout.width, measured || scene.layout.width))
  }

  function stopLoop() {
    if (runtime.frame !== null) cancelAnimationFrame(runtime.frame)
    runtime.frame = null
    runtime.lastTimestamp = null
  }

  function behaviorCanRun() {
    if (kind !== 'textBehavior' || runtime.guarded || runtime.paused) return false
    if (reducedQuery.matches && !runtime.reducedOverride) return false
    return scene.behavior.mode === 'continuous' || runtime.cursor !== null
  }

  function paintBehavior() {
    if (runtime.guarded || !runtime.result || !runtime.effect) return
    const transforms = applyEffects(runtime.result, [runtime.effect], {
      time: runtime.elapsed,
      cursor: runtime.cursor,
      width: runtime.width,
      height: runtime.height,
    })
    runtime.characterNodes.forEach((lineNodes, lineIndex) => {
      lineNodes.forEach((element, characterIndex) => {
        const transform = transforms[lineIndex][characterIndex]
        element.style.opacity = String(transform.opacity)
        element.style.transform = `translate3d(${transform.dx}px, ${transform.dy}px, 0) rotate(${transform.rotation}rad) scale(${transform.scale})`
      })
    })
  }

  function tick(timestamp) {
    runtime.frame = null
    if (!behaviorCanRun()) return
    if (runtime.lastTimestamp !== null) {
      runtime.elapsed += Math.min(100, timestamp - runtime.lastTimestamp)
    }
    runtime.lastTimestamp = timestamp
    paintBehavior()
    runtime.frame = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (!behaviorCanRun() || runtime.frame !== null) return
    runtime.lastTimestamp = null
    runtime.frame = requestAnimationFrame(tick)
  }

  function updateMotionControls() {
    if (kind !== 'textBehavior') return
    toggle.disabled = runtime.guarded
    replay.disabled = runtime.guarded
    if (runtime.guarded) {
      toggle.textContent = 'Motion unavailable'
      motionStatus.textContent = `Animation paused: ${[...scene.article.text].length} characters exceed the 1,500-character guard. The article remains readable.`
    } else if (reducedQuery.matches && !runtime.reducedOverride) {
      toggle.textContent = 'Preview motion'
      motionStatus.textContent = 'Reduced motion is active. Motion starts only after a deliberate preview.'
    } else if (runtime.paused) {
      toggle.textContent = 'Resume motion'
      motionStatus.textContent = 'Motion is paused at the current frame.'
    } else if (scene.behavior.mode === 'pointer' && !runtime.cursor) {
      toggle.textContent = 'Pause motion'
      motionStatus.textContent = 'Move the pointer inside the reading surface to preview the ripple.'
    } else {
      toggle.textContent = 'Pause motion'
      motionStatus.textContent = scene.behavior.mode === 'pointer'
        ? 'Pointer ripple is responding across its spatial radius.'
        : `${BEHAVIORS[scene.behavior.id].label} is running.`
    }
  }

  function renderLayout() {
    stopLoop()
    const width = availableWidth()
    const originalShape = copyShape(scene.embed.shape)
    const originalSize = shapeSize(originalShape)
    const shape = originalSize.width > width
      ? scaleShape(originalShape, width / originalSize.width)
      : originalShape
    const size = shapeSize(shape)
    const ratio = width < scene.layout.width ? width / scene.layout.width : 1
    const position = {
      type: 'absolute',
      x: Math.min(scene.embed.position.x * ratio, Math.max(0, width - size.width)),
      y: scene.embed.position.y,
    }
    const liveEmbed = { ...scene.embed, shape, position }
    const result = flowLayout({
      text: scene.article.text,
      font: scene.layout.font,
      width,
      lineHeight: scene.layout.lineHeight,
      paragraphGap: scene.layout.paragraphGap,
      embeds: [liveEmbed],
    })
    const resolved = result.embeds.find((embed) => embed.id === scene.embed.id)
    const height = Math.max(
      result.height,
      resolved ? resolved.rect.y + resolved.rect.height + scene.layout.lineHeight : 0,
      scene.layout.lineHeight,
    )
    runtime.width = width
    runtime.height = height
    Object.assign(visual.style, { width: `${width}px`, maxWidth: '100%', height: `${height}px` })
    const children = result.lines.map((line) => {
      const element = document.createElement('span')
      element.textContent = line.text
      Object.assign(element.style, {
        position: 'absolute',
        left: `${line.x}px`,
        top: `${line.y}px`,
        display: 'block',
        color: '#17120f',
        font: scene.layout.font,
        lineHeight: `${scene.layout.lineHeight}px`,
        whiteSpace: 'pre',
        userSelect: 'text',
      })
      return element
    })
    if (resolved) {
      const embed = document.createElement('div')
      Object.assign(embed.style, {
        position: 'absolute',
        left: `${resolved.rect.x}px`,
        top: `${resolved.rect.y}px`,
        width: `${resolved.rect.width}px`,
        height: `${resolved.rect.height}px`,
        overflow: 'hidden',
        border: '1px solid #c8391a',
        borderRadius: primitiveRadius(shape),
        background: shape.type === 'polygon' ? '#e9e2d7' : '#5a1f18',
        pointerEvents: 'none',
      })
      if (scene.embed.asset) {
        embed.style.clipPath = `polygon(${shape.points.map((point) => `${point.x * 100}% ${point.y * 100}%`).join(', ')})`
        embed.setAttribute('aria-hidden', 'true')
        if (scene.embed.asset.decorative) {
          assetDescription.removeAttribute('role')
          assetDescription.removeAttribute('aria-label')
          assetDescription.setAttribute('aria-hidden', 'true')
        } else {
          assetDescription.setAttribute('role', 'img')
          assetDescription.setAttribute('aria-label', scene.embed.asset.description)
          assetDescription.removeAttribute('aria-hidden')
        }
        if (imageUrl) {
          const image = document.createElement('img')
          image.src = imageUrl
          image.alt = ''
          image.setAttribute('aria-hidden', 'true')
          Object.assign(image.style, { width: '100%', height: '100%', objectFit: 'contain' })
          embed.appendChild(image)
        } else {
          const placeholder = document.createElement('span')
          placeholder.textContent = 'Supply author image'
          Object.assign(placeholder.style, {
            position: 'absolute',
            inset: '0',
            display: 'grid',
            placeItems: 'center',
            color: '#5a1f18',
            font: '700 0.65rem/1.3 sans-serif',
            textTransform: 'uppercase',
          })
          embed.appendChild(placeholder)
        }
      } else {
        embed.setAttribute('aria-hidden', 'true')
      }
      children.push(embed)
    }
    visual.replaceChildren(...children)
  }

  function renderBehavior() {
    stopLoop()
    const width = availableWidth()
    const result = flowLayout({
      text: scene.article.text,
      font: scene.layout.font,
      width,
      lineHeight: scene.layout.lineHeight,
      paragraphGap: scene.layout.paragraphGap,
      embeds: [],
      characterPositions: true,
    })
    const height = Math.max(result.height, scene.layout.lineHeight)
    runtime.width = width
    runtime.height = height
    runtime.result = result
    runtime.effect = BEHAVIORS[scene.behavior.id].factory(scene.behavior.values)
    runtime.guarded = [...scene.article.text].length > TEXT_LIMIT
    runtime.characterNodes = []
    Object.assign(visual.style, { width: `${width}px`, maxWidth: '100%', height: `${height}px` })
    if (runtime.guarded) {
      visual.replaceChildren(...result.lines.map((line) => {
        const element = document.createElement('span')
        element.textContent = line.text
        Object.assign(element.style, {
          position: 'absolute', left: `${line.x}px`, top: `${line.y}px`, display: 'block',
          color: '#17120f', font: scene.layout.font,
          lineHeight: `${scene.layout.lineHeight}px`, whiteSpace: 'pre', userSelect: 'text',
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
            position: 'absolute', left: `${character.x}px`, top: `${line.y}px`,
            display: 'block', width: `${character.width}px`, color: '#17120f',
            font: scene.layout.font, lineHeight: `${scene.layout.lineHeight}px`,
            whiteSpace: 'pre', userSelect: 'text', transformOrigin: '50% 50%',
          })
          lineNodes.push(element)
          nodes.push(element)
        })
        runtime.characterNodes.push(lineNodes)
      })
      visual.replaceChildren(...nodes)
    }
    paintBehavior()
    updateMotionControls()
    startLoop()
  }

  function render() {
    if (runtime.destroyed) return
    if (kind === 'textBehavior') renderBehavior()
    else renderLayout()
  }

  function pause() {
    if (kind !== 'textBehavior' || runtime.guarded) return
    runtime.paused = true
    stopLoop()
    updateMotionControls()
  }

  function resume() {
    if (kind !== 'textBehavior' || runtime.guarded) return
    runtime.paused = false
    if (reducedQuery.matches) runtime.reducedOverride = true
    paintBehavior()
    startLoop()
    updateMotionControls()
  }

  function replayMotion() {
    if (kind !== 'textBehavior' || runtime.guarded) return
    runtime.elapsed = 0
    runtime.paused = false
    if (reducedQuery.matches) runtime.reducedOverride = true
    paintBehavior()
    startLoop()
    updateMotionControls()
  }

  function handlePointerMove(event) {
    if (kind !== 'textBehavior' || scene.behavior.mode !== 'pointer' || runtime.guarded) return
    const rect = visual.getBoundingClientRect()
    runtime.cursor = {
      x: (event.clientX - rect.left) * runtime.width / rect.width,
      y: (event.clientY - rect.top) * runtime.height / rect.height,
    }
    if (!runtime.paused && (!reducedQuery.matches || runtime.reducedOverride)) {
      paintBehavior()
      startLoop()
    }
    updateMotionControls()
  }

  function clearPointer() {
    if (kind !== 'textBehavior' || scene.behavior.mode !== 'pointer') return
    runtime.cursor = null
    paintBehavior()
    stopLoop()
    updateMotionControls()
  }

  function handleReducedMotionChange() {
    runtime.reducedOverride = false
    stopLoop()
    paintBehavior()
    updateMotionControls()
    startLoop()
  }

  function handleVisibility() {
    if (document.hidden) stopLoop()
    else startLoop()
  }

  toggle.addEventListener('click', () => {
    if (runtime.guarded) return
    if (reducedQuery.matches && !runtime.reducedOverride) resume()
    else if (runtime.paused) resume()
    else pause()
  })
  replay.addEventListener('click', replayMotion)
  visual.addEventListener('pointermove', handlePointerMove)
  visual.addEventListener('pointerleave', clearPointer)
  visual.addEventListener('pointercancel', clearPointer)
  reducedQuery.addEventListener('change', handleReducedMotionChange)
  document.addEventListener('visibilitychange', handleVisibility)
  const resizeObserver = new ResizeObserver(() => {
    if (Math.abs(availableWidth() - runtime.width) >= 1) render()
  })
  resizeObserver.observe(target)
  render()

  return {
    scene: JSON.parse(JSON.stringify(scene)),
    pause,
    resume,
    replay: replayMotion,
    destroy() {
      if (runtime.destroyed) return
      runtime.destroyed = true
      stopLoop()
      resizeObserver.disconnect()
      visual.removeEventListener('pointermove', handlePointerMove)
      visual.removeEventListener('pointerleave', clearPointer)
      visual.removeEventListener('pointercancel', clearPointer)
      reducedQuery.removeEventListener('change', handleReducedMotionChange)
      document.removeEventListener('visibilitychange', handleVisibility)
      root.remove()
    },
  }
}
