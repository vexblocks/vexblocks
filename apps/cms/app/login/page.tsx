"use client"

import { convexQuery } from "@convex-dev/react-query"
import { useAtom } from "@lfades/atom"
import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared"
import { useQuery } from "@tanstack/react-query"
import { OTPInput, type SlotProps } from "input-otp"
import { Shield } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState, useTransition } from "react"
import { authAtom } from "@/lib/auth-atom"
import { cn } from "@/lib/utils"

type ExtendedSlotProps = SlotProps & {
	hasError?: boolean
}

function Slot(props: ExtendedSlotProps) {
	const showCaret = props.isActive && !props.char

	return (
		<div
			className={cn(
				"relative flex h-14 w-12 items-center justify-center text-[1.2rem]",
				"rounded-lg border-2 transition-all duration-300",
				"border-grey-300 bg-grey-50",
				"hover:border-grey-400 hover:bg-grey-100",
				{
					"border-primary bg-primary/5 ring-2 ring-primary/20": props.isActive,
					"border-red-500 bg-red-50 ring-2 ring-red-500": props.hasError,
				},
			)}
		>
			{props.char ? (
				<div className="font-bold text-grey-900">{props.char}</div>
			) : (
				<div className="relative flex h-full w-full items-center justify-center">
					{showCaret && (
						<div className="h-8 w-0.5 animate-pulse bg-primary shadow-sm" />
					)}
				</div>
			)}
		</div>
	)
}

function AdminLoginContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const error = searchParams.get("error")
	const redirectTo = searchParams.get("redirectTo") || "/"

	// Check if user is already authenticated using the atom
	const [authState] = useAtom(authAtom)

	// Fetch appearance settings (public query, no auth required)
	const { data: settings, isLoading: isLoadingSettings } = useQuery(
		convexQuery(api.cms.settings.getPublic, { key: "appearance" }),
	)

	const dashboardName = settings?.dashboardName || "VexBlocks"
	const logoId = settings?.logoId

	const { data: logoMedia, isLoading: isLoadingLogo } = useQuery(
		convexQuery(
			api.cms.media.getPublic,
			logoId ? { id: logoId as any } : "skip",
		),
	)

	const isLoading = isLoadingSettings || (!!logoId && isLoadingLogo)

	const [isPending, startTransition] = useTransition()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [email, setEmail] = useState("")
	const [isEmailSent, setIsEmailSent] = useState(false)
	const [otp, setOtp] = useState("")
	const [isVerifying, setIsVerifying] = useState(false)
	const [countdown, setCountdown] = useState(30)
	const [isResendDisabled, setIsResendDisabled] = useState(true)

	const otpInput = useRef<HTMLInputElement>(null)

	// Reset form when user logs out (user becomes null after being initialized)
	useEffect(() => {
		if (authState.isInitialized && !authState.user) {
			// Reset all form state to initial values
			setEmail("")
			setIsEmailSent(false)
			setOtp("")
			setIsVerifying(false)
			setErrorMessage(null)
			setCountdown(30)
			setIsResendDisabled(true)
		}
	}, [authState.isInitialized, authState.user])

	useEffect(() => {
		if (countdown > 0 && isEmailSent) {
			const timer = setTimeout(() => {
				setCountdown((prevCountdown) => prevCountdown - 1)
			}, 1000)

			return () => clearTimeout(timer)
		}
		if (countdown === 0) {
			setIsResendDisabled(false)
		}
	}, [countdown, isEmailSent])

	const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!email) return

		startTransition(async () => {
			setErrorMessage(null)

			try {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "sign-in",
				})

				if (error) {
					throw new Error(error.message)
				}

				setIsEmailSent(true)
				setCountdown(30)
				setIsResendDisabled(true)
				setTimeout(() => {
					otpInput.current?.focus()
				}, 100)
			} catch (err) {
				setErrorMessage(
					err instanceof Error
						? err.message
						: "Failed to send OTP. Please try again.",
				)
			}
		})
	}

	const handleResendOTP = async () => {
		if (!email || isResendDisabled) return

		setErrorMessage(null)
		startTransition(async () => {
			try {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "sign-in",
				})

				if (error) {
					throw new Error(error.message)
				}

				setOtp("")
				otpInput.current?.focus()
				setCountdown(30)
				setIsResendDisabled(true)
			} catch (err) {
				setErrorMessage(
					err instanceof Error
						? err.message
						: "Failed to resend OTP. Please try again.",
				)
			}
		})
	}

	const handleVerifyOTP = async () => {
		if (!otp || otp.length !== 6) {
			setErrorMessage("Please enter a valid 6-digit code")
			return
		}

		setIsVerifying(true)
		setErrorMessage(null)

		try {
			const { error } = await authClient.signIn.emailOtp({
				email,
				otp,
			})

			if (error) {
				throw new Error(error.message)
			}

			await new Promise((resolve) => setTimeout(resolve, 300))

			// Redirect to the original page or dashboard
			router.replace(redirectTo)
		} catch (_err) {
			setErrorMessage(
				"Invalid code. Please check your code or request a new one.",
			)
			setIsVerifying(false)
		}
	}

	// If user is authenticated but NOT admin, show access pending message
	if (authState.user && authState.user.role !== "admin") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800 px-4">
				<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
					{/* Logo */}
					<div className="mb-8 text-center">
						<div className="mb-4 flex h-16 justify-center">
							{isLoading ? (
								<div className="h-16 w-16 animate-pulse rounded-lg bg-grey-200" />
							) : logoMedia ? (
								<CFImage
									assetId={logoMedia.cloudflareId}
									alt="Logo"
									width={64}
									height={64}
									className="h-16 w-16 object-contain"
								/>
							) : (
								<Image
									src="/logo.png"
									alt="Logo"
									width={64}
									height={64}
									className="h-16 w-16 object-contain"
								/>
							)}
						</div>
						{isLoading ? (
							<div className="mx-auto mb-1 h-9 w-48 animate-pulse rounded-lg bg-grey-200" />
						) : (
							<h2 className="mb-1 font-bold text-3xl text-grey-900">
								{dashboardName}
							</h2>
						)}
						<p className="mb-2 font-medium text-primary text-sm">
							Headless CMS
						</p>
					</div>

					{/* Access Pending Message */}
					<div className="mb-6 rounded-lg border-2 border-orange-200 bg-orange-50 p-6 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
							<Shield className="h-8 w-8 text-orange-600" />
						</div>
						<h2 className="mb-2 font-bold text-orange-900 text-xl">
							Access Pending
						</h2>
						<p className="mb-4 text-orange-700 text-sm">
							Your account is registered but doesn't have admin access yet.
							Please wait for an administrator to grant you access.
						</p>
						<div className="rounded-lg bg-white p-3">
							<p className="font-medium text-grey-700 text-xs">
								Logged in as: <strong>{authState.user.email}</strong>
							</p>
						</div>
					</div>

					{/* Sign Out Button */}
					<button
						type="button"
						onClick={async () => {
							await authClient.signOut()
							router.refresh()
						}}
						className="w-full rounded-lg border-2 border-grey-300 bg-white px-4 py-3 font-medium text-grey-700 transition-colors hover:bg-grey-50"
					>
						Sign Out
					</button>

					<div className="mt-6 rounded-lg bg-grey-100 p-4">
						<p className="text-center text-grey-500 text-sm">
							💡 Contact your system administrator to request admin access
						</p>
					</div>
				</div>
			</div>
		)
	}

	if (!isEmailSent) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800 px-4">
				<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
					{/* Logo */}
					<div className="mb-8 text-center">
						<div className="mb-4 flex h-16 justify-center">
							{isLoading ? (
								<div className="h-16 w-16 animate-pulse rounded-lg bg-grey-200" />
							) : logoMedia ? (
								<CFImage
									assetId={logoMedia.cloudflareId}
									alt="Logo"
									width={64}
									height={64}
									className="h-16 w-16 object-contain"
								/>
							) : (
								<Image
									src="/logo.png"
									alt="Logo"
									width={64}
									height={64}
									className="h-16 w-16 object-contain"
								/>
							)}
						</div>
						{isLoading ? (
							<div className="mx-auto mb-1 h-9 w-48 animate-pulse rounded-lg bg-grey-200" />
						) : (
							<h2 className="mb-1 font-bold text-3xl text-grey-900">
								{dashboardName}
							</h2>
						)}
						<p className="mb-2 font-medium text-primary text-sm">
							Headless CMS
						</p>
						<p className="text-grey-500 text-sm">
							Sign in to access the admin panel
						</p>
					</div>

					{/* Error Messages */}
					{error === "unauthorized" && (
						<div className="mb-4 rounded-lg bg-red-50 p-4">
							<p className="text-red-600 text-sm">
								You don't have admin access. Please contact an administrator.
							</p>
						</div>
					)}

					{error === "insufficient_permissions" && (
						<div className="mb-4 rounded-lg bg-red-50 p-4">
							<p className="text-red-600 text-sm">
								You don't have permission to access the CMS. Please contact an
								administrator to request access.
							</p>
						</div>
					)}

					{errorMessage && (
						<div className="mb-4 rounded-lg bg-red-50 p-4">
							<p className="text-red-600 text-sm">{errorMessage}</p>
						</div>
					)}

					<form onSubmit={handleSendOTP} className="space-y-6">
						<div>
							<label
								htmlFor="email"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Email Address
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@example.com"
								required
								autoComplete="email"
								className="w-full rounded-lg border border-grey-300 px-4 py-3 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								disabled={isPending}
							/>
						</div>

						<button
							type="submit"
							className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							disabled={isPending || !email}
						>
							{isPending ? "Sending code..." : "Send Login Code"}
						</button>
					</form>

					<div className="mt-8 rounded-lg bg-grey-100 p-4">
						<p className="text-center text-grey-500 text-sm">
							🔒 Only administrators can access this area. If you need access,
							please contact your system administrator.
						</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800 px-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
				{/* Logo */}
				<div className="mb-8 text-center">
					<div className="mb-4 flex justify-center">
						{logoMedia ? (
							<CFImage
								assetId={logoMedia.cloudflareId}
								alt="Logo"
								width={64}
								height={64}
								className="h-16 w-16 object-contain"
							/>
						) : (
							<Image
								src="/logo.png"
								alt="Logo"
								width={64}
								height={64}
								className="h-16 w-16 object-contain"
							/>
						)}
					</div>
					<h1 className="mb-2 font-bold text-2xl text-grey-900">
						Enter verification code
					</h1>
					<p className="text-grey-500 text-sm">
						We sent a 6-digit code to{" "}
						<strong className="text-grey-800">{email}</strong>
					</p>
				</div>

				{errorMessage && (
					<div className="mb-6 rounded-lg bg-red-50 p-4">
						<p className="text-red-600 text-sm">{errorMessage}</p>
					</div>
				)}

				<div className="mb-8">
					<OTPInput
						ref={otpInput}
						maxLength={6}
						containerClassName="group flex items-center justify-center"
						onComplete={async (value: string) => {
							setOtp(value)
							await handleVerifyOTP()
						}}
						onChange={(value: string) => {
							setOtp(value)
						}}
						value={otp}
						render={({ slots }: { slots: SlotProps[] }) => (
							<div className="flex items-center gap-2">
								<div className="flex gap-2">
									{slots.slice(0, 3).map((slot, idx) => (
										<Slot key={idx} {...slot} hasError={!!errorMessage} />
									))}
								</div>
								<div className="h-1 w-4 rounded-full bg-grey-300" />
								<div className="flex gap-2">
									{slots.slice(3).map((slot, idx) => (
										<Slot key={idx} {...slot} hasError={!!errorMessage} />
									))}
								</div>
							</div>
						)}
					/>
				</div>

				<button
					type="button"
					onClick={handleVerifyOTP}
					disabled={isVerifying || otp.length !== 6}
					className="mb-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
				>
					{isVerifying ? "Verifying..." : "Verify & Login"}
				</button>

				<div className="space-y-3 text-center">
					<button
						type="button"
						className={cn(
							"text-sm transition-colors",
							isResendDisabled
								? "cursor-not-allowed text-grey-400"
								: "cursor-pointer text-primary hover:underline",
						)}
						onClick={handleResendOTP}
						disabled={isResendDisabled}
					>
						{isResendDisabled && countdown > 0
							? `Resend code in ${countdown}s`
							: "Resend code"}
					</button>

					<div>
						<button
							type="button"
							className="text-grey-500 text-sm hover:text-grey-800 hover:underline"
							onClick={() => {
								setIsEmailSent(false)
								setOtp("")
								setErrorMessage(null)
							}}
						>
							Use a different email
						</button>
					</div>
				</div>

				<div className="mt-8 rounded-lg bg-grey-100 p-4">
					<p className="text-center text-grey-500 text-sm">
						🔒 Only administrators can access this area.
					</p>
				</div>
			</div>
		</div>
	)
}

export default function AdminLogin() {
	return (
		<Suspense fallback={null}>
			<AdminLoginContent />
		</Suspense>
	)
}
