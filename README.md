# Vite boilerplate for vanilla-js/SCSS multi-pages websites

Very simple boilerplate for static sites that I use for my projects using [Vite 6](https://vite.dev/).


<br>

## Features

- You can choose to exclude assets from the build in the case you externalize them (I do). It keeps the same path as when you import them from the `./dev/assets/` folder.
- All pages (`index.html`) under the `./dev/` folder are automatically processed.
- Hot module replacement (live reload in dev mode).
- You have the possiblity to also build for `development` in the `./build/development/` folder (no minification, separate from the real `production` build in `./build/production/`).

<br>

> Vite Plugins :
> - [html-inject](https://github.com/donnikitos/vite-plugin-html-inject) : inject smaller html partitions into html files with a `<import-html src="import/html/<partition>.html" />` tag anywhere in your html pages.
> - <u>html-insert-to-all-pages</u> (Custom made) : will let you add any string you like in all html pages, anywhere with Regex. Useful for repeatable content like in the `head` or `noscript`.<br>*Added functionnality* : add `%dirdepth%` in the insert string to get the relative depth from root (`../`).

> PostCSS :
> - [inline-svg](https://github.com/TrySound/postcss-inline-svg) : inline SVG with attributes.
> - [svgo](https://github.com/cssnano/cssnano/tree/master/packages/postcss-svgo) : inlined SVG optimization.
> - [nested](https://github.com/postcss/postcss-nested) : CSS properties nesting like Sass.
> - [preset-env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env) & [autoprefixer](https://github.com/postcss/autoprefixer) : next-gen CSS features for old-gen browsers, and multi-browser support.
> - [easing-gradients](https://github.com/larsenwork/postcss-easing-gradients) : interpolation for CSS ~~linear~~-gradients.
> - [short](https://github.com/csstools/postcss-short) : smooth advanced shorthands properties in CSS.
> - [viewport-height-correction](https://github.com/Faisal-Manzer/postcss-viewport-height-correction) : 100vh now fits mobile browsers viewport.

> Added content :
> - CSS reset
> - noscript screen
> - themed favicon example

<br>

### Useful commands

To get started, install the packages.
```
npm i
```

<br>

Run dev local server. Access it at [http://localhost:8888/](http://localhost:8888/). Type `o` in the terminal to open automatically.
```
npm run dev
```


<br>

Build for production.
```
npm run build
```

<br>

Build for development.
```
npm run builddev
```

<br>

Preview your build.
```
npm run preview
```

<br>

Preview your dev build.
```
npm run previewdev
```


<br>

## Site Folder Structure

### dev environment
```
/
├── README.md
├── .gitignore
├── package.json
├── [...files]
│
├── config/
│   └── paths.js
│   └── vite.config.js
│
├── (node_modules)/
│   └── [...files]
│
├── (build)/
│   └── [...files]
│
└── dev
    ├── index.html
    ├── main.(css|scss)
    ├── main.js
    │
    ├── assets/
    │   ├── [...files]
    │   │
    │   ├── favicons/
    │   │   └── [...files]
    │   │
    │   ├── fonts/
    │   │   └── [...files]
    │   │
    │   └── medias/
    │       └── [...files]
    │
    ├── import/
    │   ├── data/
    │   │   └── [...files]
    │   │
    │   ├── dependencies/
    │   │   └── [...files]
    │   │
    │   ├── html/
    │   │   └── [...files]
    │   │
    │   ├── scripts/
    │   │   └── [...files]
    │   │
    │   └── styles/
    │       ├── fonts.scss
    │       ├── noscript-error.scss
    │       ├── reset.scss
    │       ├── styles-outline.scss
    │       ├── styles-system.scss
    │       └── [...files]
    │
    └── [...pages]/
        └── index.html
```

<br>

### bundled
```
build/(production|development)/
├── index.html
├── bundle-[hash].css
├── bundle-[hash].js
│
├── [...pages]/
│   └── index.html
│
└── assets/
    └── [...files]
```