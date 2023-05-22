import { CreateAIPicMutationVariables, AIPic } from '../API'

import { util, Context, DynamoDBUpdateItemRequest } from '@aws-appsync/utils'

export function request(
	ctx: Context<CreateAIPicMutationVariables>
): DynamoDBUpdateItemRequest {
	let id = ctx.stash.id

	return {
		operation: 'UpdateItem',
		key: util.dynamodb.toMapValues({ id }),
		update: {
			expression:
				'set updatedAt = :updatedAt, completionStatus = :completionStatus',
			expressionValues: {
				':updatedAt': { S: util.time.nowISO8601() },
				':completionStatus': { S: 'PROCESSING' },
			},
		},
	}
}

export function response(ctx: Context) {
	return ctx.result as AIPic
}
