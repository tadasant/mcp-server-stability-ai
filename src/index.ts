#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("stability-ai MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
