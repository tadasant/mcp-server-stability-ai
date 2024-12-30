import * as fs from "fs";

export type FindFileLocationArgs = {
	filename: string;
};

export const findFileLocationToolDefinition = {
	name: "stability-ai-0-find-image-file-location",
	description: `Before asking the user to clarify the location of a file, use this tool to try to derive the location of the file automatically.`,
	inputSchema: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description: "The name of the file to find",
			},
		},
		required: ["filename"],
	},
};

export const findFileLocation = async (args: FindFileLocationArgs) => {
	const IMAGE_STORAGE_DIRECTORY = process.env.IMAGE_STORAGE_DIRECTORY;

	const fileExists = fs.existsSync(
		`${IMAGE_STORAGE_DIRECTORY}/${args.filename}`
	);

	if (!fileExists) {
		return {
			content: [
				{
					type: "text",
					text: `File "${args.filename}" does not exist in the ${IMAGE_STORAGE_DIRECTORY} directory`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: "text",
				text: `Found the file at absolute path ${IMAGE_STORAGE_DIRECTORY}/${args.filename}`,
			},
		],
	};
};
