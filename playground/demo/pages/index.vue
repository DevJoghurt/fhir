<template>
	<div>
		<h1>Index</h1>
		<UButton @click="createTransactionBundle">Create Transaction</UButton>
	</div>
</template>
<script lang="ts" setup>

const { readResource, validateResource, createResourceIfNoneExist, executeBatch } = await useFhir()

const {data} = await  readResource('Patient', 'bf70d17f-0f3c-48c4-8b64-61e5a48e1c2a')

console.log(data.value)

const {data: data2} = await  validateResource({
	resourceType: 'Patient',
	id: 'bf70d17f-0f3c-48c4-8b64-61e5a48e1c2a',
	name: [
		{
			family: 'Doe',
			given: 'John'
		}
	]
})

console.log(data2.value)

const {data: data3} = await  createResourceIfNoneExist({
	resourceType: 'Patient',
	name: [
		{
			family: 'Simpson',
			given: ['Homer'],
			use: 'official'
		}
	]
},'identifier=123')

console.log(data3.value)

const createTransactionBundle = async () => {
	const { data } = await executeBatch({
		resourceType: 'Bundle',
		type: 'transaction',
		entry: [{
			fullUrl: 'urn:uuid:9d9e93f2-1568-414e-bf44-eb5da69ffd7b',
			request: { method: 'POST', url: 'ResearchStudy' },
			resource: {
				identifier: [{ system: 'http://example.com/researchstudy', value: 'ExampleResearchStudy' }],
				period: { start: '2025-01-01' },
				resourceType: 'ResearchStudy',
				status: 'active',
				title: 'ExampleResearchStudy',
			},
		}, {
			fullUrl: 'urn:uuid:8feb66e3-b4b0-487b-9860-00ab2cb199c2',
			request: { method: 'POST', url: 'Patient' },
			resource: {
				active: true,
				gender: 'female',
				identifier: [{ value: '1.3.6.1.4.1.9328.50.2.0081' }],
				name: [{ family: '1.3.6.1.4.1.9328.50.2.0081' }],
				resourceType: 'Patient',
			},
    	},    {
			fullUrl: 'urn:uuid:f209ad17-9e83-4c77-9626-7cdf0b7373f8',
			request: { method: 'POST', url: 'ResearchSubject' },
			resource: {
				identifier: [{ value: 'ExampleResearchStudy_1.3.6.1.4.1.9328.50.2.0081' }],
				resourceType: 'ResearchSubject',
				status: 'on-study',
				study: { reference: 'urn:uuid:9d9e93f2-1568-414e-bf44-eb5da69ffd7b' },

				subject: { reference: 'urn:uuid:8feb66e3-b4b0-487b-9860-00ab2cb199c2', type: 'Patient' },
			},
		},    {
      fullUrl: 'urn:uuid:c3be4fb8-6e4a-4091-a90f-3966e0357beb',
      request: { method: 'POST', url: 'ImagingStudy' },
      resource: {
        endpoint: [
          {
            display: 'DICOMweb Endpoint',
            reference: '/studies/6f2a81fe-c8f82b24-689c8303-2c7b75ab-486fd656',
            type: 'Endpoint',
          },
        ],
        identifier: [
          { system: 'urn:dicom:uid', use: 'official', value: '1.3.6.1.4.1.9328.50.2.159867' },
        ],
        modality: [
          { coding: [{ code: 'CT', system: 'http://dicom.nema.org/resources/ontology/DCM' }] },
        ],
        numberOfInstances: 1,
        numberOfSeries: 1,
        resourceType: 'ImagingStudy',
        series: [
          {
            endpoint: [
              {
                display: 'DICOMweb Endpoint',
                reference: '/series/5162b20e-8a69eff8-d375f660-f8c34340-36341287',
                type: 'Endpoint',
              },
            ],
            instance: [
              {
                sopClass: { code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2' },
                uid: '1.3.6.1.4.1.34261.2543711158273.11812.1730291148.0',
              },
            ],
            modality: {
              coding: [{ code: 'CT', system: 'http://dicom.nema.org/resources/ontology/DCM' }],
            },
            numberOfInstances: 1,
            uid: '1.3.6.1.4.1.34261.2543711158273.11812.1730291147.0',
          },
        ],
        status: 'available',
        subject: { reference: 'urn:uuid:8feb66e3-b4b0-487b-9860-00ab2cb199c2' },
      },
    }]
	})
	console.log(data.value)
}
</script>