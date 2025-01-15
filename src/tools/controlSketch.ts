import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { z } from "zod";
import { ResourceClient } from "../resources/resourceClient.js";

const ControlSketchArgsSchema = z.object({
	imageFileUri: z.string(),
	prompt: z.string(),
	controlStrength: z.number().min(0).max(1).optional(),
	negativePrompt: z.string().optional(),
	outputImageFileName: z.string(),
});

export type ControlSketchArgs = z.infer<typeof ControlSketchArgsSchema>;

export const controlSketchToolDefinition = {
	name: "stability-ai-control-sketch",
	description: `Translate hand-drawn sketches to production-grade images.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description: `The URI to the image file. It should start with file://`,
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
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri", "prompt", "outputImageFileName"],
	},
};

export async function controlSketch(args: ControlSketchArgs) {
	const validatedArgs = ControlSketchArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri
	);

	try {
		const response = await client.controlSketch(imageFilePath, {
			prompt: validatedArgs.prompt,
			controlStrength: validatedArgs.controlStrength,
			negativePrompt: validatedArgs.negativePrompt,
		});

		const imageAsBase64 = response.base64Image;
		const filename = `${validatedArgs.outputImageFileName}.png`;

		const resource = await resourceClient.createResource(
			filename,
			imageAsBase64
		);

		const file_location = resource.uri.replace("file://", "");
		open(file_location);

		return {
			content: [
				{
					type: "text",
					text: `Processed sketch "${validatedArgs.imageFileUri}" with prompt "${validatedArgs.prompt}" to create the following image:`,
				},
				{
					type: "resource",
					resource: resource,
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
