import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { z } from "zod";
import { ResourceClient } from "../resources/resourceClient.js";

const UpscaleCreativeArgsSchema = z.object({
	imageFileUri: z.string(),
	prompt: z.string(),
	negativePrompt: z.string().optional(),
	creativity: z.number().min(0).max(0.35).optional(),
	outputImageFileName: z.string(),
});

export type UpscaleCreativeArgs = z.infer<typeof UpscaleCreativeArgsSchema>;

export const upscaleCreativeToolDefinition = {
	name: "stability-ai-upscale-creative",
	description: `Enhance image resolution up to 4K using AI with creative interpretation. This tool works best on highly degraded images and performs heavy reimagining. In general, don't use this (expensive) tool unless specifically asked to do so, usually after trying stability-ai-upscale-fast first.`,
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
			outputImageFileName: {
				type: "string",
				description:
					"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
			},
		},
		required: ["imageFileUri", "prompt", "outputImageFileName"],
	},
};

export async function upscaleCreative(args: UpscaleCreativeArgs) {
	const validatedArgs = UpscaleCreativeArgsSchema.parse(args);

	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	try {
		const response = await client.upscaleCreative(imageFilePath, {
			prompt: validatedArgs.prompt,
			negativePrompt: validatedArgs.negativePrompt,
			creativity: validatedArgs.creativity,
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
					text: `Processed image "${validatedArgs.imageFileUri}" with creative upscaling`,
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
					text: `Failed to upscale image: ${errorMessage}`,
				},
			],
		};
	}
}
