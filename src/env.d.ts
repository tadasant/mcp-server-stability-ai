declare global {
	namespace NodeJS {
		interface ProcessEnv {
			STABILITY_AI_API_KEY: string;
			IMAGE_STORAGE_DIRECTORY: string;
			[key: string]: string | undefined;
		}
	}
}

export {};
