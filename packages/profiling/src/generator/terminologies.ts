import { FhirProfilingContext } from '../types';
import Markdown from '../markdown';


export function createTerminologies(ctx: FhirProfilingContext) {
	// create an index page for a summary of all value sets
	const doc = new Markdown();
	doc.meta({
		title: 'Terminology',
		description: 'Terminology defined by Value Sets and Code Systems',
		icon: 'carbon:term',
		layout: 'fhirdocs',
		navigation: 'false'
	});
	doc.heading('Terminology', 1);
	doc.text('Terminology defined by Value Sets and Code Systems');
	doc.heading('Value Sets', 2);
	doc.text('All additional value sets defined by this implementation guide are listed below.');
	// use table to display the list of profiles
	doc.table({
		columns: ['Name', 'Description'],
		rows: ctx.valueSets.map(valueSet => [valueSet.id || '', valueSet.description])
	});
	doc.heading('Code Systems', 2);
	doc.text('These define new code systems used by systems conforming to this implementation guide.');
	// use table to display the list of profiles
	doc.table({
		columns: ['Name', 'Description'],
		rows: ctx.codeSystems.map(codeSystem => [codeSystem.id || '', codeSystem.description || ''])
	});
	doc.save(ctx.config.projectPath, ctx.config.outDir, 'content', '2.terminology', '0.index.md');

	// create a page for every value set
	for (const [i, valueSet] of ctx.valueSets.entries()) {
		const valueSetDoc = new Markdown();
		valueSetDoc.meta({
			title: valueSet.id || valueSet.title || '',
			description: valueSet.description,
			layout: 'fhirdocs'
		});
		valueSetDoc.heading(`Value Set: ${valueSet.id}`, 1);
		valueSetDoc.text(valueSet.description);
		valueSetDoc.heading('Formal Views of Value Set Content', 2);

		valueSetDoc.save(ctx.config.projectPath, ctx.config.outDir, 'content', '2.terminology', 'value-sets', `${i+1}.${valueSet.id}.md`);
	}

	// create a page for every code system
	for (const [i, valueSet] of ctx.valueSets.entries()) {
		const valueSetDoc = new Markdown();
		valueSetDoc.meta({
			title: valueSet.id || valueSet.title || '',
			description: valueSet.description,
			layout: 'fhirdocs'
		});
		valueSetDoc.heading(`Value Set: ${valueSet.id}`, 1);
		valueSetDoc.text(valueSet.description);
		valueSetDoc.heading('Formal Views of Value Set Content', 2);

		valueSetDoc.save(ctx.config.projectPath, ctx.config.outDir, 'content', '2.terminology', 'code-systems',`${i+1}.${valueSet.id}.md`);
	}
}