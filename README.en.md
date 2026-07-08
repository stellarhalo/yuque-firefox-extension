# Yuque Firefox Extension

> Firefox browser extension for Yuque, based on [yuque-chrome-extension](https://github.com/yuque/yuque-chrome-extension)

---

[简体中文](README-FIREFOX.md)

## Background

[yuque-chrome-extension](https://github.com/yuque/yuque-chrome-extension) is the official Yuque browser extension for Chrome/Edge browsers. However, it does not provide official Firefox browser support.

This project is based on the Yuque Chrome extension source code and has been adapted for Firefox browser, enabling Firefox users to enjoy the convenience of the Yuque extension.

### Acknowledgements

The development of this project has received strong support and assistance from the following AI models:

- **MiniMax M3** - Provided valuable suggestions in code architecture design and problem analysis
- **GLM 5.2** - Offered guidance on Manifest V3 adaptation and Firefox API compatibility
- **Mimo V2.5** - Contributed important insights in build process optimization and packaging configuration

Special thanks to these AI models for their assistance in overcoming technical challenges, which made the successful completion of Firefox adaptation possible.

## Features

- **Page Clipping**: Clip web page text and images, save directly to Yuque
- **OCR Text Recognition**: Recognize text from screenshots for easy content extraction
- **Selection Clipping**: Quickly save selected page text
- **Translation**: Translate selected text with one click
- **Sidebar Notes**: Create and edit notes directly in the sidebar
- **Full Page Clipping**: Save entire web page content with one click
- **Keyboard Shortcuts**:
  - `Ctrl+.` (Windows) / `Command+.` (Mac): Open extension
  - Quick actions for selection clipping, OCR extraction, full page clipping

## Installation

### Method 1: Temporary Installation (Recommended for Testing)

1. Download the latest `yuque-firefox-extension-*.zip` file
2. Open Firefox browser
3. Enter `about:debugging#/runtime/this-firefox` in the address bar
4. Click **"Load Temporary Add-on..."**
5. Select the downloaded zip file
6. Installation complete

### Method 2: Developer Mode Installation

1. Clone this repository
2. Run build commands:
   ```bash
   npm install
   npm run build:firefox
   ```
3. Load the `dist/` directory in Firefox

## Development Guide

### Requirements

- Node.js >= 16
- npm >= 7
- Firefox >= 109

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
# Start Firefox development mode
npm run dev:firefox
```

### Build Production Version

```bash
# Build Firefox stable version
npm run bundle:firefox

# Build Firefox Beta version
npm run bundle:firefox:beta

# Build all versions and package
npm run build:firefox
```

### Packaging

```bash
# Package into zip file
npm run pack-zip
```

Build artifacts will be output to the `dist/` directory:
- `yuque-firefox-extension-{version}.zip` - Firefox stable version
- `yuque-firefox-extension-{version}-beta.zip` - Firefox Beta version

## Technical Notes

### Manifest V3 Adaptation

This project uses Manifest V3 format, with main changes including:

- Using `service_worker` instead of traditional `background.scripts`
- Adjusted permission declaration methods
- Optimized `content_security_policy` configuration

### Firefox-specific Configuration

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "yuque-extension@yuque.com",
      "strict_min_version": "109.0"
    }
  }
}
```

### Differences from Chrome Version

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Background | Service Worker | Event Pages |
| Side Panel | Supported | Requires additional adaptation |
| Permission Model | Manifest V3 | Manifest V3 (Firefox-specific) |
| Minimum Version | Chrome 88+ | Firefox 109+ |

## Related Links

- [Yuque Official Website](https://www.yuque.com)
- [Original Chrome Extension Repository](https://github.com/yuque/yuque-chrome-extension)
- [Yuque Extension Documentation](https://www.yuque.com/yuque/yuque-browser-extension/welcome)

## License

This project is adapted from the original project code and follows the corresponding open source license.

---

> This project is maintained by individual developers, aiming to provide Yuque extension support for Firefox users. If you have any questions or suggestions, feel free to submit an Issue.
