const outputs = require("./amplify_outputs.json");

function getHostname(url) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const remotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
];
const imageDomains = ["images.unsplash.com"];

const storageCdnHostname = getHostname(outputs.custom?.storageCdnUrl);
if (storageCdnHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: storageCdnHostname,
  });
  imageDomains.push(storageCdnHostname);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: imageDomains,
    remotePatterns,
  },
};

module.exports = nextConfig;
