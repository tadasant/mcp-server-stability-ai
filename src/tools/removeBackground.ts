import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const RemoveBackgroundArgsSchema = z.object({
	imageFileUri: z.string(),
	outputImageFileName: z.string(),
});

export type RemoveBackgroundArgs = z.infer<typeof RemoveBackgroundArgsSchema>;

export const removeBackgroundToolDefinition = {
	name: "stability-ai-remove-background",
	description: `Remove the background from an image.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description: `The URI to the image file. It should start with file://`,
			},
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri"],
	},
};

export const removeBackground = async (
	args: RemoveBackgroundArgs,
	context: ResourceContext
) => {
	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);
	const resourceClient = getResourceClient();

	const imageFilePath = await resourceClient.resourceToFile(args.imageFileUri);
	const response = await client.removeBackground(imageFilePath);

	const imageAsBase64 = response.base64Image;
	const filename = `${args.outputImageFileName}.png`;

	const resource = await resourceClient.createResource(
		filename,
		imageAsBase64,
		context
	);
	const file_location = resource.uri.replace("file://", "");
	open(file_location);

	return {
		content: [
			{
				type: "text",
				text: `Processed image "${args.imageFileUri}" to remove background`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
