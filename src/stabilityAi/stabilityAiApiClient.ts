import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";
interface GenerateImageCoreOptions {
	aspectRatio?:
		| "16:9"
		| "1:1"
		| "21:9"
		| "2:3"
		| "3:2"
		| "4:5"
		| "5:4"
		| "9:16"
		| "9:21";
	negativePrompt?: string;
	seed?: number;
	stylePreset?:
		| "3d-model"
		| "analog-film"
		| "anime"
		| "cinematic"
		| "comic-book"
		| "digital-art"
		| "enhance"
		| "fantasy-art"
		| "isometric"
		| "line-art"
		| "low-poly"
		| "modeling-compound"
		| "neon-punk"
		| "origami"
		| "photographic"
		| "pixel-art"
		| "tile-texture";
	outputFormat?: "png" | "jpeg" | "webp";
}

interface OutpaintOptions {
	left?: number;
	right?: number;
	up?: number;
	down?: number;
	creativity?: number;
	prompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

interface SearchAndReplaceOptions {
	searchPrompt: string;
	prompt: string;
}

interface UpscaleCreativeOptions {
	prompt: string;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
	creativity?: number;
}

interface ControlSketchOptions {
	prompt: string;
	controlStrength?: number;
	negativePrompt?: string;
	seed?: number;
	outputFormat?: "png" | "jpeg" | "webp";
}

export class StabilityAiApiClient {
	private readonly apiKey: string;
	private readonly baseUrl = "https://api.stability.ai";
	private readonly axiosClient: AxiosInstance;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
		this.axiosClient = axios.create({
			baseURL: this.baseUrl,
			timeout: 120000,
			maxBodyLength: Infinity,
			maxContentLength: Infinity,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
			},
		});
	}

	// https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1core/post
	async generateImageCore(
		prompt: string,
		options?: GenerateImageCoreOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			prompt,
			output_format: "png",
			...options,
		};

		return this.axiosClient
			.postForm(
				`${this.baseUrl}/v2beta/stable-image/generate/core`,
				axios.toFormData(payload, new FormData())
			)
			.then((res) => {
				const base64Image = res.data.image;
				return {
					base64Image,
				};
			});
	}

	async removeBackground(
		imageFilePath: string
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/remove-background`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}

	async outpaint(
		imageFilePath: string,
		options: OutpaintOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: options.outputFormat || "png",
			left: options.left || 0,
			right: options.right || 0,
			up: options.up || 0,
			down: options.down || 0,
			...(options.creativity !== undefined && {
				creativity: options.creativity,
			}),
			...(options.prompt && { prompt: options.prompt }),
			...(options.seed && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/outpaint`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}

	async searchAndReplace(
		imageFilePath: string,
		options: SearchAndReplaceOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
			search_prompt: options.searchPrompt,
			prompt: options.prompt,
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/edit/search-and-replace`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}

	async upscaleFast(imageFilePath: string): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			output_format: "png",
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/upscale/fast`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error: any) {
			if (error.response?.status === 400 && error.response?.data?.errors) {
				const errorMessage = `Invalid parameters: ${error.response.data.errors.join(", ")}`;
				throw new Error(errorMessage);
			}
			throw new Error(
				`API error (${error.response?.status}): ${JSON.stringify(error.response?.data)}`
			);
		}
	}

	async fetchGenerationResult(id: string): Promise<{ base64Image: string }> {
		try {
			while (true) {
				const response = await this.axiosClient.get(
					`${this.baseUrl}/v2beta/results/${id}`,
					{
						headers: {
							Accept: "application/json",
						},
					}
				);

				if (response.status === 200) {
					return { base64Image: response.data.result };
				} else if (response.status === 202) {
					// Generation still in progress, wait 10 seconds before polling again
					await new Promise((resolve) => setTimeout(resolve, 10000));
				} else {
					throw new Error(`Unexpected status: ${response.status}`);
				}
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}

	async upscaleCreative(
		imageFilePath: string,
		options: UpscaleCreativeOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
			...(options.creativity !== undefined && {
				creativity: options.creativity,
			}),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/upscale/creative`,
				axios.toFormData(payload, new FormData())
			);

			// Get the generation ID from the response
			const generationId = response.data.id;

			// Poll for the result
			return await this.fetchGenerationResult(generationId);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}

	async controlSketch(
		imageFilePath: string,
		options: ControlSketchOptions
	): Promise<{ base64Image: string }> {
		const payload = {
			image: fs.createReadStream(imageFilePath),
			prompt: options.prompt,
			output_format: options.outputFormat || "png",
			...(options.controlStrength !== undefined && {
				control_strength: options.controlStrength,
			}),
			...(options.negativePrompt && {
				negative_prompt: options.negativePrompt,
			}),
			...(options.seed !== undefined && { seed: options.seed }),
		};

		try {
			const response = await this.axiosClient.postForm(
				`${this.baseUrl}/v2beta/stable-image/control/sketch`,
				axios.toFormData(payload, new FormData())
			);
			const base64Image = response.data.image;
			return { base64Image };
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const data = error.response.data;
				if (error.response.status === 400) {
					throw new Error(`Invalid parameters: ${data.errors.join(", ")}`);
				}
				throw new Error(
					`API error (${error.response.status}): ${JSON.stringify(data)}`
				);
			}
			throw error;
		}
	}
}
