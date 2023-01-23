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

![basic functionality](https://raw.githubusercontent.com/ironfroggy/advanced-tables-obsidian/main/media/extra_styles_demo.mp4)

![Demo of the features of the Extra Styles Plugin](./media/extra_styles_demo.mp4)

## How to develop

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`
