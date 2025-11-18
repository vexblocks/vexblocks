import { createAuth } from "../better-auth/server"
import { query } from "./_generated/server"
import { authComponent } from "./auth"

export const getSession = query({
	args: {},
	handler: async (ctx) => {
		const auth = createAuth(ctx)
		const headers = await authComponent.getHeaders(ctx)
		const session = await auth.api.getSession({
			headers,
		})
		if (!session) {
			return null
		}
		return session
	},
})
