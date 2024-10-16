//declaration
Profile: ResearchPatient

//Keyword
Parent: Patient
Id: ResearchPatient
Title: "Example Patient"
Description: "Dieses Profil beschreibt eine Patient*in im Projekt."
//rules
* ^url = "http://example/fhir/core/modul-person/StructureDefinition/Patient"
* ^version = "2024.0.0"
* ^date = "2024-10-10"
* ^publisher = "Example"
* ^contact.telecom.system = #url
* ^contact.telecom.value = "https://www.example.fhir.de"
//rules about constrains
* identifier 1.. MS
  * system 1.. MS
  * value 1.. MS
* active  1.. MS
* name  1.. MS
  * family MS
  * given MS
* telecom
  * system 1.. MS
  * value 1.. MS
* deceased[x] only boolean
* deceased[x] 1.. MS
* gender  1.. MS
* birthDate  1.. MS
* maritalStatus 1.. MS
* maritalStatus from $Example_Cs (extensible)


//instance
Instance: ExampleNinja
InstanceOf: ResearchPatient
Usage: #example
* identifier.system = "www.example"
* identifier.value = "1234"
* name.family = "Example"
* name.given = "Ninja"
* telecom.system = #email
* telecom.value = "hero@gmail.com"
* gender = #male
* deceasedBoolean = false
* birthDate = 2000-06-27
* active = true
* maritalStatus.coding
  * system = $Example_Cs
  * code = #zombieing



