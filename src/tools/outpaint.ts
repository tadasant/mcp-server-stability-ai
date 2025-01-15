import { z } from "zod";
import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { ResourceClient } from "../resources/resourceClient.js";

const OutpaintArgsSchema = z.object({
	imageFileUri: z.string(),
	left: z.number().min(0).max(2000).optional(),
	right: z.number().min(0).max(2000).optional(),
	up: z.number().min(0).max(2000).optional(),
	down: z.number().min(0).max(2000).optional(),
	creativity: z.number().min(0).max(1).optional(),
	prompt: z.string().max(10000).optional(),
	outputImageFileName: z.string(),
});

export type OutpaintArgs = z.infer<typeof OutpaintArgsSchema>;

export const outpaintToolDefinition = {
	name: "stability-ai-outpaint",
	description: `Extends an image in any direction while maintaining visual consistency.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description: `The URI to the image file. It should start with file://`,
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
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri", "outputImageFileName"],
	},
};

export async function outpaint(args: OutpaintArgs) {
	const validatedArgs = OutpaintArgsSchema.parse(args);

	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri
	);

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

	const response = await client.outpaint(imageFilePath, validatedArgs);

	const imageAsBase64 = response.base64Image;
	const filename = `${validatedArgs.outputImageFileName}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);

	const file_location = resource.uri.replace("file://", "");
	open(file_location);

	return {
		content: [
			{
				type: "text",
				text: `Processed image "${validatedArgs.imageFileUri}" to outpaint`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
}
