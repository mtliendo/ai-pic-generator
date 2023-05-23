const SampleResponse = {
	id: 'rrr4z55ocneqzikepnug6xezpe',
	version: 'be04660a5b93ef2aff61e3668dedb4cbeb14941e62a3fd5998364a32d613e35e',
	urls: {
		get: 'https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe',
		cancel:
			'https://api.replicate.com/v1/predictions/rrr4z55ocneqzikepnug6xezpe/cancel',
	},
	created_at: '2022-09-13T22:54:18.578761Z',
	started_at: '2022-09-13T22:54:19.438525Z',
	completed_at: '2022-09-13T22:54:23.236610Z',
	source: 'api',
	status: 'succeeded',
	input: {
		prompt: 'oak tree with boletus growing on its branches',
	},
	output: [
		'https://replicate.com/api/models/stability-ai/stable-diffusion/files/9c3b6fe4-2d37-4571-a17a-83951b1cb120/out-0.png',
	],
	error: null,
	logs: 'Using seed: 36941...',
	metrics: {
		predict_time: 4.484541,
	},
}

const axios = require('axios')
const stream = require('stream')
const AWSService = require('aws-sdk')
const s3 = new AWSService.S3()

exports.handler = async (event: any) => {
	const dbId = event.queryStringParameters.dbId
	const body = JSON.parse(event.body)
	if (body.status !== 'succeeded') return
	console.log(body)
	console.log(event)

	const url = body.output[0]
	const bucketName = process.env.S3_BUCKET_NAME
	const objectName = `replicate-images/${dbId}/${body.id}.png`

	let response = await axios({
		url,
		responseType: 'stream',
	})

	const pass = new stream.PassThrough()
	let params = {
		Bucket: bucketName,
		Key: objectName,
		Body: response.data.pipe(pass),
	}

	try {
		const data = await s3.upload(params).promise()
		console.log(`File uploaded successfully. ${data.Location}`)
	} catch (err) {
		console.log('Error', err)
	}
}
