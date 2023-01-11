const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	mode: 'production',
	entry: {
		'canvas-capture': './src/index.ts',
		'canvas-capture.min': './src/index.ts',
	},
	performance: {
		hints: false,
	},
	optimization: {
		minimizer: [new UglifyJsPlugin({
			sourceMap: true,
			include: /\.min\.js$/,
		})],
	},
	plugins: [
		new CopyPlugin({
		  patterns: [
			{ from: "src/CCapture.js/CCapture.d.ts", to: "@types/CCapture.js/" },
		  ],
		}),
	],
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.ts', '.js' ],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		library: 'CanvasCapture',
		libraryTarget: "umd",
		clean: true,
	},
};