import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import path = require('path')

// this webhook gets triggered by ReplicateAI when an image is completed.
// "completed" means with a status of `succeeded`, `failed` or `canceled`.

// https://replicate.com/docs/reference/http#predictions.create

//This function gets the imageURL and saves the image to S3.

type publishToAppSyncProps = {
	s3BucketARN: string
	s3BucketName: string
}

export const createReplicateWebhookFunction = (
	scope: Construct,
	props: publishToAppSyncProps
) => {
	const replicateWebhookFunction = new NodejsFunction(
		scope,
		`replicateWebhookFunction`,
		{
			functionName: `replicateWebhookFunction`,
			runtime: Runtime.NODEJS_16_X,
			handler: 'handler',
			entry: path.join(__dirname, `./main.ts`),
			environment: {
				S3_BUCKET_NAME: props.s3BucketName,
				REGION: process.env.CDK_DEFAULT_REGION!,
			},
		}
	)

	const allowPutToS3 = new PolicyStatement({
		actions: ['s3:PutObject'],
		resources: [`${props.s3BucketARN}/replicate-images/*`],
		effect: Effect.ALLOW,
	})

	replicateWebhookFunction.addToRolePolicy(allowPutToS3)

	const fnURL = replicateWebhookFunction.addFunctionUrl({
		authType: FunctionUrlAuthType.NONE,
	})

	return { replicateWebhookFunction, webhookURL: fnURL.url }
}
