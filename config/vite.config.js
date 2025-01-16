import { defineConfig } from "vite";


// OPTIONS
import PATHS from "./paths.js"

let OPTIONS = {
	buildWithAssets : true,

	doMinify : {
		"production" : "esbuild",
		"development" : false
	},
	doMinifyCSS : {
		"production" : "esbuild",
		"development" : false
	},
	buildDir : {
		"production" : PATHS.buildProd,
		"development" : PATHS.buildDev
	},
}

const bundleMoreFiles = {
	// "styles-system" : PATHS.dev +"/import/styles/styles-system.scss",
	// "styles-outline" : PATHS.dev +"/import/styles/styles-outline.scss",
}


// PLUGINS
import injectHTML from "vite-plugin-html-inject";
// TODO static copy plugin

// postcss
import postcssInlineSvg from "postcss-inline-svg";
import svgo from "postcss-svgo"
import postcssNested from "postcss-nested"
import postcssPresetEnv from "postcss-preset-env"
import postcssEasingGradients from "postcss-easing-gradients";
import postcssShort from "postcss-short";
import postcssViewportHeightCorrection from "postcss-viewport-height-correction"; // [POSTCSS WARNING] https://github.com/Faisal-Manzer/postcss-viewport-height-correction/issues/18


// MOVE SCRIPT TAG TO BODY END
const scriptToBodyEnd = () => {
	return {
		name: "scriptToBodyEnd",
		transformIndexHtml(html) {
			let scriptTag = html.match(/^.*<script[^>]*>(.*?)<\/script[^>]*>/gm)[0];
			html = html.replaceAll(scriptTag, "");

			scriptTag = scriptTag.replaceAll(` type="module" crossorigin`, "");
			html = html.replaceAll("</body>", scriptTag + `\n</body>`);

			return html;
		},
	};
};


// INSERT HTML TO ALL PAGES
const insertToAllPagesHTML = (partitions, enforceOrder = "pre") => {
	/* VARIABLES
	   targetRegex : /<regex.*>/g
	   position : "before"|"after"
	   newLine : boolean
	   forArray : []	-> will not insert anything if empty
	   insert : "<>" 	-> if contains "%dirDepth%", will be replaced with multiple "../" to match directory detph
	   					-> if "forArray" is defined, will repeat through it while replacing %forArray% for each item
	*/
	return {
		name: "insertToAllPagesHTML",
		transformIndexHtml : {
			order: enforceOrder,
			handler(html, ctx) {
				partitions.forEach((part) => {
					part.position = (part.position) ? part.position : "";
					part.newLine = (part.newLine) ? part.newLine : false;
					part.forArray = (part.forArray) ? part.forArray : undefined;

					let insertHTML = part.insert.replaceAll("%dirDepth%", ("../").repeat(((ctx.path.match(/\//g)||[]).length) - 1));

					if (part.forArray) {
						const insertHTML_template = insertHTML;
						insertHTML = "";

						for (let index = 0; index < part.forArray.length; index++) {
							insertHTML += insertHTML_template.replaceAll("%forArray%", part.forArray[index]);
							if (index < part.forArray.length) { insertHTML += (part.newLine) ? `\n` : ""; }
						}
					}

					html.match(part.targetRegex).forEach((targetHTML) => {
						html = html.replaceAll(targetHTML, ""
							+ ((part.position == "after") ? targetHTML + ((part.newLine) ? `\n` : "") : "")
							+ insertHTML
							+ ((part.position == "before") ? targetHTML + ((part.newLine) ? `\n` : "") : "")
						);
					});
				});
				return html;
			},
		},
	};
};


// IGNORE ASSETS HTML
const ignoreAssetsHTML = () => {
	return {
		name: "ignoreAssetsHTML",
		transformIndexHtml : {
			handler(html) {
				html = html.replaceAll(` href=`, " vite-ignore href=");
				html = html.replaceAll(` src=`, " vite-ignore src=");
				return html;
			},
		},
	};
};


// IGNORE ASSETS ROLLUP BUILD
const isAsset = (assetFileNameOriginal) => {
	const regexAssetsDir = new RegExp(`(${PATHS.dirNames.assets}\/)`);
	return regexAssetsDir.test(assetFileNameOriginal);
}

const ignoreAssetsRollup = (buildWithAssets) => {
	if (!buildWithAssets) {
		return {
			name: "ignoreAssetsRollup",
			apply: "build",
			generateBundle: {
				order: "pre",
				handler(options, bundle, isWrite) {
					Object.entries(bundle).forEach((asset) => {
						if (asset[1].type == "asset" && asset[1].originalFileNames.length > 0) {
							if (isAsset(asset[1].originalFileNames[0])) {
								delete bundle[asset[0]]; // do not generate asset
							}
						};
					});
				},
			},
		};
	}
};


// REMOVE VITE HASH UPDATE MARKER IN CSS ASSETS
const removeViteHashUpdateMarker = () => {
	return {
		name: "removeViteHashUpdateMarker",
		apply: "build",
		generateBundle: {
			order: "pre",
			handler(options, bundle, isWrite) {
				// const viteHashUpdateMarker = "/*$vite$:1*/";
				const viteHashUpdateMarkerRE = /\/\*\$vite\$:\d+\*\//;

				Object.entries(bundle).forEach((asset) => {
					if (asset[1].type == "asset" && asset[1].originalFileNames.length > 0) {
						if ((asset[1].originalFileNames[0].endsWith('.css') || asset[1].originalFileNames[0].endsWith('.scss')) && typeof asset[1].source === "string") {
							asset[1].source = asset[1].source.replace(viteHashUpdateMarkerRE, "");
							// console.log("removed viteHashUpdateMarker in :", asset[1].originalFileNames[0]);
						}
					};
				});
			},
		},
	};
}


// CONFIG
export default defineConfig(({ mode }) => {
	OPTIONS.addAssetsToPages = [];
	return {
		publicDir: PATHS.dirNames.devRoot,
		root: PATHS.dirNames.devRoot,
		base : "./",

		server : {
			port: 8888,
			host: true,
		},
		preview : {
			port: 8888,
			host: true,
		},

		build: {
			assetsInlineLimit : 0,
			assetsDir : "",
			emptyOutDir : true,
			copyPublicDir : false,

			outDir: OPTIONS.buildDir[mode],
			minify: OPTIONS.doMinify[mode],
			cssMinify : OPTIONS.doMinifyCSS[mode],

			rollupOptions: {
				input: {
					...PATHS.pages,
					...bundleMoreFiles
				},

				output: {
					entryFileNames: "script-[hash].js",
					chunkFileNames: "script-[hash].js",
					assetFileNames: (assetInfo) => {
						// keep folder structure for assets
						if (assetInfo.originalFileNames.length > 0) {
							if (isAsset(assetInfo.originalFileNames[0])) {
								return assetInfo.originalFileNames[0];
							}
						}

						// ...and for other assets like css files // TOFIX css url() are kept as is so relative paths are broken
						if (assetInfo.originalFileNames.length > 0) {
							console.log(assetInfo);
							OPTIONS.addAssetsToPages.push(assetInfo.originalFileNames[0]);
							return assetInfo.originalFileNames[0];
						}

						// main css
						return "bundle-[hash].[ext]";
					},
				},

				plugins: [
					removeViteHashUpdateMarker(),
				],

				watch: {
					exclude: PATHS.configDirDepth + "node_modules/**",
					include: PATHS.dev + "/**",
				},
			},
		},

		css: {
			transformer: "postcss",
			postcss : {
				plugins: [
					postcssEasingGradients({ // https://github.com/larsenwork/postcss-easing-gradients / https://larsenwork.com/easing-gradients/#editor
						stops: 6,
						alphaDecimals: 3,
						colorMode: "lrgb"
					}),
					postcssInlineSvg({ // https://github.com/TrySound/postcss-inline-svg
						removeFill: true,
						removeStroke: true,
					}),
					svgo({ // https://github.com/cssnano/cssnano/tree/master/packages/postcss-svgo
						params: {
							overrides: {
								removeViewBox: false,
								removeComments: true,
								cleanupNumericValues: {
									floatPrecision: 4
								}
							}
						}
					}),
					postcssNested({ // https://github.com/postcss/postcss-nested
						preserveEmpty: false
					}),
					postcssShort({ // https://github.com/csstools/postcss-short
						skip: "_"
					}),
					postcssViewportHeightCorrection(), // https://github.com/Faisal-Manzer/postcss-viewport-height-correction
					postcssPresetEnv(), // https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env // autoprefixer(), // https://github.com/postcss/autoprefixer
				]
			}
		},

		plugins: [
			{ enforce: "pre", ...insertToAllPagesHTML([
				{
					targetRegex : /<head.*>/g,
					position : "after",
					newLine : true,
					insert : `<import-html src="import/html/head.html" dirdepth="%dirDepth%" />`
				},
				{
					targetRegex : /<body.*>/g,
					position : "after",
					newLine : true,
					insert : `<import-html src="import/html/noscript.html" />`
				},
			]), },
			{ enforce: "pre", ...injectHTML({ tagName: "import-html" }), },

			// ignoreAssetsHTML(),
			ignoreAssetsRollup(OPTIONS.buildWithAssets),

			{ enforce: "post", ...insertToAllPagesHTML([
				{
					targetRegex : /<\/head.*>/g,
					position : "before",
					newLine : true,
					forArray : OPTIONS.addAssetsToPages,
					insert : `<link rel="stylesheet" crossorigin href="%dirDepth%%forArray%">`
				},
			], "post"), },

			//{ enforce: "post", ...scriptToBodyEnd(), }
		],
	}
});