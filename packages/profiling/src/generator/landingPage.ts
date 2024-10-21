import Markdown from '../markdown';
import { join } from 'node:path';
import { FhirProfilingContext } from '../types';

export function createLandingPage(ctx: FhirProfilingContext) {
	const doc = new Markdown();
	doc.meta({
		title: ctx.config.documentation?.title || 'FHIR Implementation Guide',
		description: ctx.config.documentation?.description || 'This is a generated FHIR Implementation Guide.',
		layout: ctx.config.documentation?.layout || 'fhirdocs'
	});
	doc.heading('FHIR Implementation Guide', 1);
	doc.text('This is a generated FHIR Implementation Guide.');
	doc.heading('Table of Contents', 2);
	doc.text('This is a table of contents.');
	doc.heading('Introduction', 2);
	doc.text('This is an introduction.');
	doc.component('ResourceContent', {
		resource: 'structuredefinition-researchstudy'
	});
	const markdownFilePath = join(ctx.config.dir, 'fsh-generated','content', 'index.md');
	doc.save(markdownFilePath);
}