import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceClient } from "../resources/resourceClient.js";
import open from "open";

export type RemoveBackgroundArgs = { imageFileUri: string };

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
		},
		required: ["imageFileUri"],
	},
};

export const removeBackground = async (args: RemoveBackgroundArgs) => {
	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);
	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);

	const imageFilePath = await resourceClient.resourceToFile(args.imageFileUri);
	const response = await client.removeBackground(args.imageFileUri);

	const imageAsBase64 = response.base64Image;
	const filename = `${Date.now()}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);
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
