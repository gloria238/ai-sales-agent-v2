/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@salesagent/worker", "@salesagent/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://i.pravatar.cc https://stream.mux.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https://api.deepseek.com https://i.pravatar.cc https://stream.mux.com",
              "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net https://stream.mux.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
