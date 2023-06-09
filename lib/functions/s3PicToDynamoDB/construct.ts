import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import path = require('path')

type AIPicsTableProps = {
	aiPicsTableArn: string
	aiPicsTableName: string
}

export const createS3ImageToDDBFunc = (
	scope: Construct,
	props: AIPicsTableProps
) => {
	const s3ImageToDDBFunc = new NodejsFunction(scope, `s3ImageToDDBFunc`, {
		functionName: `s3ImageToDDBFunc`,
		runtime: Runtime.NODEJS_16_X,
		handler: 'handler',
		entry: path.join(__dirname, `./main.ts`),
		environment: {
			AIPIC_TABLE_NAME: props.aiPicsTableName,
			REGION: process.env.CDK_DEFAULT_REGION!,
		},
	})
	s3ImageToDDBFunc.addToRolePolicy(
		new PolicyStatement({
			actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
			resources: [props.aiPicsTableArn],
		})
	)

	return s3ImageToDDBFunc
}
