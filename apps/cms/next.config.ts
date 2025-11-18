import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	experimental: {
		externalDir: true,
	},
	reactCompiler: true,
}

export default nextConfig
