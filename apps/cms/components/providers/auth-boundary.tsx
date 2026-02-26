"use client"

import { AuthBoundary } from "@convex-dev/better-auth/react"
import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"
import { useRouter } from "next/navigation"
import type { PropsWithChildren } from "react"
import { isAuthError } from "@/lib/utils"

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
