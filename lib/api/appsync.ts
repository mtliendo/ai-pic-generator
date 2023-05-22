import { Construct } from 'constructs'
import * as awsAppsync from 'aws-cdk-lib/aws-appsync'
import * as path from 'path'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam'

type AppSyncAPIProps = {
	appName: string
	unauthenticatedRole: IRole
	userpool: UserPool
	aiPicDB: Table
	webhookURL: string
}

export function createAPI(scope: Construct, props: AppSyncAPIProps) {
	const api = new awsAppsync.GraphqlApi(scope, props.appName, {
		name: props.appName,
		schema: awsAppsync.SchemaFile.fromAsset(
			path.join(__dirname, './graphql/schema.graphql')
		),
		authorizationConfig: {
			defaultAuthorization: {
				authorizationType: awsAppsync.AuthorizationType.USER_POOL,
				userPoolConfig: {
					userPool: props.userpool,
				},
			},
			additionalAuthorizationModes: [
				{ authorizationType: awsAppsync.AuthorizationType.IAM },
			],
		},
		xrayEnabled: true,
		logConfig: {
			fieldLogLevel: awsAppsync.FieldLogLevel.ALL,
		},
	})

	api.grantQuery(props.unauthenticatedRole, 'listAIPics')

	const aiPicTableDataSource = api.addDynamoDbDataSource(
		`AIPicTableDataSource`,
		props.aiPicDB
	)

	const parameterStoreDataSource = api.addHttpDataSource(
		'parameterStoreDataSource',
		'https://ssm.us-east-1.amazonaws.com',
		{
			authorizationConfig: {
				signingRegion: process.env.CDK_DEFAULT_REGION!,
				signingServiceName: 'ssm',
			},
		}
	)

	const allowSSMAccess = new PolicyStatement({
		actions: ['ssm:GetParameter'],
		resources: [
			`arn:aws:ssm:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:parameter/REPLICATE_SECRET`,
		],
	})

	parameterStoreDataSource.grantPrincipal.addToPrincipalPolicy(allowSSMAccess)

	const replicateAIDatasource = api.addHttpDataSource(
		'replicateAIDatasource',
		'https://api.replicate.com'
	)

	const NONEDataSource = api.addNoneDataSource(`NoneDataSource`)

	const listAIPicsFunction = new awsAppsync.AppsyncFunction(
		scope,
		'listAIPicsFunction',
		{
			name: 'listAIPicsFunction',
			api,
			dataSource: aiPicTableDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/JS_functions/Query.listAIPics.js')
			),
		}
	)

	const publishFunction = new awsAppsync.AppsyncFunction(
		scope,
		'publishFunction',
		{
			name: 'publishFunction',
			api,
			dataSource: NONEDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/JS_functions/Mutation.publish.js')
			),
		}
	)

	const createAIPicInitFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createAIPicInitFunction',
		{
			name: 'createAIPicInitFunction',
			api,
			dataSource: aiPicTableDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.createAIPic_init.js'
				)
			),
		}
	)

	const createAIPicGetReplicateSecretFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createAIPicGetReplicateSecretFunction',
		{
			name: 'createAIPicGetReplicateSecretFunction',
			api,
			dataSource: parameterStoreDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.createAIPic_getReplicateSecret.js'
				)
			),
		}
	)

	const createAIPicGenerateAIPicFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createAIPicGenerateAIPicFunction',
		{
			name: 'createAIPicGenerateAIPicFunction',
			api,
			dataSource: replicateAIDatasource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.createAIPic_generateAIPic.js'
				)
			),
		}
	)

	const createAIPicSaveAIPicFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createAIPicSaveAIPicFunction',
		{
			name: 'createAIPicSaveAIPicFunction',
			api,
			dataSource: aiPicTableDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.createAIPic_saveAIPic.js'
				)
			),
		}
	)

	new awsAppsync.Resolver(scope, 'listAIPicsResolver', {
		api,
		typeName: 'Query',
		fieldName: 'listAIPics',
		code: awsAppsync.Code.fromAsset(
			path.join(__dirname, 'graphql/JS_functions/passThrough.js')
		),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [listAIPicsFunction],
	})

	new awsAppsync.Resolver(scope, 'createAIPicResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'createAIPic',
		code: awsAppsync.Code.fromInline(`
		export function request(ctx) {
		console.log(ctx.args)
		ctx.stash.webhookURL = "${props.webhookURL}"
		return {}
	}

		export function response(ctx) {
			return ctx.prev.result
		}
		`),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [
			createAIPicInitFunction,
			createAIPicGetReplicateSecretFunction,
			createAIPicGenerateAIPicFunction,
			createAIPicSaveAIPicFunction,
		],
	})

	new awsAppsync.Resolver(scope, 'publishResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'publish',
		code: awsAppsync.Code.fromAsset(
			path.join(__dirname, 'graphql/JS_functions/passThrough.js')
		),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [publishFunction],
	})

	return api
}
