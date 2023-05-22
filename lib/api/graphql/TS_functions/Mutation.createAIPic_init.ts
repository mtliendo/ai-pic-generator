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
	const id = util.autoId()
	const ownerId = (ctx.identity as AppSyncIdentityCognito).sub
	ctx.stash.id = id
	ctx.stash.ownerId = ownerId
	return {
		operation: 'PutItem',
		key: util.dynamodb.toMapValues({ id }),
		attributeValues: util.dynamodb.toMapValues({
			__typename: 'AIPic',
			owner: ownerId,
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
