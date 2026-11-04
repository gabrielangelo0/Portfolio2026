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
  async redirects() {
    return [
      {
        // o domínio virou gabriel.devfly.net — isto evita que quem já tem o
        // link antigo salvo (LinkedIn, currículo) caia em página quebrada.
        // Os dois domínios apontam pro mesmo projeto na Vercel, então o
        // redirecionamento por host resolve sem precisar mexer na config do
        // domínio em si.
        source: "/:path*",
        has: [{ type: "host", value: "portfolio.devfly.net" }],
        destination: "https://gabriel.devfly.net/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
