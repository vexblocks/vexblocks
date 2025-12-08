import pc from "picocolors"

/**
 * Logger utility for consistent CLI output
 */
export const logger = {
	info: (message: string) => {
		console.log(pc.blue("ℹ"), message)
	},

	success: (message: string) => {
		console.log(pc.green("✔"), message)
	},

	warn: (message: string) => {
		console.log(pc.yellow("⚠"), message)
	},

	error: (message: string) => {
		console.log(pc.red("✖"), message)
	},

	log: (message: string) => {
		console.log(message)
	},

	break: () => {
		console.log()
	},

	title: (message: string) => {
		console.log()
		console.log(pc.bold(pc.cyan(message)))
		console.log()
	},

	step: (step: number, total: number, message: string) => {
		console.log(pc.dim(`[${step}/${total}]`), message)
	},

	list: (items: string[]) => {
		for (const item of items) {
			console.log(pc.dim("  •"), item)
		}
	},

	box: (title: string, content: string[]) => {
		const maxLength = Math.max(title.length, ...content.map((c) => c.length))
		const border = "─".repeat(maxLength + 4)

		console.log()
		console.log(pc.dim(`┌${border}┐`))
		console.log(pc.dim("│"), pc.bold(title.padEnd(maxLength + 2)), pc.dim("│"))
		console.log(pc.dim(`├${border}┤`))
		for (const line of content) {
			console.log(pc.dim("│"), line.padEnd(maxLength + 2), pc.dim("│"))
		}
		console.log(pc.dim(`└${border}┘`))
		console.log()
	},

	code: (code: string, language?: string) => {
		console.log()
		console.log(pc.dim(`\`\`\`${language || ""}`))
		console.log(code)
		console.log(pc.dim("```"))
		console.log()
	},
}
