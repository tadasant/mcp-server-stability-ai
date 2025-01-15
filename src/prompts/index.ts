import { controlSketchToolDefinition } from "../tools/controlSketch.js";
import { generateImageToolDefinition } from "../tools/generateImage.js";
import { listResourcesToolDefinition } from "../tools/listResources.js";
import { searchAndReplaceToolDefinition } from "../tools/searchAndReplace.js";
import { upscaleCreativeToolDefinition } from "../tools/upscaleCreative.js";
import { upscaleFastToolDefinition } from "../tools/upscaleFast.js";

// Expect template to have {{variable}} entries and replace them with args[variable]
export const injectPromptTemplate = (
	template: string,
	args: Record<string, string> | undefined
) => {
	if (!args) {
		return template;
	}

	return template.replace(/{{(.*?)}}/g, (match, p1) => args[p1] || match);
};

export const prompts = [
	{
		name: "generate-image-from-text",
		description:
			"Generate a new image with configurable description, style, and aspect ratio",
		template: `Generate an image for the user using ${generateImageToolDefinition.name}. Make sure to ask the user for feedback after the generation.`,
	},
	{
		name: "generate-image-from-sketch",
		description: "Generate an image from a hand-drawn sketch",
		template: `The user should provide an image name or location of a sketch image that matches a resource from ${listResourcesToolDefinition.name} (if the results from this tool are not in recent conversation history, run it again so you have an up-to-date list of resources). Try using ${controlSketchToolDefinition.name} to generate an image from the indicated sketch. Make sure to ask the user for feedback after the generation.`,
	},
	{
		name: "upscale-image",
		description: "Upscale the quality of an image",
		template: `The user should provide an image name or location that matches a resource from ${listResourcesToolDefinition.name} (if the results from this tool are not in recent conversation history, run it again so you have an up-to-date list of resources). Try using ${upscaleFastToolDefinition.name} to upscale the indicated image. Ask the user what they think of the result. If it's not good enough, then try again with ${upscaleCreativeToolDefinition.name} on the ORIGINAL image. Make sure to ask the user for feedback after the upscaling.`,
	},
	{
		name: "edit-image",
		description: "Make a minor modification to an existing image",
		template: `The user should provide an image name or location that matches a resource from ${listResourcesToolDefinition.name} (if the results from this tool are not in recent conversation history, run it again so you have an up-to-date list of resources).
    
    At this time, we can only perform two kinds of changes:
    - "search and replace": the user must provide some object in the image to "search for" and some object in the image to "replace with"
    - "search and recolor": the user must provide some object(s) in the image to "search for" and some color(s) to "recolor with"
    - "remove background": self explanatory; we attempt to make the background of the image transparent
    - "replace background and relight": the user must provide context for what kind of new background they want either as text or as a reference image (which we'll need to grab the URI for)
    
    Examples of invalid changes we cannot perform at this time:
    - Add {object} (without removing anything)
    - Tweak {object} (in a way we cannot rephrase to replace it altogether)
    
    If the user provided something like this, then we should not proceed; inform the user we can only do "search and replace" or "remove background" changes.
    
    Make sure to ask the user for feedback after any generation attempt.`,
	},
];
