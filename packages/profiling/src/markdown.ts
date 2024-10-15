import { md } from "mdbox";
import { writeFileSync } from 'node:fs';

export type Component = 'ResourceTree' | 'ResourceContent';

// Create a markdown document
class Markdown {

	private doc: string = '';

	heading(text, level) {
		this.doc += md.heading(text, level);
	}

	bold(text) {
		this.doc += md.bold(text);
	}

	text(text, newLine = true) {
		this.doc += `${text}${newLine ? '\n' : ''}`;
	}

	meta(vars: Record<string, string>) {
		this.doc += '---\n';
		for (const [key, value] of Object.entries(vars)) {
			this.doc += `${key}: ${value}\n`;
		}
		this.doc += '---\n';
	}

	codeBlock(
		code: string,
		lang?: string,
		opts?: { ext?: string },
	) {
		this.doc += md.codeBlock(code, lang, opts);
	}

	component(name: Component, props: Record<string, string> | null = null, slots: Record<"default" | string, string> | null = null) {
		this.doc += `::${name}\n`;
		if (props) {
			this.meta(props);
		}
		if (slots) {
			for (const [key, value] of Object.entries(slots)) {
				if(key === 'default') {
					this.doc += `${value}\n`;
				} else {
					this.doc += `#${key}\n${value}\n`;
				}
			}
		}
		this.doc += `::\n`;
	}

	getDocument() {
		return this.doc;
	}

	save(path: string) {
		writeFileSync(path, this.doc, 'utf8');
	}

}

export default Markdown;