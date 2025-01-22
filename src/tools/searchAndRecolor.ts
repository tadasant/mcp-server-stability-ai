import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const SearchAndRecolorArgsSchema = z.object({
	imageFileUri: z.string(),
	prompt: z.string(),
	selectPrompt: z.string(),
	outputImageFileName: z.string(),
});

export type SearchAndRecolorArgs = z.infer<typeof SearchAndRecolorArgsSchema>;

export const searchAndRecolorToolDefinition = {
	name: "stability-ai-search-and-recolor",
	description: "Search and recolor object(s) in an image",
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description: "The URI to the image file. It should start with file://",
			},
			prompt: {
				type: "string",
				description: "What colors you wish to see in the output image",
			},
			selectPrompt: {
				type: "string",
				description:
					"Short description of what to search for and recolor in the image",
			},
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri", "prompt", "selectPrompt", "outputImageFileName"],
	},
};

export const searchAndRecolor = async (
	args: SearchAndRecolorArgs,
	context: ResourceContext
) => {
	const validatedArgs = SearchAndRecolorArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.searchAndRecolor(imageFilePath, {
		prompt: validatedArgs.prompt,
		selectPrompt: validatedArgs.selectPrompt,
	});

	const imageAsBase64 = response.base64Image;
	const filename = `${validatedArgs.outputImageFileName}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);

	if (resource.uri.includes("file://")) {
		const file_location = resource.uri.replace("file://", "");
		open(file_location);
	}

	return {
		content: [
			{
				type: "text",
				text: `Processed image "${validatedArgs.imageFileUri}" to recolor "${validatedArgs.selectPrompt}" with "${validatedArgs.prompt}"`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
