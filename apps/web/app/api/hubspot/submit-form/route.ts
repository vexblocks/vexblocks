import { NextResponse } from "next/server"

interface FormSubmission {
	name: string
	email: string
	selectedServices: string[]
	submissionType: "contact" | "book"
	otherDetails?: string
}

export async function POST(request: Request) {
	try {
		const body: FormSubmission = await request.json()
		const { name, email, selectedServices, submissionType, otherDetails } = body

		if (!name || !email) {
			return NextResponse.json(
				{ error: "Name and email are required" },
				{ status: 400 },
			)
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return NextResponse.json(
				{ error: "Invalid email format" },
				{ status: 400 },
			)
		}

		const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
		const formGuid = process.env.NEXT_PUBLIC_HUBSPOT_FORM_GUID

		if (!portalId || !formGuid) {
			console.error("HubSpot credentials not configured")
			return NextResponse.json(
				{ error: "HubSpot configuration missing" },
				{ status: 500 },
			)
		}

		let interestsValue = selectedServices.join("; ")

		if (otherDetails?.trim()) {
			const trimmed = otherDetails.trim()
			interestsValue = interestsValue
				? `${interestsValue}; Other details: ${trimmed}`
				: `Other details: ${trimmed}`
		}

		// Split name into first and last name
		const nameParts = name.trim().split(" ")
		const firstName = nameParts[0] || ""
		const lastName = nameParts.slice(1).join(" ") || nameParts[0] || ""

		const hubspotData = {
			fields: [
				{
					objectTypeId: "0-1", // Contact
					name: "firstname",
					value: firstName,
				},
				{
					objectTypeId: "0-1",
					name: "lastname",
					value: lastName,
				},
				{
					objectTypeId: "0-1",
					name: "email",
					value: email,
				},
				{
					objectTypeId: "0-1",
					name: "what_are_you_interested_in___optional_",
					value: interestsValue,
				},
			],
			context: {
				pageUri: request.headers.get("referer") || "",
				pageName: "Request a Demo",
			},
		}

		const hubspotUrl = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`

		const response = await fetch(hubspotUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(hubspotData),
		})

		if (!response.ok) {
			const errorData = await response.text()
			console.error("HubSpot API error:", errorData)
			return NextResponse.json(
				{ error: "Failed to submit form to HubSpot" },
				{ status: response.status },
			)
		}

		const result = await response.json()

		return NextResponse.json({
			success: true,
			message: "Form submitted successfully",
			submissionType,
			data: result,
		})
	} catch (error) {
		console.error("Error submitting form:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		)
	}
}
