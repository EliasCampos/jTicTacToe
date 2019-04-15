const path = require('path');

module.exports = {
  mode: "none",
  entry: "./src/js/game.js",
  output: {
    path: path.resolve(__dirname, "build", "js"),
    filename: "script.js",
    publicPath: "/js/"
  },
  optimization: {
    minimize: true
  }
}
