console.log("CONVEX_SITE_URL", process.env.CONVEX_SITE_URL)
export default {
	providers: [
		{
			// This should be your Convex site URL, which ends in .convex.site
			domain: process.env.CONVEX_SITE_URL,

			// Application ID has to be "convex"
			applicationID: "convex",
		},
	],
}
