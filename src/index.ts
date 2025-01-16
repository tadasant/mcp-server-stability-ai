#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
	CallToolRequestSchema,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import {
	generateImage,
	GenerateImageArgs,
	generateImageToolDefinition,
	removeBackground,
	RemoveBackgroundArgs,
	removeBackgroundToolDefinition,
	outpaint,
	OutpaintArgs,
	outpaintToolDefinition,
	searchAndReplace,
	SearchAndReplaceArgs,
	searchAndReplaceToolDefinition,
	upscaleFast,
	UpscaleFastArgs,
	upscaleFastToolDefinition,
	upscaleCreative,
	UpscaleCreativeArgs,
	upscaleCreativeToolDefinition,
	controlSketch,
	ControlSketchArgs,
	controlSketchToolDefinition,
	listResources,
	listResourcesToolDefinition,
	searchAndRecolor,
	SearchAndRecolorArgs,
	searchAndRecolorToolDefinition,
	replaceBackgroundAndRelight,
	ReplaceBackgroundAndRelightArgs,
	replaceBackgroundAndRelightToolDefinition,
	controlStyle,
	ControlStyleArgs,
	controlStyleToolDefinition,
	controlStructure,
	ControlStructureArgs,
	controlStructureToolDefinition,
} from "./tools/index.js";
import { ResourceClient } from "./resources/resourceClient.js";
import { prompts, injectPromptTemplate } from "./prompts/index.js";
import http from "http";

dotenv.config();

if (!process.env.IMAGE_STORAGE_DIRECTORY) {
	if (process.platform === "win32") {
		// Windows
		process.env.IMAGE_STORAGE_DIRECTORY =
			"C:\\Windows\\Temp\\mcp-server-stability-ai";
	} else {
		// macOS or Linux
		process.env.IMAGE_STORAGE_DIRECTORY =
			"/tmp/tadasant-mcp-server-stability-ai";
	}
}

if (!process.env.STABILITY_AI_API_KEY) {
	throw new Error("STABILITY_AI_API_KEY is a required environment variable");
}

const server = new Server(
	{
		name: "stability-ai",
		version: "0.0.1",
	},
	{
		capabilities: {
			tools: {},
			resources: {},
			prompts: {},
		},
	}
);

server.setRequestHandler(ListPromptsRequestSchema, async () => {
	return {
		prompts: prompts.map((p) => ({
			name: p.name,
			description: p.description,
		})),
	};
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	const prompt = prompts.find((p) => p.name === name);
	if (!prompt) {
		throw new Error(`Prompt not found: ${name}`);
	}

	const result = injectPromptTemplate(prompt.template, args);
	return {
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: result,
				},
			},
		],
	};
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const resources = await resourceClient.listResources();

	return {
		resources,
	};
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const resource = await resourceClient.readResource(request.params.uri);

	return {
		contents: [resource],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	try {
		switch (name) {
			case generateImageToolDefinition.name:
				return generateImage(args as GenerateImageArgs);
			case removeBackgroundToolDefinition.name:
				return removeBackground(args as RemoveBackgroundArgs);
			case outpaintToolDefinition.name:
				return outpaint(args as OutpaintArgs);
			case searchAndReplaceToolDefinition.name:
				return searchAndReplace(args as SearchAndReplaceArgs);
			case upscaleFastToolDefinition.name:
				return upscaleFast(args as UpscaleFastArgs);
			case upscaleCreativeToolDefinition.name:
				return upscaleCreative(args as UpscaleCreativeArgs);
			case controlSketchToolDefinition.name:
				return controlSketch(args as ControlSketchArgs);
			case listResourcesToolDefinition.name:
				return listResources();
			case searchAndRecolorToolDefinition.name:
				return searchAndRecolor(args as SearchAndRecolorArgs);
			case replaceBackgroundAndRelightToolDefinition.name:
				return replaceBackgroundAndRelight(
					args as ReplaceBackgroundAndRelightArgs
				);
			case controlStyleToolDefinition.name:
				return controlStyle(args as ControlStyleArgs);
			case controlStructureToolDefinition.name:
				return controlStructure(args as ControlStructureArgs);
			default:
				throw new Error(`Unknown tool: ${name}`);
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(
				`Invalid arguments: ${error.errors
					.map((e) => `${e.path.join(".")}: ${e.message}`)
					.join(", ")}`
			);
		}
		throw error;
	}
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			generateImageToolDefinition,
			removeBackgroundToolDefinition,
			outpaintToolDefinition,
			searchAndReplaceToolDefinition,
			upscaleFastToolDefinition,
			upscaleCreativeToolDefinition,
			controlSketchToolDefinition,
			listResourcesToolDefinition,
			searchAndRecolorToolDefinition,
			replaceBackgroundAndRelightToolDefinition,
			controlStyleToolDefinition,
			controlStructureToolDefinition,
		],
	};
});

function printUsage() {
	console.error("Usage: node build/index.js [--sse]");
	console.error("Options:");
	console.error("  --sse    Use SSE transport instead of stdio");
}

// Store the active transport
let sseTransport: SSEServerTransport | null = null;

// Start the server
async function main() {
	const args = process.argv.slice(2);

	if (args.length > 1 || (args.length === 1 && args[0] !== "--sse")) {
		printUsage();
		throw new Error("Invalid arguments");
	}

	const useSSE = args.includes("--sse");

	if (useSSE) {
		const httpServer = http.createServer(async (req, res) => {
			console.log(`${req.method} request to ${req.url}`);

			// Add CORS headers
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");

			// Handle OPTIONS preflight
			if (req.method === "OPTIONS") {
				res.writeHead(204);
				res.end();
				return;
			}

			if (req.url?.startsWith("/sse")) {
				if (req.method === "GET") {
					console.log("SSE connection attempt received");

					// Add error handler for the response
					res.on("error", (error) => {
						console.error("Response error:", error);
					});

					// Add close handler
					res.on("close", () => {
						sseTransport = null;
						console.log("SSE connection closed");
					});

					sseTransport = new SSEServerTransport("/sse", res);

					// Connect the server (this will call start() internally)
					await server.connect(sseTransport);

					console.log("SSE connection setup complete");
				} else if (req.method === "POST") {
					if (!sseTransport) {
						res.writeHead(400);
						res.end("No active SSE connection");
						return;
					}
					// Let the transport handle the POST message directly
					await sseTransport.handlePostMessage(req, res);
				}
			} else {
				res.writeHead(404);
				res.end();
			}
		});

		// Add error handler for the server
		httpServer.on("error", (error) => {
			console.error("Server error:", error);
		});

		httpServer.listen(3020, () => {
			console.error(
				"stability-ai MCP Server running on SSE at http://localhost:3020"
			);
		});
	} else {
		const transport = new StdioServerTransport();
		await server.connect(transport);
		console.error("stability-ai MCP Server running on stdio");
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
