import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const ControlStructureArgsSchema = z.object({
	imageFileUri: z.string(),
	prompt: z.string().min(1).max(10000),
	controlStrength: z.number().min(0).max(1).optional(),
	negativePrompt: z.string().max(10000).optional(),
	outputImageFileName: z.string(),
});

export type ControlStructureArgs = z.infer<typeof ControlStructureArgsSchema>;

export const controlStructureToolDefinition = {
	name: "stability-ai-control-structure",
	description:
		"Generate a new image while maintaining the structure of a reference image",
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description:
					"The URI to the structure reference image file. It should start with file://",
			},
			prompt: {
				type: "string",
				description: "What you wish to see in the output image",
			},
			controlStrength: {
				type: "number",
				description:
					"How much influence the reference image has on the generation (0-1)",
			},
			negativePrompt: {
				type: "string",
				description: "Optional description of what you don't want to see",
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

export const controlStructure = async (
	args: ControlStructureArgs,
	context: ResourceContext
) => {
	const validatedArgs = ControlStructureArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	const response = await client.controlStructure(imageFilePath, {
		prompt: validatedArgs.prompt,
		controlStrength: validatedArgs.controlStrength,
		negativePrompt: validatedArgs.negativePrompt,
	});

	const imageAsBase64 = response.base64Image;
	const filename = `${validatedArgs.outputImageFileName}.png`;

	const resource = await resourceClient.createResource(filename, imageAsBase64);

	if (resource.uri.includes("file://")) {
		const file_location = resource.uri.replace("file://", "");
		open(file_location);
	}

	return {
		content: [
			{
				type: "text",
				text: `Generated image "${validatedArgs.outputImageFileName}" using the structure of "${validatedArgs.imageFileUri}"`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
