import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { Function } from 'aws-cdk-lib/aws-lambda'

type CreateAIPicsBucketProps = {
	appName: string
	s3LambdaTrigger: Function
}

export function createAIPicsBucket(
	scope: Construct,
	props: CreateAIPicsBucketProps
) {
	const fileStorageBucket = new s3.Bucket(
		scope,
		`${props.appName}-aiPics-bucket`,
		{
			cors: [
				{
					allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.DELETE],
					allowedOrigins: ['*'],
					allowedHeaders: ['*'],
					exposedHeaders: [
						'x-amz-server-side-encryption',
						'x-amz-request-id',
						'x-amz-id-2',
						'ETag',
					],
				},
			],
		}
	)

	fileStorageBucket.grantPublicAccess('replicate-images/*', 's3:GetObject')

	fileStorageBucket.addEventNotification(
		s3.EventType.OBJECT_CREATED,
		new LambdaDestination(props.s3LambdaTrigger),
		{
			prefix: 'replicate-images/*',
		}
	)

	return fileStorageBucket
}