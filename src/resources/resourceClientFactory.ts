import { ResourceClient } from "./resourceClient.js";
import { FilesystemResourceClient } from "./filesystemResourceClient.js";
import { GcsResourceClient } from "./gcsResourceClient.js";
import { GcsClient } from "../gcs/gcsClient.js";

let instance: ResourceClient | null = null;

export type ResourceClientConfig =
	| {
			type: "filesystem";
			imageStorageDirectory: string;
	  }
	| {
			type: "gcs";
			gcsConfig?: {
				privateKey?: string;
				clientEmail?: string;
				projectId?: string;
				bucketName?: string;
			};
	  };

export function initializeResourceClient(config: ResourceClientConfig) {
	if (instance) {
		throw new Error("ResourceClient has already been initialized");
	}

	if (config.type === "filesystem") {
		instance = new FilesystemResourceClient(config.imageStorageDirectory);
	} else {
		const gcsClient = new GcsClient(config.gcsConfig);
		instance = new GcsResourceClient(gcsClient);
	}
}

export function getResourceClient(): ResourceClient {
	if (!instance) {
		throw new Error("ResourceClient has not been initialized");
	}
	return instance;
}
