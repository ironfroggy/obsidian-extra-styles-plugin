import ExtraStylesPlugin from "./main";
import {
    StyleRule,
} from "./main"


function joinRegExp(reg_exprs: RegExp[]): RegExp {
    const reg_expr_parts: string[] = []
    for (let i = 0; i < reg_exprs.length; i++) {
        const reg_expr = reg_exprs[i];
        reg_expr_parts.push(reg_expr.source)
    }
    return new RegExp(reg_expr_parts.join(""))
}

export class InlineStyled {
    style: string
    text: string

    constructor(style: string, text: string) {
        this.style = style
        this.text = text
    }
}

export class ParseError {
    error: string

    constructor(error: string) {
        this.error = error
    }
}

export type Result = InlineStyled | ParseError;

interface StyleParserules {
    "name": string,
    "inner": RegExp,
    "open": RegExp,
    "close": RegExp,
}

const STYLE_UNDERLINE: StyleParserules = {
    "name": "underline",
    "inner": /(?<text>.*)/,
    "open": /_/,
    "close": /_/,
}
const STYLE_HIGHLIGHT: StyleParserules = {
    "name": "highlight",
    "inner": /(?<text>.*)/,
    "open": /#/,
    "close": /#/,
}

function escapeRegex(pattern: string) {
    return pattern.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function tryParseOneStyle(style: StyleRule, text: string) {
    const re = joinRegExp([
        /^/,
        new RegExp(escapeRegex(style.open)),
        /(?<text>.*)/,
        new RegExp(escapeRegex(style.close)),
        /$/,
    ])
    let match: RegExpMatchArray | null
    if (match = text.match(re)) {
        if (match.groups) {
            return new InlineStyled(style.name, match.groups.text)
        }
    }
    return null;
}

export function parseInline(plugin: ExtraStylesPlugin, input: HTMLElement | string): Result | null {
    let text: string
    if (typeof input === "string") {
        text = input as string
    } else {
        text = (input as HTMLElement).innerText
    }
    // console.log(`input: ${typeof input} = ${input}, text: ${typeof text} = ${text}, `);

    for (let i = 0; i < plugin.settings.styleList.length; i++) {
        const style = plugin.settings.styleList[i];
        const parsedInline = tryParseOneStyle(style, text);
        if (parsedInline !== null) {
            return parsedInline
        }
    }

    return null
}