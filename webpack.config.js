const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // Dynamically set entry points for all .ts files in the ts folder
  entry: "./js/ispy.js",
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Path to your HTML file
      inject: 'head', // Inject scripts into the <head>
      filename: '../../index.html', // Output file in the dist folder
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "node_modules/jquery/dist/jquery.min.js",
          to: "jquery.min.js",
        },
        {
          from: "node_modules/stupid-table-plugin/stupidtable.min.js",
          to: "stupidtable.min.js",
        },
        {
          from: "node_modules/jquery.scrollintoview/jquery.scrollintoview.js",
          to: "jquery.scrollintoview.js",
        },
      ],
    }),
  ],
  output: {
    filename: "masterclass_[name].js", // Output each file with its name
    path: path.resolve(__dirname, "dist/assets/js/"),
  },
  // devtool: "source-map",
  // devServer: {
  //   static: {
  //     directory: path.join(__dirname, "dist"),
  //   },
  //   compress: true,
  //   port: 8080,
  //   hot: true,
  // },
};