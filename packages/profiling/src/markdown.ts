import { md } from "mdbox";
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type Component = 'ResourceTree' | 'ResourceContent';

// Create a markdown document
class Markdown {

	private doc: string = '';

	heading(text: string, level: number = 1) {
		this.doc += md.heading(text, level);
	}

	bold(text: string) {
		this.doc += md.bold(text);
	}

	text(text: string, newLine: boolean = true) {
		this.doc += `${text}${newLine ? '\n' : ''}`;
	}

	value(key: string, value: string) {
		this.doc += `${key}: ${value}\n`;
	}

	meta(vars: Record<string, string>) {
		this.doc += '---\n';
		for (const [key, value] of Object.entries(vars)) {
			this.value(key, value);
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

	table(table: {
		rows: string[][];
		columns: string[];
	}) {
		this.doc += md.table(table);
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

	save(...paths: string[]) {
		// check if folder exists and create it if not
		const path = join(...paths);
		const dir = dirname(path);
		if (!existsSync(dir)){
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(path, this.doc, 'utf8');
	}

}

export default Markdown;