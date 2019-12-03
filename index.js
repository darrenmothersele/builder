#!/usr/bin/env node
const meow = require('meow');
const rollup = require('rollup');
const fs = require('fs');


const cli = meow(`
  Usage
    $ build <input>
  
  Options
    --out,     -o Output file
    --dev,     -d Development mode
`, {
  flags: {
    out: {
      type: 'string',
      alias: 'o',
      default: `${process.cwd()}/public/main.js`
    },
    dev: {
      type: 'boolean',
      alias: 'd',
      default: false
    }
  }
});

if (cli.input.length === 0) {
  cli.showHelp();
  return;
}

const production = !(cli.flags.dev || cli.flags.d);

async function run() {
  console.log('Building...');

  const plugins = [
    require('rollup-plugin-delete')({
      targets: [
        'public/**/*.js*',
        'public/**/*.css*',
        'public/**/*.html*'
      ]
    }),
    require('rollup-plugin-copy')({
      targets: [
        { src: 'src/index.html', dest: 'public/' }
      ]
    }),
    require('rollup-plugin-node-resolve')(),
    require('rollup-plugin-postcss')({
      extract: true,
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        ...production ? [
          require('@fullhuman/postcss-purgecss')({
            // Specify the paths to all of the template files in your project
            content: [
              './src/**/*.html',
              './src/**/*.swig',
              './src/**/*.js',
              // etc.
            ],
            // Include any special characters you're using in this regular expression
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
          }),
          require('cssnano'),
          require('postcss-discard-comments')({removeAll: true})
        ] : []
      ]
    }),
    ...production ? [
      require('rollup-plugin-terser').terser({
        output: {
          comments: false
        }
      })
    ] : []
  ];


  if (!production) {
    const watcher = await rollup.watch({
      input: cli.input[0],
      output: {
        file: cli.flags.out,
        format: 'esm',
        sourcemap: !production
      },
      plugins
    });
    const browserSync = require('browser-sync');
    browserSync({
      server: './public',
      ui: false,
      open: false,
      single: true
    });
    const chokidar = require('chokidar');
    chokidar.watch('src/index.html').on('all', (event) => {
      if (event === 'add' || event === 'change') {
        console.log('index.html file changed, reloading...');
        fs.copyFileSync('src/index.html', 'public/index.html');
        browserSync.reload();
      }
    });
    watcher.on('event', event => {
      // console.log(event);
      if (event.result && event.result.write) {
        console.log('Writing...');
        event.result.write({
          file: cli.flags.out,
          format: 'esm',
          sourcemap: !production
        }).then(() => {
          console.log('Reloading...');
          browserSync.reload();
        });
      }
    });
    return;
  }
  // else, production mode...

  const bundle = await rollup.rollup({
    input: cli.input[0],
    plugins
  });
  await bundle.write({
    file: cli.flags.out,
    format: 'esm',
    sourcemap: !production
  });

}

run().then(() => console.log('Done.'));
