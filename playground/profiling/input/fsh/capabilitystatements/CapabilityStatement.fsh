RuleSet: SupportResource (resource, expectation)
* rest.resource[+].type = #{resource}
* rest.resource[=].extension[0].url = $exp
* rest.resource[=].extension[0].valueCode = {expectation}

RuleSet: Profile (profile, expectation)
* rest.resource[=].profile[+] = "{profile}"
* rest.resource[=].profile[=].extension[0].url = $exp
* rest.resource[=].profile[=].extension[0].valueCode = {expectation}

RuleSet: SupportProfile (profile, expectation)
// This rule set must follow a SupportResource rule set, and applies to that resource.
* rest.resource[=].supportedProfile[+] = "{profile}"
* rest.resource[=].supportedProfile[=].extension[0].url = $exp
* rest.resource[=].supportedProfile[=].extension[0].valueCode = {expectation}

RuleSet: SupportInteraction (interaction, expectation)
// This rule set must follow a SupportResource rule set, and applies to that resource.
* rest.resource[=].interaction[+].code = {interaction}
* rest.resource[=].interaction[=].extension[0].url = $exp
* rest.resource[=].interaction[=].extension[0].valueCode = {expectation}

Instance: RacoonCapabilitystatement
InstanceOf: CapabilityStatement

Usage: #definition
* insert Version
* insert SP_Publisher
* insert Date
* url = "https://fhir.demo.org/CapabilityStatement/metadata"
* name = "CapabilityStatement_001"
* title = "DEMO CapabilityStatement"
* status = #active
* experimental = false
* description = "The present CapabilityStatement describes all mandatory interactions that a conforming system must support in order to fully support the DEMO system."
* jurisdiction = urn:iso:std:iso:3166#DE "Germany"
* kind = #requirements
* fhirVersion = #4.0.1
* format[0] = #xml
* format[+] = #json
* rest.mode = #server

//Patient
* insert SupportResource(Patient, #SHALL)
* insert Profile(http://hl7.org/fhir/StructureDefinition/Patient, #SHALL)
* insert SupportProfile(https://fhir.demo.org/core/StructureDefinition/Patient|0.0.1, #SHALL)
* insert SupportInteraction(#read, #SHALL)
//TODO: Support Interaction #search-type

//ResearchStudy
* insert SupportResource(ResearchStudy, #SHALL)
* insert Profile(http://hl7.org/fhir/StructureDefinition/ResearchStudy, #SHALL)
* insert SupportProfile(https://fhir.demo.org/core/StructureDefinition/ResearchStudy|0.0.1, #SHALL)
* insert SupportInteraction(#read, #SHALL)
//TODO: Support Interaction #search-type

//ResearchSubject
* insert SupportResource(ResearchSubject, #SHALL)
* insert Profile(http://hl7.org/fhir/StructureDefinition/ResearchSubject, #SHALL)
* insert SupportProfile(https://fhir.demo.org/core/StructureDefinition/ResearchSubject|0.0.1, #SHALL)
* insert SupportInteraction(#read, #SHALL)
//TODO: Support Interaction #search-type