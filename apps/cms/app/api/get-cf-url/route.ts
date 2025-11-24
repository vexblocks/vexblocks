import { NextResponse } from "next/server"

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4/accounts"

export async function POST() {
	const url = `${CLOUDFLARE_API}/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.CLOUDFLARE_SECRET_TOKEN}`,
			},
		}).then((res) => res.json())

		return NextResponse.json(res, { status: 200 })
	} catch (error) {
		console.error("Cloudflare upload URL error:", error)
		return NextResponse.json(
			{ error: "Failed to get Cloudflare upload URL." },
			{ status: 500 },
		)
	}
}
