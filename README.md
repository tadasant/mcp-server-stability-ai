<div align="center">
 <h1><img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/mcp-server-stability-ai-logo.png" width="160px"><br/>Stability AI MCP Server</h1>
 <img src="https://img.shields.io/github/license/tadasant/mcp-server-stability-ai?style=flat-square&color=purple"/>
 <img src="https://img.shields.io/npm/v/mcp-server-stability-ai?style=flat-square&color=blue"/>
</div>

<br/>

This is an MCP ([Model Context Protocol](https://modelcontextprotocol.io/)) Server integrating MCP Clients with [Stability AI](https://stability.ai/)'s latest & greatest Stable Diffusion image manipulation functionalities: generate, edit, upscale, and more.

Stability AI is a leading AI model provider and this server connects directly to their [hosted REST API](https://platform.stability.ai/docs/api-reference). You will need to sign up for an [API Key from stability.ai](https://platform.stability.ai/account/keys) to get started.

They provide 25 credits for free. Afterward, [pay-as-you-go pricing](https://platform.stability.ai/pricing) is very reasonable: $0.01/credit, where 3 credits gets you an image generation on their Core model. So 100 high quality images = just $3.

This project is NOT officially affiliated with Stability AI.

Here's a teaser of how it works:

<div style="display: flex; flex-direction: row; gap: 1rem;">
  <img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/teaser-1.png" style="width: 45%;" />
  <img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/teaser-2.png" style="width: 45%;" />
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

| Tool Name            | Description                                                                                        | Estimated Stability API Cost |
| -------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `generate-image`     | Generate a high quality image of anything based on a provided prompt & other optional parameters.  | $0.03                        |
| `remove-background`  | Remove the background from an image.                                                               | $0.02                        |
| `outpaint`           | Extend an image in any direction while maintaining visual consistency.                             | $0.04                        |
| `search-and-replace` | Replace objects or elements in an image by describing what to replace and what to replace it with. | $0.04                        |
| `upscale-fast`       | Enhance image resolution by 4x.                                                                    | $0.01                        |
| `upscale-creative`   | Enhance image resolution up to 4K.                                                                 | $0.25                        |
| `control-sketch`     | Translate hand-drawn sketch to production-grade image.                                             | $0.03                        |

# Usage Tips

- All processed images are automatically saved to your configured `IMAGE_STORAGE_DIRECTORY` and opened for preview
- Unfortunately, pasting images into the Claude Desktop chat window results in a very inefficient experience (generating entire blocks of base64 text rapidly fills the context window for anything but the simplest of images). So we take a very file-forward approach: you should copy image files you want processed to your `IMAGE_STORAGE_DIRECTORY` and then just reference them by filename in your chats with Claude.

# Examples

## Generate an image

1. `Generate an image of a cat`
2. `Generate a photorealistic image of a cat in a cyberpunk city, neon lights reflecting off its fur, 16:9 aspect ratio`
3. `Generate a detailed digital art piece of a cat wearing a space suit floating through a colorful nebula, style preset: digital-art, aspect ratio: 21:9`

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

# Setup

## Cheatsheet

| Environment Variable      | Description                                                                                               | Example                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `STABILITY_AI_API_KEY`    | Your Stability AI API key. Get one at [platform.stability.ai](https://platform.stability.ai/account/keys) | `sk-1234567890`                              |
| `IMAGE_STORAGE_DIRECTORY` | Directory where generated images will be saved                                                            | `/Users/admin/Downloads/stability-ai-images` |

## Claude Desktop

Create a folder directory somewhere on your machine to store generated/modified images. Some options:

- `/Users/<username>/Downloads/stability-ai-images`
- `/Users/<username>/Library/Application Support/Claude/mcp-server-stability-ai/images`

Then proceed to your preferred method of configuring the server:

### Manual Setup

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Modify your `claude_desktop_config.json` file to add the following:

```
{
  "mcpServers": {
    "stability-ai": {
      "command": "npx",
      "args": [
        "mcp-server-stability-ai"
      ],
      "env": {
        "STABILITY_AI_API_KEY": "sk-1234567890",
        "IMAGE_STORAGE_DIRECTORY": "/Users/admin/Downloads/stability-ai-images"
      }
    },
  },
}
```

Restart Claude Desktop and you should be ready to go:

<img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/claude-1.png" width="500" alt="Claude First Image">

<img src="https://github.com/tadasant/mcp-server-stability-ai/blob/main/images/claude-2.png" width="500" alt="Claude Second Image">

## Roadmap

These are coming soon; but PR's are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

- `search-and-recolor` - Identify an object in an image based on a prompt, then change its color.
- `inpaint` - A more precise version of `search-and-x` functionalities, requires mananging a mask to define to area to replace.
- `replace-background-and-relight` - Replace background of an image, maintaining surrounding lighting effects.
- `control-style` - Use one image to guide generation of another image.
- `control-structure` - Maintain the setting of an image to another (e.g. for creating multiple scenes with the same backdrop).

# Contributing

External contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

Also please feel free to raise issues or feature requests; love seeing how people are using this and how it could be made better.
