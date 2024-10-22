import Markdown from '../markdown';
import { FhirProfilingContext } from '../types';

type PageSection = {
	id: string;
	name: string;
	title: string;
	description: string;
};

export function createLandingPage(ctx: FhirProfilingContext) {
	const doc = new Markdown();
	doc.meta({
		title: ctx.config.documentation?.title || 'FHIR Implementation Guide',
		description: ctx.config.documentation?.description || 'This is a generated FHIR Implementation Guide.',
		layout: ctx.config.documentation?.layout || 'fhirdocs'
	});
	doc.heading('FHIR Implementation Guide', 1);
	doc.text('This page provides a list of the FHIR artifacts defined as part of this implementation guide.');

	const sections = [{
		id: 'profiles',
		name: 'Resource Profiles',
		title: 'Structures: Resource Profiles',
		description: 'These define constraints on FHIR resources for systems conforming to this implementation guide.'
	}, {
		id: 'valueSets',
		name: 'Value Sets',
		title: 'Terminology: Value Sets',
		description: 'These define sets of codes used by systems conforming to this implementation guide.'
	}, {
		id: 'codeSystems',
		name: 'Code Systems',
		title: 'Terminology: Code Systems',
		description: 'These define new code systems used by systems conforming to this implementation guide.'
	}] as PageSection[];

	for (const section of sections) {
		doc.heading(section.title, 2);
		doc.text(section.description);
		// use table to display the list of profiles
		doc.table({
			columns: ['Name', 'Description'],
			rows: ctx[section.id].map(profile => [profile.id, profile.description])
		});
	}

	// save the markdown file
	doc.save(ctx.config.dir, 'fsh-generated','content', '0.index.md');
}