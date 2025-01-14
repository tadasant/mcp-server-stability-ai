import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceClient } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";

const SearchAndReplaceArgsSchema = z.object({
	imageFileUri: z.string(),
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
			imageFileUri: {
				type: "string",
				description: `The URI to the image file. It should start with file://`,
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
		required: ["imageFileUri", "searchPrompt", "prompt"],
	},
};

export async function searchAndReplace(args: SearchAndReplaceArgs) {
	const validatedArgs = SearchAndReplaceArgsSchema.parse(args);

	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.searchAndReplace(imageFilePath, validatedArgs);

	const imageAsBase64 = response.base64Image;
	const filename = `${Date.now()}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);
	const file_location = resource.uri.replace("file://", "");
	open(file_location);

	return {
		content: [
			{
				type: "text",
				text: `Processed image "${validatedArgs.imageFileUri}" to replace "${validatedArgs.searchPrompt}" with "${validatedArgs.prompt}"`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
}
