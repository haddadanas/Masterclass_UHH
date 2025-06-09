const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./ts/ispy.ts", // Your main TypeScript entry point
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
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
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "libs",
          chunks: "all",
        },
        common: {
          test: /[\\/]ts[\\/]/,
          name: "main",
          chunks: "all",
        },
      },
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      buffer: false, // Disable buffer polyfill
      stream: false, // Disable stream polyfill
      assert: false, // Disable assert polyfill
    },
  },
  output: {
    filename: "masterclass_[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map", // Enable source maps for easier debugging
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 8080,
    hot: true, // Enable Hot Module Replacement
  },
};