//New Code system
CodeSystem: MaritalStatusExtended
Id: MaritalStatusExtended
Title: "Extended codeSystem for marital status"
Description: "New marital staus code specified in 10-2024"
//rules
* ^status = #active
* ^version = "2024.0.0"
* ^date = "2024-10-10"
* ^publisher = "Example"
* ^contact.telecom.system = #url
* ^contact.telecom.value = "https://www.example.fhir.de"
//value code
* #ghosting "Ghosting" "When someone suddenly cuts off contact with you without warning or explanation"
* #zombieing "Zombieing" "When ghoster tries to reconnect with you in some way again without warning or explanation"
* #situationship "Situationship" "A romantic relationship between two people who do not yet consider themselves a couple"


// new value set for the new code
ValueSet: MaritalStatusExtended
Id: MaritalStatusExtended
Title: "Extended value code for marital status"
Description: "New marital staus value specified in 10-2024"
* include codes from system http://hl7.org/fhir/ValueSet/marital-status
* include codes from system $Example_Cs

