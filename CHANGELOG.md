# Changelog

## 0.1.0

- Remove base64 encoding approach to saving images to filesystem (wasn't properly functional)
- Remove requirement to set `IMAGE_STORAGE_DIRECTORY` environment variable in favor of reasonable defaults per OS
- Make client come up with meaningful image names for output images
- Remove `stability-ai-0-find-image-file-location` Tool and add `stability-ai-0-list-resources` Tool
- Refactor to avoid using filesystem & Tools directly in favor of Resources abstraction
- Add Prompts capability
- Add features:
  - `stability-ai-control-style`: generate an image in the style of a reference image
  - `stability-ai-control-structure`: generate an image while maintaining the structure of a reference image
  - `stability-ai-replace-background-and-relight`: replace the background of an image and relight it
  - `stability-ai-search-and-recolor`: search for and recolor objects in an image

## 0.0.3

- Initial public release
