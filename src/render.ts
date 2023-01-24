import {
	MarkdownRenderChild,
} from 'obsidian';
import {
    PLUGIN_ID,
    PLUGIN_NAME,
} from "./constants";
import ExtraStylesPlugin from './main';

interface StyleMap {
	[style: string]: {
		"tagName": string,
		"classes"?: string[],
	}
}

const STYLE_TYPES: StyleMap = {
	"underline": {
		"tagName": "u",
		"classes": [
			// `${PLUGIN_ID}-text-underline`
		],
	},
	"highlight": {
		"tagName": "span",
		"classes": [
			`${PLUGIN_ID}-text-highlight`
		],
	}
}


export default class ExtraStyleMarkdownRenderChild extends MarkdownRenderChild {
    text: string;
    style: string;
	plugin: ExtraStylesPlugin;

	constructor(
		plugin: ExtraStylesPlugin,
        containerEl: HTMLElement,
        style: string,
		text: string,
	) {
		super(containerEl)
        this.style = style;
        this.text = text;
		this.plugin = plugin;
	}

	async onload(): Promise<void> {
		this.render();
	}
	
	render() {
		const container: HTMLSpanElement = this.containerEl.createEl("span");
		container.addClass(`${PLUGIN_ID}-style-span`);
		this.containerEl.addClass(`${PLUGIN_ID}-style-ctn`);
		
		let styleSettings = this.plugin.settings.getStyle(this.style)
		let el = container.createEl((styleSettings?.tagName || "span") as any, {
			"text": this.text,
		});
		if (!!styleSettings?.css) {
			el.setAttr("style", styleSettings.css.replace(/([;\s])[;\n]*]\n/, "$1"));
		}
	
		this.containerEl.empty();
		this.containerEl.appendChild(container);
	}
}