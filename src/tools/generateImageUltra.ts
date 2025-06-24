import { z } from "zod";
import { ResourceContext } from "../resources/resourceClient.js";
import { getResourceClient } from "../resources/resourceClientFactory.js";
import { StabilityAiApiClient } from "../stabilityAi/stabilityAiApiClient.js";
import open from "open";
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

const OUTPUT_FORMATS = ["jpeg", "png", "webp"] as const;

// Zod schema
const GenerateImageUltraArgsSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty").max(10000),
  aspectRatio: z.enum(ASPECT_RATIOS).optional().default("1:1"),
  negativePrompt: z.string().max(10000).optional(),
  stylePreset: z.enum(STYLE_PRESETS).optional(),
  seed: z.number().min(0).max(4294967294).optional(),
  outputFormat: z.enum(OUTPUT_FORMATS).optional().default("png"),
  outputImageFileName: z.string()
});

export type GenerateImageUltraArgs = z.infer<typeof GenerateImageUltraArgsSchema>;

// Tool definition
export const generateImageUltraToolDefinition = {
  name: "stability-ai-generate-image-ultra",
  description: "Generate an image using Stability AI's most advanced Ultra service, offering high quality images with unprecedented prompt understanding, excellent typography, complex compositions, and dynamic lighting. Note that Ultra is significantly expensive than Core models, and should not be a default option when prompted to generate an image unless specifically instructed to use Ultra for a session in advance.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "What you wish to see in the output image. A strong, descriptive prompt that clearly defines elements, colors, and subjects will lead to better results. To control the weight of a given word use the format (word:weight), where word is the word you'd like to control the weight of and weight is a value between 0 and 1",
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
        description: "Keywords of what you do not wish to see in the output image. This helps avoid unwanted elements. Maximum 10000 characters. If your user does not give specific guidance for a negative prompt, fill in some sensible defaults based on how descriptive the user is about their intended image",
        maxLength: 10000
      },
      stylePreset: {
        type: "string",
        enum: STYLE_PRESETS,
        description: "Guides the image model towards a particular style."
      },
      seed: {
        type: "number",
        minimum: 0,
        maximum: 4294967294,
        description: "A specific value that guides the 'randomness' of the generation. (Omit or use 0 for random seed)"
      },
      outputFormat: {
        type: "string",
        enum: OUTPUT_FORMATS,
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
export const generateImageUltra = async (
  args: GenerateImageUltraArgs,
  context: ResourceContext
) => {
  const {
    prompt,
    aspectRatio,
    negativePrompt,
    stylePreset,
    seed,
    outputFormat,
    outputImageFileName
  } = GenerateImageUltraArgsSchema.parse(args);

  // Capture request parameters for metadata
  const requestParams = {
    prompt,
    aspectRatio,
    negativePrompt,
    stylePreset,
    seed,
    outputFormat,
    model: "ultra",
    outputImageFileName
  };

  try {
    const client = new StabilityAiApiClient(process.env.STABILITY_AI_API_KEY);
    
    // Make the API call to the Ultra endpoint
    const response = await client.generateImageUltra(prompt, {
      aspectRatio,
      negativePrompt,
      stylePreset,
      seed,
      outputFormat
    });

    const imageAsBase64 = response.base64Image;
    const filename = `${outputImageFileName}.${outputFormat}`;

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
          text: `Processed \`${prompt}\` with Stable Image Ultra to create the following image:`,
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
