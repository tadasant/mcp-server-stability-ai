<div align="center">
 <h1><img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/mcp-server-stability-ai-logo.png" width="160px"><br/>Stability AI MCP Server</h1>
 <img src="https://img.shields.io/github/license/tadasant/mcp-server-stability-ai?style=flat-square&color=purple"/>
 <img src="https://img.shields.io/npm/v/mcp-server-stability-ai?style=flat-square&color=blue"/>
 <a href="https://smithery.ai/server/mcp-server-stability-ai"><img alt="Smithery Badge" src="https://smithery.ai/badge/mcp-server-stability-ai"></a>
</div>

<br/>

<div align="center">
  <a href="https://www.pulsemcp.com/servers/tadasant-stability-ai"><img src="https://www.pulsemcp.com/badge/top-pick/tadasant-stability-ai" width="400" alt="PulseMCP Badge"></a>
</div>

<br/>

Haven't heard about MCP yet? The easiest way to keep up-to-date is to read our [weekly newsletter at PulseMCP](https://www.pulsemcp.com/).

---

This is an MCP ([Model Context Protocol](https://modelcontextprotocol.io/)) Server integrating MCP Clients with [Stability AI](https://stability.ai/)'s latest & greatest Stable Diffusion image manipulation functionalities: generate, edit, upscale, and more.

Stability AI is a leading AI model provider and this server connects directly to their [hosted REST API](https://platform.stability.ai/docs/api-reference). You will need to sign up for an [API Key from stability.ai](https://platform.stability.ai/account/keys) to get started.

They provide 25 credits for free. Afterward, [pay-as-you-go pricing](https://platform.stability.ai/pricing) is very reasonable: $0.01/credit, where 3 credits gets you an image generation on their Core model. So 100 high quality images = just $3.

This project is NOT officially affiliated with Stability AI.

[Demo video](https://youtu.be/7ceSgVC4ZLs), and a teaser here:

![Teaser](https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/teaser.gif)

<div style="display: flex; flex-direction: row;">
  <img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/teaser-1.png" style="width: 48%;" />
  <img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/teaser-2.png" style="width: 48%;" />
</div>

<br/>

# Table of Contents

- [Highlights](#highlights)
- [Capabilities](#capabilities)
- [Usage Tips](#usage-tips)
- [Examples](#examples)
- [Setup](#setup)
  - [Cheatsheet](#cheatsheet)
  - [Claude Desktop](#claude-desktop)
    - [Manual Setup](#manual-setup)

# Highlights

**No learning curve**: This server is designed to use sensible defaults and provide simple, smooth UX for the most common actions related to generating and manipulating image files. You don't need to be technical or understand anything about image models to use it effectively.

**Chain manipulations**: You can generate an image, then replace an item within it, then remove the background... all in a single Claude conversation.

**Minimal configuration**: All you need to get started is a Stability AI API key. Set environment variables for that and a local directory path to store output images, and you're ready to go.

**Leverage the best in class image models**: Stability AI is the leading provider of image models exposed via API. Using this server integrates them into Claude or another MCP client - head and shoulders above an experience like using DALL-E models in ChatGPT.

# Capabilities

This server is built and tested on macOS with Claude Desktop. It should work with other MCP clients as well.

| Tool Name                        | Description                                                                                        | Estimated Stability API Cost |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `generate-image`                 | Generate a high quality image of anything based on a provided prompt & other optional parameters.  | $0.03                        |
| `generate-image-sd35`            | Generate an image using Stable Diffusion 3.5 models with advanced configuration options.           | $0.04-$0.07                  |
| `remove-background`              | Remove the background from an image.                                                               | $0.02                        |
| `outpaint`                       | Extend an image in any direction while maintaining visual consistency.                             | $0.04                        |
| `search-and-replace`             | Replace objects or elements in an image by describing what to replace and what to replace it with. | $0.04                        |
| `upscale-fast`                   | Enhance image resolution by 4x.                                                                    | $0.01                        |
| `upscale-creative`               | Enhance image resolution up to 4K.                                                                 | $0.25                        |
| `control-sketch`                 | Translate hand-drawn sketch to production-grade image.                                             | $0.03                        |
| `control-style`                  | Generate an image in the style of a reference image.                                               | $0.04                        |
| `control-structure`              | Generate an image while maintaining the structure of a reference image.                            | $0.03                        |
| `replace-background-and-relight` | Replace the background of an image and relight it.                                                 | $0.08                        |
| `search-and-recolor`             | Search for and recolor objects in an image.                                                        | $0.05                        |

# Usage Tips

- All processed images are automatically saved to `IMAGE_STORAGE_DIRECTORY`, opened for preview, and made available as resources
- Do _not_ try to copy/paste or upload image files to Claude. Claude does not store images anywhere, so we cannot work with those with the MCP server. They have to be "uploaded" (saved to) the `IMAGE_STORAGE_DIRECTORY` and then they will show up as resources available in the chat.
- You can use Prompts that come preloaded instead of writing your own verbiage:

<img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/prompts.png" width="500" alt="Prompts">

# Examples

## Generate an image

1. `Generate an image of a cat`
2. `Generate a photorealistic image of a cat in a cyberpunk city, neon lights reflecting off its fur, 16:9 aspect ratio`
3. `Generate a detailed digital art piece of a cat wearing a space suit floating through a colorful nebula, style preset: digital-art, aspect ratio: 21:9`

## Generate an image with SD3.5

1. `Generate an image of a woman with cybernetic wolf ears using the SD3.5 model, with the "neon-punk" style preset`
2. `Generate an image of a futuristic city using the SD3.5 Large Turbo model, with aspect ratio 16:9`
3. `Generate an image of an astronaut on mars using the SD3.5 Large model, with cfg scale 7.5, "analog-film" style preset, and seed 42`

## Remove background

1. `Remove the background from the image I just generated`
2. `Remove the background from product-photo.jpg to prepare it for my e-commerce site`
3. `Remove the background from group-photo.png so I can composite it with another image`

## Outpaint (Uncrop)

1. `Extend vacation-photo.jpg 500 pixels to the right to include more of the beach`
2. `Extend family-portrait.png 300 pixels up to show more of the mountains, and 200 pixels right to include more landscape`
3. `Extend artwork.png in all directions to create a wider fantasy forest scene that matches the original environment`

## Search and Replace

1. `In my last image, replace the red car with a blue car`
2. `In portrait.png, replace the plain background with a sunset over mountains`
3. `In landscape.jpg, replace the modern buildings with victorian-era architecture while maintaining the same atmosphere`

## Upscale

1. `Upscale profile-pic.jpg for better resolution`
2. `Upscale product-photo.png to make it print-ready`

And then, if the output still isn't good enough, you can upscale it again:

1. `Try again with better quality`

## Control Sketch

1. `Transform sketch.png into a colored illustration for a children's book`
2. `Convert wireframe.jpg into a detailed 3D render for a modern architectural visualization`

## Control Style

1. `Generate an image in the style of the reference image`

## Control Structure

1. `Generate an image while maintaining the structure of the reference image`

## Replace Background and Relight

1. `Replace the background of the image I just generated with a sunset over mountains`

## Search and Recolor

1. `In my last image, make the red car be blue instead`

# Setup

## Metadata Logging

The server can save metadata from image generation requests to help with tracking and troubleshooting.

| Environment Variable     | Description                                         | Required | Default Value |
| ------------------------ | --------------------------------------------------- | -------- | ------------- |
| `SAVE_METADATA`          | Save metadata for successful image generations      | N        | `true`        |
| `SAVE_METADATA_FAILED`   | Save metadata for failed image generations          | N        | `false`       |

When enabled, a `.txt` file with the same name as the generated image will be created in the same directory. This file contains:

- Timestamp of the request
- All request parameters (prompt, model, style preset, etc.)
- Response information (success status, generation time)

This file will also be created for failed requests if `SAVE_METADATA_FAILED` is enabled.

## Cheatsheet

| Environment Variable      | Description                                                                                               | Required           | Default Value                                                                           | Example                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `STABILITY_AI_API_KEY`    | Your Stability AI API key. Get one at [platform.stability.ai](https://platform.stability.ai/account/keys) | Y                  | N/A                                                                                     | `sk-1234567890`                                                         |
| `IMAGE_STORAGE_DIRECTORY` | Directory where generated images will be saved                                                            | N                  | `/tmp/tadasant-mcp-server-stability-ai` OR `C:\\Windows\\Temp\\mcp-server-stability-ai` | `/Users/admin/Downloads/stability-ai-images` (Mac OS/Linux), `C:\\Users\\Admin\\Downloads\\stability-ai-images` (Windows)|
| `SAVE_METADATA`           | Save metadata for successful image generations                                                            | N                  | `true`                                                                                  | `true` or `false`                                                       |
| `SAVE_METADATA_FAILED`    | Save metadata for failed image generations                                                                | N                  | `true`                                                                                  | `true` or `false`                                                       |
| `GCS_PROJECT_ID`          | Google Cloud Project ID for storing images                                                                | N (Y if using SSE) | N/A                                                                                     | `your-project-id`                                                       |
| `GCS_CLIENT_EMAIL`        | Google Cloud Service Account client email for storing images                                              | N (Y if using SSE) | N/A                                                                                     | `your-service-account@project.iam.gserviceaccount.com`                  |
| `GCS_PRIVATE_KEY`         | Google Cloud Service Account private key for storing images                                               | N (Y if using SSE) | N/A                                                                                     | `-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n` |
| `GCS_BUCKET_NAME`         | Google Cloud Storage bucket name for storing images                                                       | N (Y if using SSE) | N/A                                                                                     | `your-bucket-name`                                                      |

## Claude Desktop

If you prefer a video tutorial, here's [a quick one](https://youtu.be/7ceSgVC4ZLs).

Create a folder directory somewhere on your machine to store generated/modified images. Some options:

- `/Users/<username>/Downloads/stability-ai-images`
- `/Users/<username>/Library/Application Support/Claude/mcp-server-stability-ai/images`

And make sure you have an [API key from Stability AI](https://platform.stability.ai/account/keys).

Then proceed to your preferred method of configuring the server below. If this is your first time using MCP Servers, you'll want to make sure you have the [Claude Desktop application](https://claude.ai/download) and follow the [official MCP setup instructions](https://modelcontextprotocol.io/quickstart/user).

### Manual Setup

You're going to need Node working on your machine so you can run `npx` commands in your terminal. If you don't have Node, you can install it from [nodejs.org](https://nodejs.org/en/download).

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Modify your `claude_desktop_config.json` file to add the following:

```
{
  "mcpServers": {
    "stability-ai": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-stability-ai"
      ],
      "env": {
        "STABILITY_AI_API_KEY": "sk-1234567890"
      }
    }
  }
}
```

Restart Claude Desktop and you should be ready to go:

<img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/claude-1.png" width="500" alt="Claude First Image">

<img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/claude-2.png" width="500" alt="Claude Second Image">

### Installing via Smithery

To install for Claude Desktop automatically via [Smithery](https://smithery.ai/server/mcp-server-stability-ai):

```bash
npx @smithery/cli install mcp-server-stability-ai --client claude
```

## SSE Mode

This server has the option to run in SSE mode by starting it with the following command:

```bash
npx mcp-server-stability-ai -y --sse
```

This mode is useful if you intend to deploy this server for third party usage over HTTP.

You will need to set the `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_BUCKET_NAME`, and `GCS_PRIVATE_KEY` environment variables, because the server will store image files in Google Cloud Storage instead of its local filesystem.

Note that the scheme for multitenancy is very naive and insecure: it uses the requestor's IP address to segment the GCS prefixes used to the store the images, and makes all images publicly accessible in order to communicate them back to the MCP client. So in theory, if someone knows your IP address and then name(s) of files you generated, they could access your images by guessing the URL.

## Roadmap

Recently completed:
- ✅ Added support for Stable Diffusion 3.5 models
- ✅ Added support for Stable Image Ultra
- ✅ Added metadata logging for image generation requests

These are coming soon; but PR's are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

- `inpaint` - A more precise version of `search-and-x` functionalities, requires mananging a mask to define to area to replace.
- Base image manipulation (crop, rotate, resize, etc.): likely as its own MCP server
- Ability to inpaint one image into another image. Doesn't seem possible with Stability API; will probably want another MCP server hitting a different API to accomplish this.
- MCP client custom-made for image manipulation

# Contributing

External contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

Also please feel free to raise issues or feature requests; love seeing how people are using this and how it could be made better.
