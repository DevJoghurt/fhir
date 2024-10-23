import { useContent } from '#imports';

interface BreadcrumbItem {
	label: string;
	to: string;
}

export function useBreadcrumb(url: string): BreadcrumbItem[] {
	const { navigation } = useContent();

	const breadcrumbItems: BreadcrumbItem[] = [];
	// Remove empty segments
	const segments = url.split('/').filter(segment => segment !== '');

	// Construct breadcrumb for each segment
	let to = '';
	let nav = navigation.value;
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i].replace('.html', '');
		to += `/${segment}`;
		const page = nav.find(x => (x._path as string) === to);
		nav = page?.children;
		breadcrumbItems.push({ label: page?.title ?? segment, to });
	}
	return breadcrumbItems;
}