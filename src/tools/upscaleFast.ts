import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";
import { z } from "zod";

const UpscaleFastArgsSchema = z.object({
	imageFileLocation: z.string(),
});

export type UpscaleFastArgs = z.infer<typeof UpscaleFastArgsSchema>;

export const upscaleFastToolDefinition = {
	name: "stability-ai-upscale-fast",
	description: `Enhance image resolution by 4x using AI.`,
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

export async function upscaleFast(args: UpscaleFastArgs) {
	const validatedArgs = UpscaleFastArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	try {
		const response = await client.upscaleFast(validatedArgs.imageFileLocation);

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
					text: `Processed image "${validatedArgs.imageFileLocation}" to upscale by 4x`,
				},
				{
					type: "text",
					text: `Automatically opened the file on the user's device: it is located at ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
				},
				{
					type: "text",
					text: `Let the user know that they can now call upscale-creative to further increase the quality of the image if this result isn't good enough for them.`,
				},
			],
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return {
			content: [
				{
					type: "text",
					text: `Failed to upscale image: ${errorMessage}`,
				},
			],
		};
	}
}
