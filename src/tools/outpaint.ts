import { z } from "zod";
import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";
import open from "open";

const OutpaintArgsSchema = z.object({
	imageFileLocation: z.string(),
	left: z.number().min(0).max(2000).optional(),
	right: z.number().min(0).max(2000).optional(),
	up: z.number().min(0).max(2000).optional(),
	down: z.number().min(0).max(2000).optional(),
	creativity: z.number().min(0).max(1).optional(),
	prompt: z.string().max(10000).optional(),
});

export type OutpaintArgs = z.infer<typeof OutpaintArgsSchema>;

export const outpaintToolDefinition = {
	name: "stability-ai-outpaint",
	description: `Extends an image in any direction while maintaining visual consistency.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileLocation: {
				type: "string",
				description: `The absolute path to the image file on the filesystem.`,
			},
			left: {
				type: "number",
				description: "The number of pixels to extend the image to the left",
			},
			right: {
				type: "number",
				description: "The number of pixels to extend the image to the right",
			},
			up: {
				type: "number",
				description: "The number of pixels to extend the image upwards",
			},
			down: {
				type: "number",
				description: "The number of pixels to extend the image downwards",
			},
			creativity: {
				type: "number",
				description: "The creativity of the outpaint operation",
			},
			prompt: {
				type: "string",
				description: "The prompt to use for the outpaint operation",
			},
		},
		required: ["imageFileLocation"],
	},
};

export async function outpaint(args: OutpaintArgs) {
	const validatedArgs = OutpaintArgsSchema.parse(args);

	// Ensure at least one direction is specified
	if (
		!validatedArgs.left &&
		!validatedArgs.right &&
		!validatedArgs.up &&
		!validatedArgs.down
	) {
		throw new Error(
			"At least one direction (left, right, up, or down) must be specified"
		);
	}

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.outpaint(
		validatedArgs.imageFileLocation,
		validatedArgs
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
				text: `Processed image "${validatedArgs.imageFileLocation}" to outpaint`,
			},
			{
				type: "text",
				text: `Automatically opened the file on the user's device: it is located at ${IMAGE_STORAGE_DIRECTORY}/${filename}`,
			},
		],
	};
}
