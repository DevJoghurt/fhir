//instance
Instance: ExamplePatient
InstanceOf: Patient
Usage: #example
* identifier.system = "https://fhir.demo.org/patients"
* identifier.value = "1234"
* name.family = "Homer"
* name.given = "Simpson"
* telecom.system = #email
* telecom.value = "homer-simpson@demo.com"
* gender = #male
* birthDate = 2000-06-27
* active = true