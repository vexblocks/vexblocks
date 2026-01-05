/**
 * VexBlocks Configuration Example
 *
 * Copy this file to vexblocks.config.ts and customize the values for your project.
 *
 * 1. Copy this file:
 *    cp vexblocks.config.example.ts vexblocks.config.ts
 *
 * 2. Update the values with your application details
 */

import type { VexBlocksConfig } from "./vexblocks.config"

const config: VexBlocksConfig = {
	/**
	 * Your application name
	 * This will appear in email subjects like "Your [AppName] login code"
	 */
	appName: "YourApp",

	/**
	 * Email configuration
	 * Make sure the domain is verified in your Resend account
	 */
	email: {
		fromName: "YourApp",
		fromAddress: "noreply@yourdomain.com",
	},
}

export default config
