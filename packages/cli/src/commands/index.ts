import type { CommandDef } from 'citty'

const _rDefault = (r: any) => (r.default || r) as Promise<CommandDef>

export const commands = {
	'fhir:profile': () => import('./profiling').then(_rDefault),
} as const