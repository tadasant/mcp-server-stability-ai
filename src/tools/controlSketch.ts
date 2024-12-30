import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";
import { z } from "zod";

const ControlSketchArgsSchema = z.object({
	imageFileLocation: z.string(),
	prompt: z.string(),
	controlStrength: z.number().min(0).max(1).optional(),
	negativePrompt: z.string().optional(),
});

export type ControlSketchArgs = z.infer<typeof ControlSketchArgsSchema>;

export const controlSketchToolDefinition = {
	name: "stability-ai-control-sketch",
	description: `Translate hand-drawn sketches to production-grade images.`,
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
					"What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results.\n\nTo control the weight of a given word use the format (word:weight), where word is the word you'd like to control the weight of and weight is a value between 0 and 1. For example: The sky was a crisp (blue:0.3) and (green:0.8) would convey a sky that was blue and green, but more green than blue.",
			},
			controlStrength: {
				type: "number",
				description:
					"How much influence, or control, the image has on the generation. Represented as a float between 0 and 1, where 0 is the least influence and 1 is the maximum.",
				minimum: 0,
				maximum: 1,
			},
			negativePrompt: {
				type: "string",
				description: "What you do not wish to see in the output image.",
			},
		},
		required: ["imageFileLocation", "prompt"],
	},
};

export async function controlSketch(args: ControlSketchArgs) {
	const validatedArgs = ControlSketchArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	try {
		const response = await client.controlSketch(
			validatedArgs.imageFileLocation,
			{
				prompt: validatedArgs.prompt,
				controlStrength: validatedArgs.controlStrength,
				negativePrompt: validatedArgs.negativePrompt,
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
					text: `Processed sketch "${validatedArgs.imageFileLocation}" with prompt "${validatedArgs.prompt}"`,
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
					text: `Failed to process sketch: ${errorMessage}`,
				},
			],
		};
	}
}
