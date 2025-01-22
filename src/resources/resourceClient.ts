import { Resource } from "@modelcontextprotocol/sdk/types.js";

export abstract class ResourceClient {
	abstract listResources(context?: ResourceContext): Promise<Resource[]>;
	abstract readResource(uri: string, context?: ResourceContext): Promise<Resource>;
	abstract createResource(uri: string, base64image: string, context?: ResourceContext): Promise<Resource>;
	abstract resourceToFile(uri: string, context?: ResourceContext): Promise<string>;

	protected getMimeType(filename: string): string {
		const ext = filename.toLowerCase().split(".").pop();
		switch (ext) {
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "png":
				return "image/png";
			case "gif":
				return "image/gif";
			default:
				return "application/octet-stream";
		}
	}
}

export interface ResourceContext {
	requestorIpAddress?: string;
}
