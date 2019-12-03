# Builder

Simple JavaScript builder.

Expects to find an `index.html` file in your `src/` folder 
and will bundle any JS and CSS files it finds automatically.
Uses Rollup, TailwindCSS, and PostCSS under the hood.

### Installation

Install as a dev dependency in your project:

    npm install --save-dev @darrenmothersele/builder

### Usage

    builder src/main.js
    
Or, for development mode:

    builder --dev src/main.js
    
Development mode will watch source files and rebuild on changes.
It will serve the site locally using Browser Sync.
Development mode also disables some build-time optimisations such as
minification and PurgeCSS.
