import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import { ResourceContext } from "../resources/resourceClient.js";
import open from "open";
import { z } from "zod";
import { getResourceClient } from "../resources/resourceClientFactory.js";

const ReplaceBackgroundAndRelightArgsSchema = z
	.object({
		imageFileUri: z.string(),
		backgroundPrompt: z.string().optional(),
		backgroundReferenceUri: z.string().optional(),
		foregroundPrompt: z.string().optional(),
		negativePrompt: z.string().optional(),
		preserveOriginalSubject: z.number().min(0).max(1).optional(),
		originalBackgroundDepth: z.number().min(0).max(1).optional(),
		keepOriginalBackground: z.boolean().optional(),
		lightSourceDirection: z
			.enum(["above", "below", "left", "right"])
			.optional(),
		lightReferenceUri: z.string().optional(),
		lightSourceStrength: z.number().min(0).max(1).optional(),
		outputImageFileName: z.string(),
	})
	.refine((data) => data.backgroundPrompt || data.backgroundReferenceUri, {
		message:
			"Either backgroundPrompt or backgroundReferenceUri must be provided",
	});

export type ReplaceBackgroundAndRelightArgs = z.infer<
	typeof ReplaceBackgroundAndRelightArgsSchema
>;

export const replaceBackgroundAndRelightToolDefinition = {
	name: "stability-ai-replace-background-and-relight",
	description: "Replace background and adjust lighting of an image",
	inputSchema: {
		type: "object",
		properties: {
			imageFileUri: {
				type: "string",
				description:
					"The URI to the subject image file. It should start with file://",
			},
			backgroundPrompt: {
				type: "string",
				description: "Description of the desired background",
			},
			backgroundReferenceUri: {
				type: "string",
				description: "Optional URI to a reference image for background style",
			},
			foregroundPrompt: {
				type: "string",
				description:
					"Optional description of the subject to prevent background bleeding",
			},
			negativePrompt: {
				type: "string",
				description: "Optional description of what you don't want to see",
			},
			preserveOriginalSubject: {
				type: "number",
				description: "How much to preserve the original subject (0-1)",
			},
			originalBackgroundDepth: {
				type: "number",
				description: "Control background depth matching (0-1)",
			},
			keepOriginalBackground: {
				type: "boolean",
				description: "Whether to keep the original background",
			},
			lightSourceDirection: {
				type: "string",
				enum: ["above", "below", "left", "right"],
				description: "Direction of the light source",
			},
			lightReferenceUri: {
				type: "string",
				description: "Optional URI to a reference image for lighting",
			},
			lightSourceStrength: {
				type: "number",
				description: "Strength of the light source (0-1)",
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

export const replaceBackgroundAndRelight = async (
	args: ReplaceBackgroundAndRelightArgs,
	context: ResourceContext
) => {
	const validatedArgs = ReplaceBackgroundAndRelightArgsSchema.parse(args);

	const resourceClient = getResourceClient();
	const imageFilePath = await resourceClient.resourceToFile(
		validatedArgs.imageFileUri,
		context
	);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY!);

	// Convert file URIs to file paths for reference images if provided
	let backgroundReference: string | undefined;
	if (validatedArgs.backgroundReferenceUri) {
		backgroundReference = await resourceClient.resourceToFile(
			validatedArgs.backgroundReferenceUri
		);
	}

	let lightReference: string | undefined;
	if (validatedArgs.lightReferenceUri) {
		lightReference = await resourceClient.resourceToFile(
			validatedArgs.lightReferenceUri
		);
	}

	const response = await client.replaceBackgroundAndRelight(imageFilePath, {
		backgroundPrompt: validatedArgs.backgroundPrompt,
		backgroundReference,
		foregroundPrompt: validatedArgs.foregroundPrompt,
		negativePrompt: validatedArgs.negativePrompt,
		preserveOriginalSubject: validatedArgs.preserveOriginalSubject,
		originalBackgroundDepth: validatedArgs.originalBackgroundDepth,
		keepOriginalBackground: validatedArgs.keepOriginalBackground,
		lightSourceDirection: validatedArgs.lightSourceDirection,
		lightReference,
		lightSourceStrength: validatedArgs.lightSourceStrength,
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
				text: `Processed image "${validatedArgs.imageFileUri}" with background and lighting adjustments`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
