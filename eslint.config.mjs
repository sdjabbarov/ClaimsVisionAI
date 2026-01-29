import nextConfig from "eslint-config-next/core-web-vitals.js";

export default Array.isArray(nextConfig) ? nextConfig : [nextConfig];
