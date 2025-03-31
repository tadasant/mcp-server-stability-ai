import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { z } from "zod";
import { ResourceContext } from "../resources/resourceClient.js";
import { getResourceClient } from "../resources/resourceClientFactory.js";
import { saveMetadata } from "../utils/metadataUtils.js";

// Constants for shared values
const ASPECT_RATIOS = [
	"16:9",
	"1:1",
	"21:9",
	"2:3",
	"3:2",
	"4:5",
	"5:4",
	"9:16",
	"9:21",
] as const;

const STYLE_PRESETS = [
	"3d-model",
	"analog-film",
	"anime",
	"cinematic",
	"comic-book",
	"digital-art",
	"enhance",
	"fantasy-art",
	"isometric",
	"line-art",
	"low-poly",
	"modeling-compound",
	"neon-punk",
	"origami",
	"photographic",
	"pixel-art",
	"tile-texture",
] as const;

const DESCRIPTIONS = {
	prompt:
		"What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results.\n\nTo control the weight of a given word use the format (word:weight), where word is the word you'd like to control the weight of and weight is a value between 0 and 1. For example: The sky was a crisp (blue:0.3) and (green:0.8) would convey a sky that was blue and green, but more green than blue.",
	aspectRatio: "Controls the aspect ratio of the generated image.",
	negativePrompt:
		"A blurb of text describing what you do not wish to see in the output image. This is an advanced feature. If your user does not give specific guidance for a negative prompt, fill in some sensible defaults based on how descriptive the user is about their intended image",
	stylePreset: "Guides the image model towards a particular style.",
	outputImageFileName:
		"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
} as const;

// Zod schema
const GenerateImageCoreArgsSchema = z.object({
	prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
	aspectRatio: z.enum(ASPECT_RATIOS).optional().default("1:1"),
	negativePrompt: z.string().max(10000).optional(),
	stylePreset: z.enum(STYLE_PRESETS).optional(),
	outputImageFileName: z.string(),
});

export type generateImageCoreArgs = z.infer<typeof GenerateImageCoreArgsSchema>;
// Alias for backwards compatibility
export type GenerateImageCoreArgs = generateImageCoreArgs;

// Tool definition using the same constants
export const generateImageCoreToolDefinition = {
	name: "stability-ai-generate-image-core",
	description: "Generate an image using Stability AI's Core API service based on a provided prompt. This model and endpoint is a sensible default to use when not prompted to use a specific one, opffering a good balance of cost and quality",
	inputSchema: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description: DESCRIPTIONS.prompt,
				minLength: 1,
				maxLength: 10000,
			},
			aspectRatio: {
				type: "string",
				enum: ASPECT_RATIOS,
				description: DESCRIPTIONS.aspectRatio,
				default: "1:1",
			},
			negativePrompt: {
				type: "string",
				description: DESCRIPTIONS.negativePrompt,
				maxLength: 10000,
			},
			stylePreset: {
				type: "string",
				enum: STYLE_PRESETS,
				description: DESCRIPTIONS.stylePreset,
			},
			outputImageFileName: {
				type: "string",
				description: DESCRIPTIONS.outputImageFileName,
			},
		},
		required: ["prompt", "outputImageFileName"],
	},
} as const;

// Tool definition is now defined solely in generateImage.ts for backward compatibility

export const generateImageCore = async (
	args: GenerateImageCoreArgs,
	context: ResourceContext
) => {
	const {
		prompt,
		aspectRatio,
		negativePrompt,
		stylePreset,
		outputImageFileName,
	} = GenerateImageCoreArgsSchema.parse(args);

	// Capture request parameters for metadata
	const requestParams = {
		prompt,
		aspectRatio,
		negativePrompt,
		stylePreset,
		model: "core",
		outputImageFileName,
	};

	try {
		const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);
		const response = await client.generateImageCore(prompt, {
			aspectRatio,
			negativePrompt,
			stylePreset,
		});

		const imageAsBase64 = response.base64Image;
		const filename = `${outputImageFileName}.png`;

		const resourceClient = getResourceClient();
		const resource = await resourceClient.createResource(
			filename,
			imageAsBase64,
			context
		);

		if (resource.uri.includes("file://")) {
			const file_location = resource.uri.replace("file://", "");
			
			// Save metadata to a text file
			saveMetadata(file_location, requestParams, { 
				responseType: "success", 
				timeGenerated: new Date().toISOString() 
			});
			
			open(file_location);
		}

		return {
			content: [
				{
					type: "text",
					text: `Processed \`${prompt}\` with Stability Core to create the following image:`,
				},
				{
					type: "resource",
					resource: resource,
				},
			],
		};
	} catch (error) {
		// Handle errors and save error metadata if enabled
		if (process.env.SAVE_METADATA_FAILED === 'true') {
			// Create a temp path for the failed request metadata
			const errorFilePath = `${process.env.IMAGE_STORAGE_DIRECTORY}/${outputImageFileName}-failed-${Date.now()}.txt`;
			saveMetadata(errorFilePath, requestParams, undefined, error as Error | string);
		}
		throw error;
	}
};

// The original function is now defined solely in generateImage.ts for backward compatibility
