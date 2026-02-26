import { createAuth } from "../better-auth/server"
import { internalAction } from "./_generated/server"

// Run this once (and after any key rotation) to set the static JWKS env var:
// npx convex run authJwks:getLatestJwks | npx convex env set JWKS
export const getLatestJwks = internalAction({
	args: {},
	handler: async (ctx) => {
		const auth = createAuth(ctx)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const jwks = await (auth.api as any).getLatestJwks()
		// Strip Date fields (createdAt, expiresAt) — Convex can't serialize Date objects.
		// The CLI outputs the array as JSON, which convex env set JWKS reads from stdin.
		// getAuthConfigProvider then does JSON.parse(process.env.JWKS) to recover the array.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return jwks.map(({ createdAt, expiresAt, ...rest }: any) => rest)
	},
})
