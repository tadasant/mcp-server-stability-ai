import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";
import { z } from "zod";

const SearchAndReplaceArgsSchema = z.object({
	imageFileLocation: z.string(),
	searchPrompt: z.string().max(10000),
	prompt: z.string().max(10000),
});

export type SearchAndReplaceArgs = z.infer<typeof SearchAndReplaceArgsSchema>;

export const searchAndReplaceToolDefinition = {
	name: "stability-ai-search-and-replace",
	description: `Replace objects or elements in an image by describing what to replace and what to replace it with.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileLocation: {
				type: "string",
				description: `The absolute path to the image file on the filesystem.`,
			},
			searchPrompt: {
				type: "string",
				description: "Short description of what to replace in the image",
			},
			prompt: {
				type: "string",
				description: "What you wish to see in place of the searched content",
			},
		},
		required: ["imageFileLocation", "searchPrompt", "prompt"],
	},
};

export async function searchAndReplace(args: SearchAndReplaceArgs) {
	const validatedArgs = SearchAndReplaceArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.searchAndReplace(
		validatedArgs.imageFileLocation,
		validatedArgs
	);

	const imageAsBase64 = response.base64Image;
	const filename = `${Date.now()}.png`;

	const IMAGE_STORAGE_DIRECTORY = process.env.IMAGE_STORAGE_DIRECTORY;
	fs.mkdirSync(IMAGE_STORAGE_DIRECTORY, { recursive: true });
	fs.writeFileSync(
		`${IMAGE_STORAGE_DIRECTORY}/${filename}`,
		imageAsBase64,
		"base64"
	);
	open(`${IMAGE_STORAGE_DIRECTORY}/${filename}`);

	return {
		content: [
			{
				type: "text",
				text: `Processed image "${validatedArgs.imageFileLocation}" to replace "${validatedArgs.searchPrompt}" with "${validatedArgs.prompt}"`,
			},
			{
				type: "text",
				text: `Automatically opened the file on the user's device: it is located at ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
			},
		],
	};
}
