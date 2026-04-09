import { defineConfig } from "@rspack/cli";
import { resolve } from "node:path";

const __rootDir = resolve(import.meta.dirname, "../");

export default defineConfig({
  mode: "production",
  entry: resolve(__rootDir, "./src/index.ts"),
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: [/node_modules/],
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
              tsx: true,
            },
            transform: {
              react: {
                runtime: "automatic",
              },
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },
  resolve: {
    alias: {
      "react-devtools-core": false,
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"],
    conditionNames: ["source", "import", "module", "require"],
    tsConfig: {
      configFile: resolve(__rootDir, "./tsconfig.json"),
      references: "auto",
    },
  },
  optimization: {
    minimize: true,
  },
  output: {
    path: resolve(__rootDir, "./dist"),
    filename: "cli.js",
  },
  target: "node",
  devtool: "cheap-module-source-map",
});
