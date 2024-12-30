import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";

export type RemoveBackgroundArgs = { imageFileLocation: string };

export const removeBackgroundToolDefinition = {
	name: "stability-ai-remove-background",
	description: `Remove the background from an image.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileLocation: {
				type: "string",
				description: `The absolute path to the image file on the filesystem.`,
			},
		},
		required: ["imageFileLocation"],
	},
};

export const removeBackground = async (args: RemoveBackgroundArgs) => {
	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);

	const response = await client.removeBackground(args.imageFileLocation);

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
				text: `Processed image "${args.imageFileLocation}" to remove background`,
			},
			{
				type: "text",
				text: `Automatically opened the file on the user's device: it is located at ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
			},
		],
	};
};
