import { Context, util } from '@aws-appsync/utils'

export function request(ctx: Context) {
	console.log(ctx.prev.result)
	return {
		method: 'POST',
		params: {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${ctx.prev.result}`,
			},
			body: {
				version:
					'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
				input: { prompt: ctx.args.prompt },
				webhook: `${ctx.stash.webhookURL}?userId=${ctx.stash.ownerId}`,
				webhook_events_filter: ['completed'],
			},
		},
		resourcePath: '/v1/predictions',
	}
}

export function response(ctx: Context) {
	return {}
}
