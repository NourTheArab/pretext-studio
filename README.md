# Pretext Studio

Pretext Studio is a browser workbench for composing real, selectable text that can make room for an object, respond to a reader, or guide a reading pace. When a scene feels right, its author can keep a portable configuration and publish it on a site they control.

Live demo: https://nourthearab.com/pretext-studio/

## Run locally

This is a static site. It must be served over HTTP(S), not opened through `file://`.

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

No account, build step, or installation is required for the Studio demo. The app includes its browser-ready `pretext-flow` build under `dist/` and resolves its exact peer dependency, `@chenglou/pretext@0.0.8`, through a pinned ESM import map.

## What to try

1. Move through the welcome examples: Flow, Elements, and Artemis II.
2. Choose **Make a design**, write or paste a passage, and choose whether it should make room, move with a behavior, or become a reading surface.
3. Adjust the scene, including an author image if desired.
4. Choose **Take it with you** to copy or download a portable scene and publication example.
5. Paste a scene back into Studio to verify the round trip.

The preferred publication route is DOM rendering because text remains semantic and selectable. Canvas is an advanced alternative with an explicit text fallback, not a visual replacement for the DOM route.

## Portable scene boundary

Exports include editable scene inputs, normalized image-hull geometry, display dimensions, and author-provided asset and accessibility metadata. They never include local file paths, file names, image bytes, blobs, data URIs, DOM state, resolved lines, cursor state, or time state. An author hosts their own image asset when publishing.

## Project lineage

Studio is a new Build Week project built on `pretext-flow`, Nour Al-Sheikh's separately maintained library, which itself builds on `@chenglou/pretext`. Studio does not replace either project. It makes the capability explorable by authors, designers, educators, and creative developers before they write a custom integration.

## How it was made

Nour set the product direction, portability contract, use cases, visual decisions, and final acceptance criteria. Codex and GPT-5.6 were used as implementation and verification partners: they helped translate those decisions into the working product, preserve the technical limits of the layout runtime, and test the authoring and publication paths.

Claude supported independent design exploration of the human-facing experience and information hierarchy. It did not modify source code or make technical completion decisions.

## License and notices

The included `pretext-flow` build is MIT licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for library and font notices.
