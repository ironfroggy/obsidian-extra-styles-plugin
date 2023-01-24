import {
	App,
	Component,
	Editor,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
	EditorPosition,
	EditorRange,
	EditorSelection,
	ButtonComponent,
	Command,
} from 'obsidian';
import { Extension } from "@codemirror/state";
import { inlinePlugin } from "./live-preview-renderer";
import {
	parseInline,
	ParseError,
	InlineStyled,
} from "./parse";
import ExtraStyleMarkdownRenderChild from "./render";
import { PLUGIN_NAME, PLUGIN_ID } from './constants';


// export interface CSSProperties {
// 	[name: string]: string,
// }

export interface StyleRule {
	name: string,
	open: string,
	close: string,
	tagName?: string,
	css: string,
}

export class ExtraStylesPluginSettings {
	styleList: StyleRule[];

	constructor(defaultSettings: {styleList: StyleRule[]}) {
		this.styleList = defaultSettings.styleList
	}

	getStyle(name: string) {
		for (let i = 0; i < this.styleList.length; i++) {
			const style = this.styleList[i];
			if (style.name === name) {
				return style;
			}
		}
	}
}

const DEFAULT_SETTINGS: ExtraStylesPluginSettings = new ExtraStylesPluginSettings({
	styleList: [
		{
			"name": "Underline",
			"open": "_",
			"close": "_",
			"css": "text-decoration: underline",
		},
		{
			"name": "Superscript",
			"open": "^",
			"close": "^",
			"tagName": "sup",
			"css": "",
		},
		{
			"name": "Subscript",
			"open": "\\",
			"close": "/",
			"tagName": "sub",
			"css": "",
		},
		{
			"name": "Hidden",
			"open": "!",
			"close": "!",
			"css":
				"background-color: var(--text-normal); \
				color: var(--text-normal);"
			,
		},
	]
})

function reorderSelections(selections: EditorSelection[]): EditorSelection[] {
	for (let i = 0; i < selections.length; i++) {
		const selection = selections[i];
		if (selection.anchor.line > selection.head.line
			|| (selection.anchor.line == selection.head.line
			&& selection.anchor.ch > selection.head.ch)
		) {
			[selection.anchor, selection.head] = [selection.head, selection.anchor]
		}
	}
	selections.sort((a, b) =>
		a.anchor.line - b.anchor.line || a.anchor.ch - b.anchor.ch
	);
	return selections
}

async function hexDigest(message: string) {
	const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
	const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
	return hashHex;
}


export default class ExtraStylesPlugin extends Plugin {
	settings: ExtraStylesPluginSettings;
	private cmExtension: Extension[];

	async onload() {
		await this.loadSettings();

		this.registerMarkdownPostProcessor(async (el, ctx) => {
			this.extraStylesInline(el, ctx, ctx.sourcePath);
		}), -100;

		this.cmExtension = [
			inlinePlugin(this, this.settings),
		];
		this.registerEditorExtension(this.cmExtension);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		
		this.registerCommands()
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = new ExtraStylesPluginSettings({
			...DEFAULT_SETTINGS,
			...await this.loadData(),
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.registerCommands();
	}

	registerCommands() {
		// @ts-ignore
		for (const commandId in this.app.commands.commands) {
			if (commandId.startsWith(PLUGIN_ID)) {
				// @ts-ignore
				this.app.commands.removeCommand(commandId)
			}
		}

		this.settings.styleList.forEach(style => {
			const commandId = `extra-styles-toggle-${style.name.toLowerCase()}`;
			this.addCommand({
				id: commandId,
				name: `Toggle ${style.name}`,
				editorCallback: (editor: Editor) => {
					const cur = editor.getCursor();
					const line = editor.getLine(cur.line);
					const match = line.match(/`(?<inlinecode>.*)`/);
					if (match && match.groups) {
						const index = match.index as number

						if (cur.ch >= index && cur.ch <= index + match[0].length) {
							const length = match.groups.inlinecode.length
							const start = {line: cur.line, ch: index}
							const end = {line: cur.line, ch: index + length + 2}
							const range = editor.getRange(start, end)
							
							editor.replaceRange(range.substring(2, range.length - 2), start, end)
							return;
						}
					}

					const selections = reorderSelections(editor.listSelections())
					let cursorOffset = 0
					if (selections.length > 0) {
						for (let i = 0; i < selections.length; i++) {
							const selection = selections[i];
							selection.anchor.ch += cursorOffset
							selection.head.ch += cursorOffset

							if (selection.anchor.line === selection.head.line
								&& selection.anchor.ch === selection.head.ch
							) {
								const styledText = ["`", style.open, style.close, "`"].join("")
								editor.replaceRange(
									styledText,
									selection.anchor,
									selection.head,
								)
							} else {

								let selectionText = editor.getRange(selection.anchor, selection.head)
								const pre_ws = selectionText.match(/^\s*/)
								if (pre_ws) {
									selection.anchor.ch += pre_ws[0].length
									selectionText = editor.getRange(selection.anchor, selection.head)
								}
								const post_ws = selectionText.match(/\s*$/)
								if (post_ws) {
									selection.head.ch -= post_ws[0].length
									selectionText = editor.getRange(selection.anchor, selection.head)
								}

								const styledText = ["`", style.open, selectionText, style.close, "`"].join("")
								editor.replaceRange(
									styledText,
									selection.anchor,
									selection.head,
								)
							}
							selection.anchor.ch += style.open.length + 1
							selection.head.ch += style.close.length + 1
							cursorOffset += style.open.length + style.close.length + 2
						}

						setTimeout(() => {
							editor.setSelections(selections)
						}, 50);
					}
				},
			});
		})
	}

	getSettingsHash() {
		return hexDigest(JSON.stringify(this.settings));
	}
	
	public async extraStylesInline(
		el: HTMLElement,
		context: Component | MarkdownPostProcessorContext,
		sourcePath: string
	) {
		const codeblocks = el.querySelectorAll("code");
		for (let index = 0; index < codeblocks.length; index++) {
			const codeblock = codeblocks.item(index);

			const result = parseInline(this, codeblock)
			if (result === null) {
				continue;
			}

			switch (result.constructor) {
				case InlineStyled:
					const inline = <InlineStyled> result
						context.addChild(new ExtraStyleMarkdownRenderChild(
							this,
							codeblock,
							inline.style,
							inline.text,
						));
					break;

				case ParseError:
					console.error((<ParseError>result).error);
					break;
			}

		}
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: ExtraStylesPlugin;

	constructor(app: App, plugin: ExtraStylesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	normalizeCSS(css: string): string {
		return css.replace(/(?<prop>\w+)\s*(?<sep>:)\s*(?<value>[^;\n]*)[;\n]*/g, "$1: $3;\n")
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.classList.add("extra-styles-settings-tab");
		containerEl.createEl('h2', {
			text: 'Extra Styles Settings',
		});

		new Setting(containerEl)
			.setName('Custom Style')
			.setDesc('Define a custom style with open/close regular expressions and CSS rules.')

		const s = new Setting(containerEl);
		s.infoEl.style.display = "none";
		const header = s.controlEl;
		header.classList.add("extra-styles-setting-header")
		header.createSpan("x", (span) => {
			span.innerText = "Style Name";
			span.style.width = "15%";
		});
		header.createSpan("x", (span) => {
			span.innerText = "Open";
			span.style.width = "5%";
		});
		header.createSpan("x", (span) => {
			span.innerText = "Close";
			span.style.width = "5%";
		});
		header.createSpan("x", (span) => {
			span.innerText = "Tag";
			span.style.width = "10%";
		});
		header.createSpan("x", (span) => {
			span.innerText = "CSS";
			span.style.width = "55%";
		});
		header.createSpan("x", (span) => {
			span.innerText = "";
			span.style.width = "10%";
		});
		
		this.plugin.settings.styleList.forEach((styleRule, index) => {
			const s = new Setting(this.containerEl)
				.addText((text) => {
					const t = text.setPlaceholder("Style Name")
					.setValue(this.plugin.settings.styleList[index].name)
					.onChange((new_value) => {
						this.plugin.settings.styleList[index].name = new_value;
						this.plugin.saveSettings();
					});
					t.inputEl.style.width = "15%"
				})
				.addText((text) => {
					const t = text.setPlaceholder("Open Pattern")
					.setValue(this.plugin.settings.styleList[index].open)
					.onChange((new_value) => {
						this.plugin.settings.styleList[index].open = new_value;
						this.plugin.saveSettings();
					})
					t.inputEl.style.width = "5%"
				})
				.addText((text) => {
					const t = text.setPlaceholder("Close Pattern")
					.setValue(this.plugin.settings.styleList[index].close)
					.onChange((new_value) => {
						this.plugin.settings.styleList[index].close = new_value;
						this.plugin.saveSettings();
					});
					t.inputEl.style.width = "5%"
				})
				.addText((text) => {
					const t = text.setPlaceholder("span")
					.setValue(this.plugin.settings.styleList[index].tagName || "")
					.onChange((new_value) => {
						this.plugin.settings.styleList[index].tagName = new_value;
						this.plugin.saveSettings();
					});
					t.inputEl.style.width = "10%"
				})
				.addTextArea((text) => {
					const t = text.setPlaceholder("CSS Properties")
					.setValue(this.plugin.settings.styleList[index].css)
					.onChange((new_value) => {
						const css = this.normalizeCSS(new_value);
						this.plugin.settings.styleList[index].css = css;
						this.plugin.saveSettings();
					});

					t.inputEl.setAttr("rows", 3);
					t.inputEl.style.width = "55%"
				})
				.addExtraButton((button) => {
					const t = button.setIcon("copy")
					button.onClick(async () => {
						const style = {...this.plugin.settings.styleList[index]};
						this.plugin.settings.styleList.splice(index, 0, style);
						await this.plugin.saveSettings();
						this.display();
					})
					t.extraSettingsEl.style.width = "5%"
				})
				.addExtraButton((button) => {
					const t = button.setIcon("cross")
					button.onClick(async () => {
						this.plugin.settings.styleList.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					})
					t.extraSettingsEl.style.width = "5%"
				})
				
		})
		const addButtonRow = new Setting(this.containerEl)
			.addButton((button) => {
				button.setButtonText("Add Style")
				button.onClick(async (ev) => {
					this.plugin.settings.styleList.push({
						"name": "Unnamed Style",
						"open": "<",
						"close": ">",
						"css": "",
					})
					await this.plugin.saveSettings();
					this.display();
				})
			})
		addButtonRow.setClass("extra-styles-setting-add-style")
	}
}
