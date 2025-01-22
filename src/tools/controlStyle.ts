import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const ControlStyleArgsSchema = z.object({
	imageFileUri: z.string(),
	prompt: z.string().min(1).max(10000),
	negativePrompt: z.string().max(10000).optional(),
	aspectRatio: z
		.enum(["16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"])
		.optional(),
	fidelity: z.number().min(0).max(1).optional(),
	outputImageFileName: z.string(),
});

export type ControlStyleArgs = z.infer<typeof ControlStyleArgsSchema>;

export const controlStyleToolDefinition = {
	name: "stability-ai-control-style",
	description: "Generate a new image in the style of a reference image",
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description:
					"The URI to the style reference image file. It should start with file://",
			},
			prompt: {
				type: "string",
				description: "What you wish to see in the output image",
			},
			negativePrompt: {
				type: "string",
				description: "Optional description of what you don't want to see",
			},
			aspectRatio: {
				type: "string",
				enum: [
					"16:9",
					"1:1",
					"21:9",
					"2:3",
					"3:2",
					"4:5",
					"5:4",
					"9:16",
					"9:21",
				],
				description: "Optional aspect ratio for the generated image",
			},
			fidelity: {
				type: "number",
				description:
					"How closely the output image's style should match the input (0-1)",
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

export const controlStyle = async (
	args: ControlStyleArgs,
	context: ResourceContext
) => {
	const validatedArgs = ControlStyleArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.controlStyle(imageFilePath, {
		prompt: validatedArgs.prompt,
		negativePrompt: validatedArgs.negativePrompt,
		aspectRatio: validatedArgs.aspectRatio,
		fidelity: validatedArgs.fidelity,
	});

	const imageAsBase64 = response.base64Image;
	const filename = `${validatedArgs.outputImageFileName}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);
	const file_location = resource.uri.replace("file://", "");
	open(file_location);

	return {
		content: [
			{
				type: "text",
				text: `Generated image "${validatedArgs.outputImageFileName}" in the style of "${validatedArgs.imageFileUri}"`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
