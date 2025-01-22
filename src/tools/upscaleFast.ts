import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { z } from "zod";
import { ResourceContext } from "../resources/resourceClient.js";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const UpscaleFastArgsSchema = z.object({
	imageFileUri: z.string(),
	outputImageFileName: z.string(),
});

export type UpscaleFastArgs = z.infer<typeof UpscaleFastArgsSchema>;

export const upscaleFastToolDefinition = {
	name: "stability-ai-upscale-fast",
	description: `Cheap and fast tool to enhance image resolution by 4x.`,
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description: `The URI to the image file. It should start with file://`,
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

export async function upscaleFast(
	args: UpscaleFastArgs,
	context: ResourceContext
) {
	const validatedArgs = UpscaleFastArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	try {
		const response = await client.upscaleFast(imageFilePath);

		const imageAsBase64 = response.base64Image;
		const filename = `${validatedArgs.outputImageFileName}.png`;

		const resource = await resourceClient.createResource(
			filename,
			imageAsBase64
		);

		if (resource.uri.includes("file://")) {
			const file_location = resource.uri.replace("file://", "");
			open(file_location);
		}

		return {
			content: [
				{
					type: "text",
					text: `Processed image "${validatedArgs.imageFileUri}" to upscale by 4x`,
				},
				{
					type: "resource",
					resource: resource,
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
