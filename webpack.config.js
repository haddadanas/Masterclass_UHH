const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // Dynamically set entry points for all .ts files in the ts folder
  entry: "./dist/ispy.js",
  mode: "development",
  // module: {
  //   rules: [
  //     {
  //       test: /\.tsx?$/,
  //       use: "ts-loader",
  //       exclude: /node_modules/,
  //     },
  //     {
  //       test: /\.css$/i,
  //       use: [MiniCssExtractPlugin.loader, "style-loader", "css-loader"],
  //     },
  //   ],
  // },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Path to your HTML file
      inject: 'head' // Inject scripts into the <head>
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "node_modules/bootstrap/dist/js/bootstrap.min.js",
          to: "lib/bootstrap.min.js",
        },
        {
          from: "node_modules/jquery/dist/jquery.min.js",
          to: "lib/jquery.min.js",
        },
        {
          from: "node_modules/stupid-table-plugin/stupidtable.min.js",
          to: "lib/stupidtable.min.js",
        },
        {
          from: "node_modules/jquery.scrollintoview/jquery.scrollintoview.js",
          to: "lib/jquery.scrollintoview.js",
        },
      ],
    }),
  ],
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       vendors: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: "libs",
  //         chunks: "all",
  //       },
  //     },
  //   },
  // },
  // resolve: {
  //   extensions: [".tsx", ".ts", ".js"],
  //   fallback: {
  //     buffer: false,
  //     stream: false,
  //     assert: false,
  //   },
  // },
  output: {
    filename: "masterclass_[name].js", // Output each file with its name
    path: path.resolve(__dirname, "dist"),
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