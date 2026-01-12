import fs from "node:fs";
import path from "node:path";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { stepCountIs, streamText } from "ai";
import { isAuthenticated } from "@/lib/auth-server";
import { buildSystemPrompt } from "./prompts";
import { tools } from "./tools";
import { getCachedSchemas, logger } from "./utils/convex-client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

// Load generated types for context
const getGeneratedTypesContext = (): string => {
	try {
		const typesPath = path.join(
			process.cwd(),
			"../../packages/cms-shared/src/types/generated.ts",
		);
		const typesContent = fs.readFileSync(typesPath, "utf-8");
		return typesContent;
	} catch (error) {
		logger.error("Error loading generated types", error);
		return "// Types not available";
	}
};

// Message type for conversion
type MessagePart = {
	type: string;
	text?: string;
};

type IncomingMessage = {
	role: "user" | "assistant" | "system" | "tool";
	content?: string;
	parts?: MessagePart[];
};

type ConvertedMessage = {
	role: "user" | "assistant" | "system" | "tool";
	content: string;
};

// Convert UIMessage format to standard message format
const convertMessages = (messages: IncomingMessage[]): ConvertedMessage[] => {
	return messages.map((message) => {
		// If message already has content field, use it
		if (message.content) {
			return {
				role: message.role,
				content: message.content,
			};
		}

		// Convert parts to content
		if (message.parts) {
			const textContent = message.parts
				.filter((part) => part.type === "text")
				.map((part) => part.text ?? "")
				.join("");

			return {
				role: message.role,
				content: textContent,
			};
		}

		return {
			role: message.role,
			content: "",
		};
	});
};

export async function POST(req: Request) {
	try {
		// Check authentication
		const authenticated = await isAuthenticated();
		if (!authenticated) {
			return new Response("Unauthorized", { status: 401 });
		}

		const { messages } = await req.json();

		logger.debug("Received messages", { count: messages.length });

		// Convert messages to standard format
		const convertedMessages = convertMessages(messages);

		// Load context in parallel
		const [generatedTypes, schemas] = await Promise.all([
			Promise.resolve(getGeneratedTypesContext()),
			getCachedSchemas().catch(() => []),
		]);

		// Build system prompt with modular components
		const systemPrompt = buildSystemPrompt({
			generatedTypes,
			schemas,
		});

		logger.debug("System prompt built", { length: systemPrompt.length });

		// Create the AI stream with Gemini 2.5 Flash and tools
		const result = streamText({
			model: google("gemini-2.5-flash-lite"),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			messages: convertedMessages as any,
			system: systemPrompt,
			tools,
			// Allow multiple steps so the AI can process tool results and respond
			stopWhen: stepCountIs(5),
		});

		// Use toUIMessageStreamResponse() for proper streaming with useChat
		return result.toUIMessageStreamResponse();
	} catch (error) {
		logger.error("AI Chat error", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
