import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	experimental: {
		externalDir: true,
	},
	images: {
		// Configure allowed image qualities to fix build warnings
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		formats: ["image/webp"],
	},
	reactCompiler: true,
}

export default nextConfig
