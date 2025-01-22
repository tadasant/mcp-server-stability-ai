import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const SearchAndReplaceArgsSchema = z.object({
	imageFileUri: z.string(),
	searchPrompt: z.string().max(10000),
	prompt: z.string().max(10000),
	outputImageFileName: z.string(),
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
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri", "searchPrompt", "prompt", "outputImageFileName"],
	},
};

export async function searchAndReplace(
	args: SearchAndReplaceArgs,
	context: ResourceContext
) {
	const validatedArgs = SearchAndReplaceArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.searchAndReplace(imageFilePath, validatedArgs);

	const imageAsBase64 = response.base64Image;
	const filename = `${validatedArgs.outputImageFileName}.png`;

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
