import { useState } from '#imports';

export function useCollapsedMap() {
	return useState<Map<string, boolean>>('docs-collapsed-map', () => new Map());
}