"use client"

import { AuthBoundary } from "@convex-dev/better-auth/react"
import { useRouter } from "next/navigation"
import type { PropsWithChildren } from "react"
import { isAuthError } from "@/lib/utils"
import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"

export function ClientAuthBoundary({ children }: PropsWithChildren) {
	const router = useRouter()
	return (
		<AuthBoundary
			authClient={authClient}
			onUnauth={() => router.replace("/login")}
			getAuthUserFn={api.auth.getAuthUser}
			isAuthError={isAuthError}
		>
			{children}
		</AuthBoundary>
	)
}
