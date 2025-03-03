import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";

interface GenerateImageOptions {
  prompt: string;
  mode?: "text-to-image" | "image-to-image";
  image?: string; // Path to image file for image-to-image
  strength?: number; // For image-to-image mode, range 0-1
  aspect_ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "9:21";
  model?: "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3-large" | "sd3-large-turbo" | "sd3-medium";
  seed?: number; // Range 0-4294967294
  output_format?: "jpeg" | "png";
  style_preset?: "3d-model" | "analog-film" | "anime" | "cinematic" | "comic-book" | "digital-art" | "enhance" | "fantasy-art" | "isometric" | "line-art" | "low-poly" | "modeling-compound" | "neon-punk" | "origami" | "photographic" | "pixel-art" | "tile-texture";
  negative_prompt?: string; // Max 10000 characters
  cfg_scale?: number; // Range 1-10
}

export class SD35Client {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.stability.ai";
  private readonly axiosClient: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "image/*",
      },
    });
  }

  async generateImage(options: GenerateImageOptions): Promise<Buffer> {
    const formData = new FormData();
    
    // Required parameter
    if (!options.prompt || options.prompt.length === 0) {
      throw new Error("Prompt is required and cannot be empty");
    }
    if (options.prompt.length > 10000) {
      throw new Error("Prompt cannot exceed 10000 characters");
    }
    formData.append("prompt", options.prompt);
    
    // Set the mode (default to text-to-image)
    const mode = options.mode || "text-to-image";
    formData.append("mode", mode);
    
    // Add specific parameters based on mode
    if (mode === "image-to-image") {
      if (!options.image) {
        throw new Error("Image path is required for image-to-image mode");
      }
      formData.append("image", fs.createReadStream(options.image));
      
      // Strength is required for image-to-image
      if (options.strength === undefined) {
        throw new Error("Strength parameter is required for image-to-image mode");
      }
      if (options.strength < 0 || options.strength > 1) {
        throw new Error("Strength must be between 0 and 1");
      }
      formData.append("strength", options.strength.toString());
    } else {
      // aspect_ratio is only valid for text-to-image
      if (options.aspect_ratio) {
        formData.append("aspect_ratio", options.aspect_ratio);
      }
    }
    
    // Optional parameters
    if (options.model) {
      formData.append("model", options.model);
    }
    
    if (options.seed !== undefined) {
      if (options.seed < 0 || options.seed > 4294967294) {
        throw new Error("Seed must be between 0 and 4294967294");
      }
      formData.append("seed", options.seed.toString());
    }
    
    if (options.output_format) {
      formData.append("output_format", options.output_format);
    }
    
    if (options.style_preset) {
      formData.append("style_preset", options.style_preset);
    }
    
    if (options.negative_prompt) {
      if (options.negative_prompt.length > 10000) {
        throw new Error("Negative prompt cannot exceed 10000 characters");
      }
      formData.append("negative_prompt", options.negative_prompt);
    }
    
    if (options.cfg_scale !== undefined) {
      if (options.cfg_scale < 1 || options.cfg_scale > 10) {
        throw new Error("CFG scale must be between 1 and 10");
      }
      formData.append("cfg_scale", options.cfg_scale.toString());
    }
    
    try {
      const response = await this.axiosClient.post(
        "/v2beta/stable-image/generate/sd3",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          responseType: "arraybuffer",
        }
      );
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        if (error.response.status === 400) {
          let errorMessage = "Invalid parameters";
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage += `: ${data.errors.join(", ")}`;
          }
          throw new Error(errorMessage);
        }
        throw new Error(`API error (${error.response.status}): ${JSON.stringify(data)}`);
      }
      throw error;
    }
  }
}
