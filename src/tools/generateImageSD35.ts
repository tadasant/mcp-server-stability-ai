import { z } from "zod";
import { ResourceContext } from "../resources/resourceClient.js";
import { getResourceClient } from "../resources/resourceClientFactory.js";
import { SD35Client } from "../stabilityAi/sd35Client.js";
import open from "open";

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
  "9:21"
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
  "tile-texture"
] as const;

const MODELS = [
  "sd3.5-large",
  "sd3.5-large-turbo",
  "sd3.5-medium",
  "sd3-large",
  "sd3-large-turbo",
  "sd3-medium"
] as const;

// Zod schema
const GenerateImageSD35ArgsSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
  aspectRatio: z.enum(ASPECT_RATIOS).optional().default("1:1"),
  negativePrompt: z.string().max(10000).optional(),
  stylePreset: z.enum(STYLE_PRESETS).optional(),
  cfgScale: z.number().min(1).max(10).optional(),
  seed: z.number().min(0).max(4294967294).optional(),
  model: z.enum(MODELS).optional().default("sd3.5-large"),
  outputFormat: z.enum(["jpeg", "png"]).optional().default("png"),
  outputImageFileName: z.string()
});

export type GenerateImageSD35Args = z.infer<typeof GenerateImageSD35ArgsSchema>;

// Tool definition
export const generateImageSD35ToolDefinition = {
  name: "stability-ai-generate-image-sd35",
  description: "Generate an image using Stable Diffusion 3.5 models with advanced configuration options.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results.",
        minLength: 1,
        maxLength: 10000
      },
      aspectRatio: {
        type: "string",
        enum: ASPECT_RATIOS,
        description: "Controls the aspect ratio of the generated image.",
        default: "1:1"
      },
      negativePrompt: {
        type: "string",
        description: "Keywords of what you do not wish to see in the output image. This helps avoid unwanted elements. Maximum 10000 characters.",
        maxLength: 10000
      },
      stylePreset: {
        type: "string",
        enum: STYLE_PRESETS,
        description: "Guides the image model towards a particular style."
      },
      cfgScale: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description: "How strictly the diffusion process adheres to the prompt text. Values range from 1-10, with higher values keeping your image closer to your prompt."
      },
      seed: {
        type: "number",
        minimum: 0,
        maximum: 4294967294,
        description: "A specific value that guides the 'randomness' of the generation. (Omit or use 0 for random seed)"
      },
      model: {
        type: "string",
        enum: MODELS,
        description: "The model to use for generation: SD3.5 Large (8B params, high quality), Medium (2.5B params, balanced), or Turbo (faster) variants. SD3.5 costs range from 3.5-6.5 credits per generation.",
        default: "sd3.5-large"
      },
      outputFormat: {
        type: "string",
        enum: ["jpeg", "png"],
        description: "The format of the output image.",
        default: "png"
      },
      outputImageFileName: {
        type: "string",
        description: "The desired name of the output image file, no file extension."
      }
    },
    required: ["prompt", "outputImageFileName"]
  }
} as const;

// Implementation
export const generateImageSD35 = async (
  args: GenerateImageSD35Args,
  context: ResourceContext
) => {
  const {
    prompt,
    aspectRatio,
    negativePrompt,
    stylePreset,
    cfgScale,
    seed,
    model,
    outputFormat,
    outputImageFileName
  } = GenerateImageSD35ArgsSchema.parse(args);

  const client = new SD35Client(process.env.STABILITY_AI_API_KEY);
  
  // Convert to SD35Client format
  const imageBuffer = await client.generateImage({
    prompt,
    aspect_ratio: aspectRatio,
    negative_prompt: negativePrompt,
    style_preset: stylePreset,
    cfg_scale: cfgScale,
    seed,
    model,
    output_format: outputFormat,
    mode: "text-to-image"
  });

  // Convert buffer to base64
  const imageAsBase64 = imageBuffer.toString('base64');
  const filename = `${outputImageFileName}.${outputFormat}`;

  const resourceClient = getResourceClient();
  const resource = await resourceClient.createResource(
    filename,
    imageAsBase64,
    context
  );

  if (resource.uri.includes("file://")) {
    const file_location = resource.uri.replace("file://", "");
    open(file_location);
  }

  return {
    content: [
      {
        type: "text",
        text: `Processed \`${prompt}\` with ${model} to create the following image:`,
      },
      {
        type: "resource",
        resource: resource,
      },
    ],
  };
};
