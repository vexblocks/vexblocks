"use client"

import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { OTPInput, type SlotProps } from "input-otp"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState, useTransition } from "react"
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

	// Check if user is already authenticated
	const currentUser = useQuery(api.auth.getCurrentUser)

	const [isPending, startTransition] = useTransition()
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [email, setEmail] = useState("")
	const [isEmailSent, setIsEmailSent] = useState(false)
	const [otp, setOtp] = useState("")
	const [isVerifying, setIsVerifying] = useState(false)
	const [countdown, setCountdown] = useState(30)
	const [isResendDisabled, setIsResendDisabled] = useState(true)

	const otpInput = useRef<HTMLInputElement>(null)

	const [isRedirecting, setIsRedirecting] = useState(false)

	// Redirect if already authenticated and is admin
	useEffect(() => {
		if (currentUser && currentUser.role === "admin") {
			setIsRedirecting(true)
			router.push(redirectTo)
		}
	}, [currentUser, router, redirectTo])

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

			// Redirect to the original page or dashboard
			router.push(redirectTo)
		} catch (_err) {
			setErrorMessage(
				"Invalid code. Please check your code or request a new one.",
			)
			setIsVerifying(false)
		}
	}

	// Show loading while checking auth OR while redirecting
	// This prevents the flash of the login form when user is already authenticated
	if (currentUser === undefined || isRedirecting) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
					<p className="text-white">Loading...</p>
				</div>
			</div>
		)
	}

	// Don't render login form if user is authenticated (will redirect via useEffect)
	if (currentUser && currentUser.role === "admin") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
					<p className="text-white">Redirecting...</p>
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
						<div className="mb-4 flex justify-center">
							<Image
								src="/logotype.png"
								alt="VexBlocks"
								width={40}
								height={40}
							/>
						</div>
						<h1 className="mb-1 font-bold text-3xl text-grey-900">VexBlocks</h1>
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
						<Image src="/logotype.png" alt="VexBlocks" width={40} height={40} />
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
						onComplete={async (value) => {
							setOtp(value)
							await handleVerifyOTP()
						}}
						onChange={(value) => {
							setOtp(value)
						}}
						value={otp}
						render={({ slots }) => (
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
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-800">
					<div className="text-center">
						<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
						<p className="text-white">Loading...</p>
					</div>
				</div>
			}
		>
			<AdminLoginContent />
		</Suspense>
	)
}
