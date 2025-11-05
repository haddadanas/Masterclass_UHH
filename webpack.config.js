import path from "path";

import HtmlWebpackPlugin from "html-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import webpack from "webpack";

export default async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    optimization: {
      minimize: !dev,
      splitChunks: {
        chunks: "all",
      },
    },
    devtool: dev ? "source-map" : false,
    entry: "./js/ispy.js",
    target: ["web", "es5"],
    output: {
      filename: "masterclass_[name].js", // Output each file with its name
      path: path.resolve("dist/assets/js/"),
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".html", ".js"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "../../index.html",
        template: "./index.html",
        inject: "body",
      }),
      // new CopyWebpackPlugin({
      //   patterns: [
      //     {
      //       from: "node_modules/jquery/dist/jquery.min.js",
      //       to: "jquery.min.js",
      //     },
      //     {
      //       from: "node_modules/stupid-table-plugin/stupidtable.min.js",
      //       to: "stupidtable.min.js",
      //     },
      //     {
      //       from: "node_modules/jquery.scrollintoview/jquery.scrollintoview.js",
      //       to: "jquery.scrollintoview.js",
      //     },
      //   ],
      // }),
      new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(!dev),
      }),
    ],
  };
  if (env && env.analyze) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: "static", // generates a file
        openAnalyzer: true,     // opens the report in browser
        reportFilename: path.resolve("dist", "bundle-report.html"),
      }),
    );
  }
  return config;
};
