/** @type {import('next').NextConfig} */
const nextConfig = {
  // Polling avoids EMFILE / broken watchers on some macOS setups, which otherwise
  // can leave `app/` routes undiscovered and every path (including `/`) as 404.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}
module.exports = nextConfig
