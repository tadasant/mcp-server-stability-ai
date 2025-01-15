# Changelog

## Pre-release

- Remove base64 encoding approach to saving images to filesystem (wasn't properly functional)
- Remove requirement to set `IMAGE_STORAGE_DIRECTORY` environment variable in favor of reasonable defaults per OS
- Make client come up with meaningful image names for output images
- Remove `stability-ai-0-find-image-file-location` Tool and add `stability-ai-0-list-resources` Tool
- Refactor to avoid using filesystem & Tools directly in favor of Resources abstraction
- Add Prompts capability

## 0.0.3

- Initial public release
