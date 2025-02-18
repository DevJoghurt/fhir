import { fhirResourceList } from '../app/utils/resources';

export type FhirResource = (typeof fhirResourceList)[number];