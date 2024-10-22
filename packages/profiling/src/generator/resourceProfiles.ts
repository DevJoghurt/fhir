import { FhirProfilingContext } from '../types';
import Markdown from '../markdown';


export function createResourceProfiles(ctx: FhirProfilingContext) {
	// create an index page for a summary of all resource profiles
	const doc = new Markdown();
	doc.meta({
		title: 'Resource Profiles',
		description: 'This page provides a list of the FHIR resource profiles defined as part of this implementation guide.',
		layout: 'fhirdocs',
		icon: 'streamline:industry-innovation-and-infrastructure',
		navigation: 'false'
	});
	doc.heading('Resource Profiles', 1);
	doc.text('This page provides a list of the FHIR resource profiles defined as part of this implementation guide.');
	doc.heading('Structures: Resource Profiles', 2);
	doc.text('These define constraints on FHIR resources for systems conforming to this implementation guide.');
	// use table to display the list of profiles
	doc.table({
		columns: ['Name', 'Description'],
		rows: ctx.profiles.map(profile => [profile.id || '', profile.description])
	});
	doc.save(ctx.config.dir, 'fsh-generated','content', '1.resource-profiles', '0.index.md');

	// create a page for every resource profile
	for (const [i, profile] of ctx.profiles.entries()) {
		const profileDoc = new Markdown();
		profileDoc.meta({
			title: profile.id || profile.title || '',
			description: profile.description,
			layout: 'fhirdocs'
		});
		profileDoc.heading(`Resource Profile: ${profile.id}`, 1);
		profileDoc.text(profile.description);
		profileDoc.heading('Formal Views of Profile Content', 2);
		profileDoc.component('ResourceContent', {
			resource: profile.queryId
		});
		profileDoc.save(ctx.config.dir, 'fsh-generated','content', '1.resource-profiles', `${i+1}.${profile.id}.md`);
	}

}