import { Ban } from "lucide-react"
import Link from "next/link"

export default function AccountDisabledPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-grey-100 px-4">
			<div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
				<div className="mb-6 flex justify-center">
					<div className="rounded-full bg-red-100 p-3">
						<Ban className="h-8 w-8 text-error" />
					</div>
				</div>

				<h1 className="mb-2 text-center font-semibold text-2xl text-grey-900">
					Account Disabled
				</h1>

				<p className="mb-6 text-center text-grey-600">
					Your account has been disabled by an administrator. You no longer have
					access to the VexBlocks CMS.
				</p>

				<div className="rounded-lg border border-grey-200 bg-grey-50 p-4">
					<p className="text-grey-700 text-sm">
						If you believe this is a mistake, please contact your system
						administrator for assistance.
					</p>
				</div>

				<div className="mt-6 text-center">
					<Link
						href="/sign-in"
						className="text-primary text-sm hover:underline"
					>
						Return to Sign In
					</Link>
				</div>
			</div>
		</div>
	)
}
