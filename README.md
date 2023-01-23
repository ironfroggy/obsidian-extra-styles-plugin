# Obsidian Extra Styles Plugin

This plugin adds several new styling options and the ability to configure any number of custom style markup options for your Obsidian notes!

Out of the box, you'll get:
- Underline
- Superscript
- Subscript
- Hidden, which hides text behind censor bars

You can customize any of these styles, controlling the HTML tag and CSS properties associated with them.

All styles are marked up via inline code syntax. For example, you can underline like this:

  This text has some `_underlined_` text.

All custom styles have commands in the command palette to toggle them on selected text and can be bound to individual hotkeys.

## Demo Video

https://user-images.githubusercontent.com/34982/214124184-9cfcb6ef-3f0f-46fc-bbdf-2bb5662ed87a.mp4

## How to develop

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Attribution

Special thanks and attribution to the Dataview plugin (https://github.com/blacksmithgu/obsidian-dataview/),
from which I based much of the inline rendering code on. As such this plugin maintains the MIT license.