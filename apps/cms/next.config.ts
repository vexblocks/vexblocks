import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	experimental: {
		externalDir: true,
	},
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "imagedelivery.net",
			},
		],
	},
}

export default nextConfig
