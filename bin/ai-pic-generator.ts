#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AiPicGeneratorStack } from '../lib/ai-pic-generator-stack'

const app = new cdk.App()
new AiPicGeneratorStack(app, 'AiPicGeneratorStack', {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION,
	},
})
