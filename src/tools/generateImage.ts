import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
import { z } from "zod";
import { ResourceClient } from "../resources/resourceClient.js";

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
		"A blurb of text describing what you do not wish to see in the output image. This is an advanced feature.",
	stylePreset: "Guides the image model towards a particular style.",
	outputImageFileName:
		"The desired name of the output image file, no file extension. Make it descriptive but short. Lowercase, dash-separated, no special characters.",
} as const;

// Zod schema
const GenerateImageArgsSchema = z.object({
	prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
	aspectRatio: z.enum(ASPECT_RATIOS).optional().default("1:1"),
	negativePrompt: z.string().max(10000).optional(),
	stylePreset: z.enum(STYLE_PRESETS).optional(),
	outputImageFileName: z.string(),
});

export type GenerateImageArgs = z.infer<typeof GenerateImageArgsSchema>;

// Tool definition using the same constants
export const generateImageToolDefinition = {
	name: "stability-ai-generate-image",
	description: "Generate an image of anything based on a provided prompt.",
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

export const generateImage = async (args: GenerateImageArgs) => {
	const {
		prompt,
		aspectRatio,
		negativePrompt,
		stylePreset,
		outputImageFileName,
	} = GenerateImageArgsSchema.parse(args);

	const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);
	const response = await client.generateImageCore(prompt, {
		aspectRatio,
		negativePrompt,
		stylePreset,
	});

	const imageAsBase64 = response.base64Image;
	const filename = `${outputImageFileName}.png`;

	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const resource = await resourceClient.createResource(filename, imageAsBase64);

	const file_location = resource.uri.replace("file://", "");
	open(file_location);

	return {
		content: [
			{
				type: "text",
				text: `Processed \`${prompt}\` to create the following image:`,
			},
			{
				type: "resource",
				resource: resource,
			},
		],
	};
};
