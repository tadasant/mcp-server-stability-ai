import { ResourceContext } from "../resources/resourceClient.js";
import { getResourceClient } from "../resources/resourceClientFactory.js";

export const listResourcesToolDefinition = {
	name: "stability-ai-0-list-resources",
	description:
		"Use this to check for files before deciding you don't have access to a file or image or resource. It pulls in a list of all of user's available Resources (i.e. image files and their URI's) so we can reference pre-existing images to manipulate or upload to Stability AI.",
	inputSchema: {
		type: "object",
		properties: {},
		required: [],
	},
} as const;

// List all available Resources via tool. Useful for clients that have limited capability for referencing resources within tool calls.
export const listResources = async (context: ResourceContext) => {
	const resourceClient = getResourceClient();
	const resources = await resourceClient.listResources(context);

	return {
		content: resources.map((r) => ({
			type: "resource",
			resource: {
				uri: r.uri,
				name: r.name,
				mimeType: r.mimeType,
				text: `Image: ${r.name} at URI: ${r.uri}`,
			},
		})),
	};
};
