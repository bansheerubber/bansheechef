const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
	watch: true,
	target: "web",
	entry: "./src/client/ts/main.tsx",
	devtool: "inline-source-map",
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/client/index.html",
		}),
		new CopyWebpackPlugin({
			patterns: [{
				from: "./src/client/data/",
				to: "./data/"
			}]
		})
	],
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json", ".css"],
	},
	module: {
    rules: [
			{
        test: /\.css$/i,
        use: ["css-loader"],
			},
			{
				test: /\.tsx?$/,
				use: ["ts-loader"],
				exclude: /node_modules/,
			},
			{
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
    ],
  },
	output: {
		path: path.resolve(__dirname, "./dist/client"),
		filename: "./js/bundle.min.js",
	},
};