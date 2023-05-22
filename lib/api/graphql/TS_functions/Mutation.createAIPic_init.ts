import { CreateAIPicMutationVariables } from '../API'

import {
	util,
	DynamoDBPutItemRequest,
	Context,
	AppSyncIdentityCognito,
} from '@aws-appsync/utils'

export function request(
	ctx: Context<CreateAIPicMutationVariables>
): DynamoDBPutItemRequest {
	let id = util.autoId()

	ctx.stash.id = id

	return {
		operation: 'PutItem',
		key: util.dynamodb.toMapValues({ id }),
		attributeValues: util.dynamodb.toMapValues({
			__typename: 'AIPic',
			owner: (ctx.identity as AppSyncIdentityCognito).sub,
			createdAt: util.time.nowISO8601(),
			updatedAt: util.time.nowISO8601(),
			completionStatus: 'STARTED',
			prompt: ctx.args.prompt,
		}),
	}
}

export function response(ctx: Context) {
	return {}
}
