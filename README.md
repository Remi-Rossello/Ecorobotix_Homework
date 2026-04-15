# Welcome to AgriWatch !

AgriWatch is a digital platform used by cooperative farms across West
Europe to monitor weather conditions and plan agricultural activities.
Field agents rely on the platform daily to decide when to sow, irrigate, or
harvest.

Features:
- Search any location to see its current and forecasted weather up to 7 days in advance.
- Sign up to save/delete locations in your dashboard, and mark your default location.
- Choose and save your preferred temperature units and dark/light mode.
- The app is easily accessible from PCs, phones, or tablets.
- You can log out or delete your account and all its data at any time.
- Sessions otherwise stay open even if you turn off your device. No signing in every time !



## Tech Stack

| Layer     | Technology                                           |
| --------- | ---------------------------------------------------- |
| Frontend  | React 19, Vite 6, Lucide icons                      |
| Backend   | Express 4, Node.js 22 LTS                           |
| Database  | SQLite via better-sqlite3                          |
| Auth      | bcryptjs + JSON Web Tokens (7-day expiry)            |
| APIs      | Open-Meteo (weather/forecast), Photon (search/geocoding)    |
| Testing   | Vitest, jest-dom for Frontend, supertest for Backend        |
| Monorepo  | npm workspaces + concurrently                        |

## Getting Started

### Prerequisites

- **Node.js 22 LTS**: This is needed for prebuilt `better-sqlite3` binaries. Without it, the installation of dependencies can take a very long time and cause issues.
  If you use [nvm](https://github.com/nvm-sh/nvm), the `.nvmrc` file pins the version:
  ```bash
  nvm install   # reads .nvmrc → installs Node 22
  nvm use        # activates it
  ```

- **Environment file**: The server needs a `.env` file for configuration (JWT secret, port, DB path). A template is provided; run this once to create your local copy:
  ```bash
  npm run setup:env    # copies .env.example → .env (won't overwrite existing)
  ```
  You can then edit `packages/server/.env` to change any values before starting the app.
  Changing JWT_SECRET to a real password is recommended.


### Install & Run

This codebase uses a monorepo. Workspaces make it possible to install dependencies with a single terminal command at the root. Likewise, the "concurrently" tool starts both the frontend and backend processes in the same terminal, also with a single command at the root.

```bash
npm install          # installs all workspace dependencies
npm run dev          # starts server (port 3001) + client (port 5173)
```
The website can now be opened at <http://localhost:5173>. You can start by signing up at the top-right corner. Enjoy !

### Other Commands

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm test`            | Run all tests (server + client)             |
| `npm run test:server` | Server tests only                           |
| `npm run test:client` | Client tests only                           |
| `npm run build`       | Production build of the client              |
| `npm start`           | Start the server in production mode         |

### Environment

The server reads a `.env` file in `packages/server/`:

| Variable     | Default                                | Purpose                 |
| ------------ | -------------------------------------- | ----------------------- |
| `PORT`       | `3001`                                 | HTTP server port        |
| `JWT_SECRET` | `agriwatch-secret-key-change-in-production` | Token signing key  |
| `DB_PATH`    | `./data/agriwatch.db`                  | SQLite database file    |

A `.env.example` is provided. Copy it and adjust before deploying, as explained in the Prerequisite.

## Project Structure

```
packages/
├── server/
│   ├── src/
│   │   ├── index.js            # Express app entry
│   │   ├── db/database.js      # SQLite schema & singleton
│   │   ├── middleware/auth.js   # JWT verification
│   │   └── routes/
│   │       ├── auth.js          # Register / login
│   │       ├── user.js          # Preferences, delete account
│   │       ├── locations.js     # Saved locations CRUD
│   │       └── weather.js       # Proxy to Open-Meteo & Photon
│   └── tests/
│       ├── database.test.js     # Schema, constraints, cascade
│       └── routes.test.js       # Auth, locations, preferences, delete account
└── client/
    ├── src/
    │   ├── App.jsx              # Auth gate + Dashboard
    │   ├── api.js               # Fetch wrappers for every endpoint
    │   ├── context/AuthContext.jsx
    │   ├── utils/weather.js     # WMO code mapping, temp formatting
    │   └── components/
    │       ├── AuthPage.jsx     # Login / register modal
    │       ├── Dashboard.jsx    # Main layout + tab routing
    │       ├── Header.jsx       # Navigation + account menu
    │       ├── Sidebar.jsx      # Saved locations + inline settings
    │       ├── SearchBar.jsx    # Debounced geocoding search
    │       ├── WeatherCard.jsx  # Current conditions
    │       ├── ForecastPanel.jsx # 7-day forecast grid
    │       ├── SavedLocationsTab.jsx # Saved locations list tab
    │       ├── SettingsTab.jsx  # Preferences + delete account
    │       └── Toast.jsx        # Success notification overlay
    └── tests/
        ├── weather.test.js      # Pure utility tests
        ├── AuthPage.test.jsx    # Render, toggle & corner cases
        ├── SearchBar.test.jsx   # Input & clear tests
        └── SettingsTab.test.jsx # Delete account UI & edge cases
```

## Architecture Decisions

### Frontend: React, Vite, Vitest, jest-dom

The Frontend is written in React and runs on Vite.

Compared to older tools used to run frontends like Webpack, Vite offers the same functionnalities while being simpler to setup and faster (as the name implies in French). The speed advantage holds both during startup and Hot Module Replacement, allowing for faster design iterations.

React is becoming an industry standard in web development, is well-supported by Vite, and is the JS framework I am most familiar with, reducing the likelihood of errors.

Testing: Vitest is used for testing as it works well and is naturally designed to operate with Vite. The jest-dom module makes it much easier to write and read tests by providing matchers specifically designed for the frontend DOM, such as ".toBeInTheDocument()" or ".toBeVisible()".

### Backend: Express, Vitest, supertest

For the backend server, I use the Express library because it is simple, well known, and in particular it is the one I know and am confortable with. It "does the job" perfectly fine while being simple to understand and fast. Switching to a newer tool can be envisionned in the future.

Testing: Vitest is also used, to be homogeneous with the frontend and make the architecture simpler and easier to manage and run. The supertest module and its "require" function complement this by allowing faster server startup for tests.

### Database: SQLite, better-sqlite3, prisma

I seeked the simplest solution that would satisfy the needs of this app. SQLite was the perfect choice. 

Its limitations are mainly: database size (as everything is written locally to disk), high number of concurrent writting (as the whole database is locked for every write operation), and security features. None of these three issues are currently a problem for our little app. Security of user passwords is already provided with hashing, JWT tokens and secret. Furthermore, the file-based nature of SQLite makes everything a lot simpler to design, run, and test, which is why I used it.

Similarly, the `better-sqlite3` module is simpler because it is synchronous. For SQLite, this also means faster, as asynchronicity creates context switching overheads for example, and as we said, concurrency is not a critical issue for this app.

Prisma was used to migrate the database to a system where user preferences are stored in a json string in a single SQLite column, instead of multiple columns, allowing for easier addition of settings such as dark/light mode without changing the whole database structure.

### Search and weather APIs

Photon API is used for the search feature and geocoding (going from name to latitudes/longitudes). Open-Meteo API is used to get weather forecasts from these geocoded informations. Both APIs are free, and don't require any kind of keys or registration. 

Note: calling them directly from the browser would expose the request origin and hit CORS restrictions. Calling them from the backend solves this.

### Monorepo

The project has only two packages. npm workspaces give shared `node_modules`, a single lock file, and coordinated scripts without adding Turborepo / Nx overhead. `concurrently` handles parallel dev servers. This organisation is the simplest yet most functional middle ground between no monorepo at all, and using a profesionnal tool. 

### Authentication and security

The authentication features for this web app must combine simplicity with security. I thus used the simplest tech that provided good security. That is why the bcryptjs module is used to hash user passwords before storing them in the database. Additional UI features like "no password shorter than 6 characters" are used. More security features should be implemented as more users begin to use the app.

Another good feature is to create sessions during which the user stays logged in even if the app is closed and re-opened. The easiest way to do that is to give the browser a "pass" on login, that it can present to the server when the app is reoened. The pass must thus persist in the browser. The easiest and most standard way to do *that* while making sure it is not possible for a user to create a pass and login to another account, is precisely to use JSON Web Tokens, with a secret key used to check and generate them stored by the server.

Note: Tokens expire in 7 days only if the browser tab stays closed or opened for 7 days. Otherwise, the 7 day expiry deadline refreshes every time the user goes back to the app.

### UI Design

The interface is designed to be simple yet intuitive and useful, with a white/light-green palette in light mode, similar to Ecorobotix's esthetics, and also a dark mode.

Core functionnalities are designed to visible and recognisable immediately. The Search tab is the primary interaction on the dashboard, dislaying the current weather forecast of a default location chosen by the user. The Saved Locations tab displays all the saved locations at once, in a grid pattern, and marks the default with a star. Clicking on these cards will revert back to the Search tab and display the forecasts. Forecasts can be expanded for more informations such as UV index or humidity.

The remaining functionnalities are in the Settings tab, incuding deleting one's account, and in the account button at the top-right corner, with toast notifications on sign up/sign in and delete account.

## Improvement ideas

### Speed, security, & correctness
1. **Caching for speed and offline support**: Store the latest weather response per location with a TTL, avoiding redundant Open-Meteo calls when revisiting a saved spot.
2. **Rate limiting & input sanitisation middleware**: `express-rate-limit` for auth routes, and stricter server-side validation for all user inputs.
3. **Testing**: End-to-end and integration tests, including automated browser tests for the full login → search → save → view flow.

### UI and new features

1. **Farming advice**: Attach specific crops to saved locations, and get advice on sowing, irrigation, harvesting, pest control, etc, based on the current weather and the nature of the crops at that location. Use of visual symbols as much as possible to instantly see what has to be done.
2. **Complete weather visualisation**: See the weather of each location directly in the location cards of the dashboard, without clicking on them one by one. This may reduce speed but would be a great UI.
3. **Map view**: Using a map API to show saved locations as pins, with popup weather summaries.
4. **Accessibility audit**: Screen reader testing, keyboard navigation for the tabs and settings.