// This file is now just a forwarder to generateImageCore.js for backward compatibility
// Import and re-export from generateImageCore.js
import { generateImageCore, generateImageCoreArgs as CoreArgs, generateImageCoreToolDefinition } from "./generateImageCore.js";
import { ResourceContext } from "../resources/resourceClient.js";

// Re-export renamed to avoid conflicts (this will be used by the core app)
export type GenerateImageArgs = CoreArgs;

// Tool definition for backward compatibility
export const generateImageToolDefinition = {
	...generateImageCoreToolDefinition,
	name: "stability-ai-generate-image",
	description: "Generate an image of anything based on a provided prompt. Uses the Stability Core API."
};

// Implementation for backward compatibility
export const generateImage = async (
	args: GenerateImageArgs,
	context: ResourceContext
) => {
	return generateImageCore(args, context);
};
