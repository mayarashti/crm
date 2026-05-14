# CRM — ניהול קורסים ומשימות

Single-page web application for tracking university courses and related tasks. The interface is **Hebrew (RTL)** and runs entirely in the browser; data is stored in **localStorage** (no backend).

## Features

- **Dashboard** — overview of progress and a grid of courses
- **Course pages** — per-course task lists with priorities and due dates
- **All tasks** — consolidated view with filtering
- **Modals** — add and edit courses and tasks
- **Persistence** — courses and tasks survive page reloads via the browser’s local storage

## Tech stack

- [React 18](https://react.dev/)
- [Vite 6](https://vitejs.dev/)
- [React Router 6](https://reactrouter.com/)
- [Lucide React](https://lucide.dev/) (icons)

## Requirements

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server (with hot reload):

```bash
npm run dev
```

Then open the URL printed in the terminal (typically `http://localhost:5173`).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Vite in development mode   |
| `npm run build`| Production build to `dist/`      |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
  App.jsx              # Routes and app shell
  main.jsx             # React entry
  index.css            # Global styles
  context/AppContext.jsx   # State + localStorage sync
  pages/               # Dashboard, course, all tasks
  components/          # Layout, dashboard, tasks, modals, common
  utils/               # Date and filter helpers
index.html             # HTML shell (RTL, Rubik font)
vite.config.js         # Vite + React plugin
```

## Routes

| Path            | Page        |
|-----------------|-------------|
| `/`             | Dashboard   |
| `/course/:id`   | Course detail |
| `/tasks`        | All tasks   |

## Data storage

State is serialized under these `localStorage` keys:

- `crm_courses` — array of course objects
- `crm_tasks` — array of task objects (linked by `courseId`)

Clearing site data for this origin removes all saved courses and tasks.

## License

Private coursework project (`private` in `package.json`).
