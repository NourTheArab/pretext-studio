# Publish a Pretext Studio scene

Pretext Studio gives you portable scene data. It does not host the scene, its images, or a publishing account. You choose the web host and serve the files from infrastructure you control.

The DOM renderer is the supported publication route. Its visual text remains selectable, and it keeps one semantic article path for assistive technology. Studio also generates an advanced Canvas implementation reference. Canvas does not yet promise feature parity with the DOM renderer; full Canvas parity is future work, and any Canvas publication still needs an equivalent semantic article beside it.

## Files to serve

For direct DOM integration, serve:

- `renderer.js` from this directory;
- the downloaded `pretext-studio.scene.json` file;
- the browser ESM build of `pretext-flow` at the path declared in your import map;
- the `@chenglou/pretext` peer dependency at the exact import-map location you declare;
- every author-owned image referenced at mount time.

For an iframe publication, also serve `embed.html` from an HTTPS URL you control.

Studio self-hosts Source Serif 4 and IBM Plex Mono from the official font projects. If you keep the included font paths, also serve the four WOFF2 files under `assets/fonts/` at the same relative location. Source Serif 4 is Copyright 2014-2023 Adobe with Reserved Font Name “Source”; IBM Plex is Copyright 2017 IBM Corp. with Reserved Font Name “Plex.” Both use the SIL Open Font License 1.1. Keep the official [Source Serif license](https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md) and [IBM Plex license](https://github.com/IBM/plex/blob/master/LICENSE.txt) with any redistributed font files.

The included template maps `pretext-flow` to the repository's `dist/index.js` and maps `@chenglou/pretext` to the pinned `https://esm.sh/@chenglou/pretext@0.0.8` browser module. That means the template is not a fully self-contained bundle: the peer dependency is fetched from that pinned third-party URL. If your publication must be fully self-hosted, place a vetted browser ESM copy of that exact dependency on your own host and change the import map before publishing. A raw scene JSON file or raw npm package file is not a deployable live scene by itself.

## Direct DOM integration

Place the import map before the module that imports the renderer. Adjust every path to match your own deployment.

```html
<script type="importmap">
  {
    "imports": {
      "pretext-flow": "/vendor/pretext-flow/index.js",
      "@chenglou/pretext": "https://esm.sh/@chenglou/pretext@0.0.8"
    }
  }
</script>

<div id="living-article"></div>

<script type="module">
  import { mountStudioScene } from '/pretext/renderer.js'

  const scene = await fetch('/scenes/pretext-studio.scene.json').then((response) => {
    if (!response.ok) throw new Error('The Studio scene could not be loaded.')
    return response.json()
  })

  mountStudioScene(document.querySelector('#living-article'), scene, {
    articleLabel: 'Article text',
    imageUrl: '/assets/author-owned-figure.png'
  })
</script>
```

`mountStudioScene(target, scene, options)` validates Studio version 1, version 2, and version 3 scenes, mounts either a layout or text-behavior scene, and returns a controller with `pause()`, `resume()`, `replay()`, and `destroy()` methods. Text-behavior scenes also receive visible Pause/Resume and Replay controls.

## Optional editorial context

Body-only Studio scenes continue to export in the existing version 2 form. When an author fills at least one editorial field, Studio exports version 3 with an `editorial` object alongside the ordinary layout or text-behavior scene:

```json
{
  "schema": "pretext-studio.scene",
  "version": 3,
  "kind": "textBehavior",
  "article": { "text": "Author-owned body copy." },
  "layout": {
    "width": 620,
    "font": "18px Baskerville, Georgia, serif",
    "lineHeight": 31,
    "paragraphGap": 18
  },
  "behavior": {
    "id": "wave",
    "mode": "continuous",
    "values": { "speed": 1, "amplitude": 3, "frequency": 0.05 }
  },
  "editorial": {
    "kicker": "Field note",
    "headline": "An author-owned heading",
    "deck": "Optional context that travels with the scene."
  }
}
```

`kicker`, `headline`, and `deck` are individually optional strings. The strict version 3 validator rejects other editorial keys. The renderer displays supplied fields before the living text and includes the same heading structure in its semantic article source. Studio labels, preset names, folios, navigation, and helper copy are never inferred or packaged as editorial content. Version 1 and version 2 validation remains unchanged.

Omit `imageUrl` for primitive layouts and text-behavior scenes. If the scene contains `embed.asset`, replace the example path with an HTTPS image you own and serve. The downloaded scene contains the alpha-derived flow hull, display dimensions, threshold, and description/decorative choice; it never contains the original local file, filename, path, bytes, data URL, or `blob:` URL. Use the intended image for that hull and test its aspect and crop in the published page.

## Author-owned iframe page

The included `embed.html` loads one sibling file named `pretext-studio.scene.json` and mounts it through `renderer.js`. It does not contain a built-in demo scene.

To self-host it exactly:

1. Keep `embed.html` and `renderer.js` in the same directory.
2. Put the Studio download beside them as `pretext-studio.scene.json`.
3. Serve the browser ESM build of `pretext-flow` at the path declared in the import map.
4. Keep the pinned `https://esm.sh/@chenglou/pretext@0.0.8` import, or replace it with a separately vetted self-hosted browser ESM build of that exact dependency.
5. Preserve `../assets/fonts/SourceSerif4-Regular.ttf.woff2`, `SourceSerif4-It.ttf.woff2`, and `SourceSerif4-Semibold.ttf.woff2`, or update the three font URLs in `embed.html` to your own equivalent paths.
6. For a scene with an author-owned image hull, add `data-image-url="./your-image.png"` to `<div id="published-scene">` and serve that matching image yourself. Do not put image bytes, a data URL, a blob URL, a local path, or a filename into scene JSON.
7. Serve the directory over HTTPS. Opening `embed.html` directly from disk will not satisfy module and JSON fetch rules.

Keep the declared import map before the module script. The renderer supplies selectable visual DOM text and one semantic article source from the sibling scene.

Embed that page with a title that describes this particular scene, not merely "iframe":

```html
<iframe
  src="https://example.org/pretext/embed.html"
  title="Living Artemis II text scene"
  width="100%"
  height="760"
  loading="lazy"
></iframe>
<p><a href="https://example.org/pretext/embed.html">Open the living Artemis II scene</a></p>
```

Width can usually be responsive. Height is not reliably automatic across hosts, so choose it intentionally for the scene and test the page at narrow widths, enlarged text, and the host's real article width. `760` pixels is only a starting point for the included demonstration. A longer article or constrained column needs more height.

The iframe URL must permit framing. A restrictive `Content-Security-Policy: frame-ancestors` rule or `X-Frame-Options` header will prevent the host page from displaying it.

## Accessibility and fallback

- Keep the iframe's useful, scene-specific `title`.
- Keep the renderer's selectable visual DOM text and its single semantic article source; do not add a second exposed copy of the article.
- Keep author-owned version 3 editorial fields in the semantic header; do not replace them with host or Studio interface labels.
- Keep Pause/Resume and reduced-motion behavior for animated scenes.
- Keep Pointer ripple neutral until a pointer enters and neutral again after it leaves.
- Provide ordinary article text on the host page when a no-script reading path is required, and keep a normal link outside the iframe so the author-owned page remains reachable when embedding fails.
- If you adapt the advanced Canvas implementation generated by Studio, retain its semantic article fallback and image description contract. Treat DOM/Canvas parity as future work, not as a current guarantee.

## Host limits

Direct DOM integration requires a site and account role that allow your JavaScript. The iframe route requires an external HTTPS embed, permissive framing headers, and a height the host will honor. Website builders may remove scripts or iframes because of plan level, editor permissions, or sanitation rules. Template updates can also affect custom code.

These routes are practical, not universal or one-click. Studio does not publish, store, inspect, or update the deployed files. The author remains responsible for the runtime, scene, assets, dependency URLs, host policy, security headers, and future maintenance.
