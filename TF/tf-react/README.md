# Track & Field All-Time Rankings

An interactive data visualization of all-time athletic performance rankings. Features an interactive map showing athlete birthplaces, a histogram displaying performance distributions, and detailed athlete information.

## Features

- 🗺️ **Interactive Map**: View athlete birthplaces on a Leaflet map with marker clustering
- 📊 **Performance Histogram**: Visualize ranking distributions with D3.js
- 🔍 **Athlete Search**: Search for specific athletes
- 📋 **Event Selection**: Browse different track & field events (sprints, distance, field events)
- 📍 **Location Details**: See all performances from a specific location

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PHP** (v8.0 or higher) - for the backend API

## Quick Start

This project requires **two servers** to run: a React development server and a PHP backend server.

### 1. Install Dependencies

```bash
cd tf-react
npm install
```

### 2. Start the PHP Backend Server

Open a terminal and run:

```bash
cd tf-react
php -S localhost:8080
```

This starts the PHP API server on port 8080, which serves athlete data from the `api/` directory.

### 3. Start the React Development Server

Open a **separate terminal** and run:

```bash
cd tf-react
npm start
```

This starts the React app on port 3000.

### 4. Open the Application

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tf-react/
├── api/                    # PHP backend API
│   ├── scraper.php         # Main API endpoint
│   └── cache/              # Cached JSON data for events
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── AthleticsMap    # Leaflet map component
│   │   ├── Histogram       # D3.js histogram
│   │   ├── EventSelector   # Event dropdown
│   │   ├── AthleteSearch   # Search functionality
│   │   └── InfoPanel       # Athlete details panel
│   ├── context/            # React context for state management
│   ├── services/           # API service layer
│   ├── types/              # TypeScript type definitions
│   └── config/             # Configuration constants
└── build/                  # Production build output
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## API Configuration

The React app connects to the PHP backend at `http://localhost:8080/api`. This is configured in:
- `src/services/api.ts` - API base URL
- `src/setupProxy.js` - Development proxy configuration

## Troubleshooting

### "Failed to fetch" Error

This usually means the PHP backend server is not running. Make sure to start it:

```bash
php -S localhost:8080
```

### Port Already in Use

If port 8080 is already in use, find and kill the process:

```bash
lsof -i :8080
kill -9 <PID>
```

### CORS Issues

The PHP backend includes CORS headers. If you still encounter issues, ensure you're accessing the app via `localhost:3000` (not `127.0.0.1`).

## Tech Stack

- **Frontend**: React 19, TypeScript, D3.js, Leaflet
- **Backend**: PHP
- **Mapping**: Leaflet with MarkerCluster plugin
- **Charts**: D3.js
- **Build Tool**: Create React App
