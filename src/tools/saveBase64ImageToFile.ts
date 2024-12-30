import * as fs from "fs";

export type SaveBase64ImageToFileArgs = {
	imageAsBase64: string;
	filename: string;
};

export const saveBase64ImageToFileToolDefinition = {
	name: "stability-ai-save-base64-image-to-file",
	description:
		"Save a base64 encoded image to a file. Useful if the user has provided a base64 encoded image, and we need to save it first before using another tool to process it.",
	inputSchema: {
		type: "object",
		properties: {
			imageAsBase64: {
				type: "string",
				description: "The base64 encoded image",
			},
			filename: {
				type: "string",
				description:
					"The filename to save the image as (something descriptive).",
			},
		},
		required: ["imageAsBase64", "filename"],
	},
};

export const saveBase64ImageToFile = async (
	args: SaveBase64ImageToFileArgs
) => {
	const { imageAsBase64, filename } = args;

	const IMAGE_STORAGE_DIRECTORY = process.env.IMAGE_STORAGE_DIRECTORY;
	fs.mkdirSync(IMAGE_STORAGE_DIRECTORY, { recursive: true });
	fs.writeFileSync(
		`${IMAGE_STORAGE_DIRECTORY}/${filename}`,
		imageAsBase64,
		"base64"
	);

	return {
		content: [
			{
				type: "text",
				text: `Saved image to ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
			},
		],
	};
};
