import type { NextConfig } from "next";

// Extract hostname from API URL if provided
const getApiHostname = (): string | null => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const url = new URL(apiUrl);
    return url.hostname;
  } catch {
    return null;
  }
};

const apiHostname = getApiHostname();
const remotePatterns = [
  {
    protocol: "http" as const,
    hostname: "localhost",
    port: "1337",
    pathname: "/uploads/**",
  },
  {
    protocol: "https" as const,
    hostname: "localhost",
    port: "1337",
    pathname: "/uploads/**",
  },
  {
    protocol: "https" as const,
    hostname: "images.unsplash.com",
    port: "",
    pathname: "/**",
  },
];

// Add API hostname if it's different from localhost
if (apiHostname && apiHostname !== "localhost") {
  remotePatterns.push(
    {
      protocol: "http" as const,
      hostname: apiHostname,
      port: "",
      pathname: "/uploads/**",
    },
    {
      protocol: "https" as const,
      hostname: apiHostname,
      port: "",
      pathname: "/uploads/**",
    },
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      {
        source: "/reset-password",
        destination: "/auth/reset-password",
      },
      {
        source: "/auth/email-confirmation",
        destination: "/auth/email-confirmed",
      },
    ];
  },
};

export default nextConfig;
