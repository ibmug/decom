import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    domains:['utfs.io',"cards.scryfall.io", 'errors.scryfall.com',"svgs.scryfall.io"],
    remotePatterns:[{
      protocol:'https',
      hostname:'utfs.io',
      port:'',
    },
    {
        protocol: "https",
        hostname: "cards.scryfall.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
