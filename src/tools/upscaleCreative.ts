import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";
import { z } from "zod";

const UpscaleCreativeArgsSchema = z.object({
	imageFileLocation: z.string(),
	prompt: z.string(),
	negativePrompt: z.string().optional(),
	creativity: z.number().min(0).max(0.35).optional(),
});

export type UpscaleCreativeArgs = z.infer<typeof UpscaleCreativeArgsSchema>;

export const upscaleCreativeToolDefinition = {
	name: "stability-ai-upscale-creative",
	description: `Enhance image resolution up to 4K using AI with creative interpretation. This tool works best on highly degraded images and performs heavy reimagining.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileLocation: {
				type: "string",
				description: `The absolute path to the image file on the filesystem.`,
			},
			prompt: {
				type: "string",
				description:
					"What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects.",
			},
			negativePrompt: {
				type: "string",
				description:
					"Optional text describing what you do not wish to see in the output image.",
			},
			creativity: {
				type: "number",
				description:
					"Optional value (0-0.35) indicating how creative the model should be. Higher values add more details during upscaling.",
			},
		},
		required: ["imageFileLocation", "prompt"],
	},
};

export async function upscaleCreative(args: UpscaleCreativeArgs) {
	const validatedArgs = UpscaleCreativeArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	try {
		const response = await client.upscaleCreative(
			validatedArgs.imageFileLocation,
			{
				prompt: validatedArgs.prompt,
				negativePrompt: validatedArgs.negativePrompt,
				creativity: validatedArgs.creativity,
			}
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
					text: `Processed image "${validatedArgs.imageFileLocation}" with creative upscaling`,
				},
				{
					type: "text",
					text: `Automatically opened the file on the user's device: it is located at ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
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
