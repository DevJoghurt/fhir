import { fhirResourceList } from '../utils/resources';

export type FhirResource = (typeof fhirResourceList)[number];