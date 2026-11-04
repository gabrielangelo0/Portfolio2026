/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  async headers() {
    return [
      {
        // screenshots dos cards de produto: o nome do arquivo muda quando o
        // conteúdo muda, então cache longo e "immutable" é seguro aqui.
        source: "/shots/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
