import jiti from "file:///C:/Users/johan/Documents/Code/fhir/node_modules/.pnpm/jiti@1.21.6/node_modules/jiti/lib/index.js";

/** @type {import("C:/Users/johan/Documents/Code/fhir/packages/profiling/src/sushi")} */
const _module = jiti(null, {
  "esmResolve": true,
  "interopDefault": true,
  "alias": {
    "@nhealth/fhir-profiling": "C:/Users/johan/Documents/Code/fhir/packages/profiling"
  }
})("C:/Users/johan/Documents/Code/fhir/packages/profiling/src/sushi.ts");

export const initializeProfilingContext = _module.initializeProfilingContext;
export const readProfilingFolder = _module.readProfilingFolder;
export const fishForFiles = _module.fishForFiles;
export const writeFHIRResources = _module.writeFHIRResources;
export const buildProfiles = _module.buildProfiles;
export const createFhirDocs = _module.createFhirDocs;
export const initializeWatcher = _module.initializeWatcher;
export const defineSushiConfig = _module.defineSushiConfig;