/**
 * VexBlocks Configuration
 *
 * This file contains your application's configuration.
 * Customize these values for your project.
 */

export interface VexBlocksConfig {
	/**
	 * Your application name
	 * Used in email subjects and templates
	 */
	appName: string

	/**
	 * Email configuration
	 */
	email: {
		/**
		 * The name that appears in the "From" field of emails
		 * Example: "MyApp" or "MyCompany"
		 */
		fromName: string

		/**
		 * The email address used as the sender
		 * Must be a verified domain in your Resend account
		 * Example: "noreply@yourdomain.com"
		 */
		fromAddress: string
	}
}

const config: VexBlocksConfig = {
	appName: "VexBlocks",
	email: {
		fromName: "VexBlocks",
		fromAddress: "noreply@julianux.com",
	},
}

export default config
