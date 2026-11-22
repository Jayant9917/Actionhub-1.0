/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const origin = process.env.ACTIONHUB_API_ORIGIN?.trim();
    if (!origin) return [];
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.origin !== origin.replace(/\/$/, "")) {
      throw new Error("ACTIONHUB_API_ORIGIN must be an HTTPS origin");
    }
    return [{ source: "/api/:path*", destination: `${url.origin}/api/:path*` }];
  },
};

export default nextConfig;
