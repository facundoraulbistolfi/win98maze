# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application entry points and game logic. [`src/main.jsx`](/Users/facu/Documents/code/win98maze/src/main.jsx) mounts the app, and [`src/App.jsx`](/Users/facu/Documents/code/win98maze/src/App.jsx) holds the maze rendering, controls, textures, and UI. Put imported runtime assets next to the code that uses them, such as [`src/windows_logo.png`](/Users/facu/Documents/code/win98maze/src/windows_logo.png). Use `public/` for static files served as-is, including SVGs and deploy-safe assets. `dist/` is build output; do not edit it manually.

## Build, Test, and Development Commands
Run `npm install` once to install dependencies. Use `npm run dev` to start the local Vite server, `npm run build` to create the production bundle in `dist/`, and `npm run preview` to smoke-test the built app locally. GitHub Actions also runs `npm run build` on pull requests and deploys `dist/` from `main`, so a clean build is the minimum bar for every change.

## Coding Style & Naming Conventions
This project uses React 18 with Vite and plain `.jsx` files. Prefer functional components, top-level constants for shared configuration, and descriptive names like `TextureMenu`, `generateMaze`, and `makeBrickWall`. Keep component names in PascalCase, helpers in camelCase, and asset filenames lowercase with underscores when imported from code. Match the surrounding file style when editing; avoid unrelated reformatting in [`src/App.jsx`](/Users/facu/Documents/code/win98maze/src/App.jsx), which is currently the main integration file.

## Testing Guidelines
There is no dedicated test framework configured yet. For now, validate changes with `npm run build` plus manual gameplay checks in `npm run dev`, including keyboard movement, mobile controls if touched, texture selection, and minimap behavior. If you add automated tests later, place them under `src/` and name them `*.test.jsx`.

## Commit & Pull Request Guidelines
Recent history follows short Conventional Commit prefixes such as `feat:`, `fix:`, and `ci:`. Keep commit subjects imperative and scoped to one change, for example `fix: restore missing maze texture`. Pull requests should include a brief summary, testing notes, and screenshots or short clips for visible gameplay or UI changes. Link the relevant issue when one exists.

## Assets & Deployment Notes
Prefer optimized images and keep large reference files out of the runtime path unless they are required by the app. GitHub Pages deployment is already configured in `.github/workflows/`, so confirm asset paths work under the built Vite base before merging.
