import {
	MarkdownRenderChild,
} from 'obsidian';
import {
    ID_PREFIX,
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
			// `${ID_PREFIX}-text-underline`
		],
	},
	"highlight": {
		"tagName": "span",
		"classes": [
			`${ID_PREFIX}-text-highlight`
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
		container.addClass(`${ID_PREFIX}-style-span`);
		this.containerEl.addClass(`${ID_PREFIX}-style-ctn`);
		
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