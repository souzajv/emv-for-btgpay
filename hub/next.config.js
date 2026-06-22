/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  output: "export",
  trailingSlash: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
