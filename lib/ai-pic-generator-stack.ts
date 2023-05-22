import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { createPublishToAppSyncFunc } from './functions/publishToAppSync/construct'
import { createTable } from './databases/tables'
import {
	FilterCriteria,
	FilterRule,
	StartingPosition,
} from 'aws-cdk-lib/aws-lambda'
import { createAPI } from './api/appsync'
import { createAuth } from './cognito/auth'
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources'
import { createReplicateWebhookFunction } from './functions/replicateWebhook/construct'
import { createAIPicsBucket } from './storageBuckets/aiPics'
import { createS3ImageToDDBFunc } from './functions/s3PicToDynamoDB/construct'

export class AiPicGeneratorStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		const AIPicsTable = createTable(this, {
			tableName: 'AIPicsTable',
		})

		const AIPicsAuth = createAuth(this, {
			appName: 'AIPicsAuth',
		})

		const s3ImageToDDBFunc = createS3ImageToDDBFunc(this, {
			aiPicsTableArn: AIPicsTable.tableArn,
		})

		const AIPicBucket = createAIPicsBucket(this, {
			appName: 'AIPicBucket',
			s3LambdaTrigger: s3ImageToDDBFunc,
		})

		const replicateWebhookFunc = createReplicateWebhookFunction(this, {
			s3BucketName: AIPicBucket.bucketName,
			s3BucketARN: AIPicBucket.bucketArn,
		})

		const appsyncAPI = createAPI(this, {
			appName: 'createAIPicsAPI',
			aiPicDB: AIPicsTable,
			webhookURL: replicateWebhookFunc.webhookURL,
			userpool: AIPicsAuth.userPool,
			unauthenticatedRole: AIPicsAuth.identityPool.unauthenticatedRole,
		})

		const publishToAppSyncFunc = createPublishToAppSyncFunc(this, {
			appSyncARN: appsyncAPI.arn,
			appSyncURL: appsyncAPI.graphqlUrl,
			appName: 'AIPic',
		})

		publishToAppSyncFunc.addEventSource(
			new eventsources.DynamoEventSource(AIPicsTable, {
				startingPosition: StartingPosition.LATEST,
				filters: [
					FilterCriteria.filter({
						eventName: FilterRule.isEqual('INSERT'),
					}),
					FilterCriteria.filter({
						eventName: FilterRule.isEqual('MODIFY'),
					}),
				],
			})
		)
		AIPicsTable.grantStreamRead(publishToAppSyncFunc)
		appsyncAPI.grantMutation(publishToAppSyncFunc, 'publish')

		new CfnOutput(this, 'region', {
			value: this.region,
		})

		new CfnOutput(this, 'AppSyncURL', {
			value: appsyncAPI.graphqlUrl,
		})
	}
}
