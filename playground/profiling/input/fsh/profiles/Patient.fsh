Profile: Patient

//Header
Parent: http://hl7.org/fhir/StructureDefinition/Patient
Id: Patient
Title: "DEMO Patient"
Description: "This profile was created for the DEMO project. It is used to represent a patient in the DEMO system."
* ^url = "https://fhir.demo.org/core/StructureDefinition/Patient"

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

* active  1.. MS
* name  1.. MS
* name ^short = "The patient's full"
* name ^definition = "The patient's name is a list of person names with different functions (e.g. full name, family name, given name, etc.)."
* name.family MS
* name.family ^short = "Family name"
* name.given MS
* name.given ^short = "Given name"
* gender  1.. MS
* birthDate  1.. MS