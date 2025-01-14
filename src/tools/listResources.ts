import { ResourceClient } from "../resources/resourceClient.js";

export const listResourcesToolDefinition = {
	name: "stability-ai-0-list-resources",
	description:
		"Pull in a list of all of user's available Resources (i.e. image files and their URI's) so we can reference pre-existing images to manipulate or upload to Stability AI.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
} as const;

// List all available Resources via tool. Useful for clients that have limited capability for referencing resources within tool calls.
export const listResources = async () => {
	const resourceClient = new ResourceClient(
		process.env.IMAGE_STORAGE_DIRECTORY
	);
	const resources = await resourceClient.listResources();

	return {
		content: resources.map((r) => ({
			type: "resource",
			resource: {
				uri: r.uri,
				name: r.name,
				mimeType: r.mimeType,
				text: `Image: ${r.name}`,
			},
		})),
	};
};
