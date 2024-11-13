Profile: ResearchSubject

//Header
Parent: http://hl7.org/fhir/StructureDefinition/ResearchSubject
Id: ResearchSubject
Title: "DEMO ResearchSubject"
Description: "This profile was created for the DEMO project. It is used to represent a research subject in the DEMO system."
* ^url = "https://fhir.demo.org/core/StructureDefinition/ResearchSubject"

//Meta
* insert Publisher
* insert DEMO_Copyright
* insert PR_CS_VS_Version
* insert PR_CS_VS_Date
* id MS
* meta MS
* meta.source MS
* meta.profile MS

//Profile
* status MS
* study MS
* study only Reference(ResearchStudy)
* individual MS
* individual only Reference(Patient)