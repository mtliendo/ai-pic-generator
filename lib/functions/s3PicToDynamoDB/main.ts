const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event: any) => {
	console.log('the event', event)
	for (const record of event.Records) {
		await processRecord(record)
	}
}

async function processRecord(record: any) {
	const bucket = record.s3.bucket.name
	const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
	const currentISODate = new Date().toISOString()
	console.log(`Processing record: ${key}`)
	console.log(`Bucket: ${bucket}`)
	console.log('currentISODate', currentISODate)

	const params = {
		TableName: process.env.AIPIC_TABLE_NAME,
		Key: {
			bucket: bucket,
			key: key,
		},
		UpdateExpression:
			'set completionStatus = :completionStatus,  updatedAt = :updatedAt, imgId = :key',
		ExpressionAttributeValues: {
			':completionStatus': 'COMPLETED',
			':updatedAt': currentISODate,
			':key': key,
		},
		ReturnValues: 'UPDATED_NEW',
	}

	try {
		const data = await dynamoDb.update(params).promise()
		console.log(`Item updated successfully: ${key}`)
	} catch (err) {
		console.log('Error', err)
	}
}
