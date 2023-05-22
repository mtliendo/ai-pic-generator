# Project

AI Picture Generator

## Description

Given a prompt, generate a picture using [Replicate AI's Stability Diffusion model](https://replicate.com/stability-ai/stable-diffusion)

This project is the third in this series. In this project I still want to go AppSync -> DynamoDB to save an item to the database and let the user subscribe to the event.

From there, and similar to before, we'll use Parameter store to grab the Replicate API key and then call the API. The assumption is that the user gave a prompt for an image and it is stored on the `stash` waiting for this function.

What's interesting from this post than the last one is that the last post was synchronous. OpenAI makes you wait for the response. However, Replicate AI allows you to configure a webhook URL. The webhook will fire when the process is finished. This means our AppSync pipeline takes minimal hit to its timeout.

Because Replicate's webhook will return a URL of the image, in the webhook handler we'll give use the AWS S3 SDK to store the image. When the image is stored, an S3 upload event trigger will fire. This will update DynamoDB with the key of the image and a status of completed. Prior, the status will be "pending".

As before, once DynamoDB is updated, it will fire a Lambda function so that clients can be notified of the completed status and receive the image.

The important part here is the S3 -> Lambda -> DDB part. This is an identified pattern and will be used in the next project.

I'll still add auth to the flow as well.

## Context

It's tempting to just bolt this on top of the previous repo, but there's value in having an isolated example. I haven't setup an S3 trigger before, or downloaded an image from a URL, so that will be new. Aside from that, I'm expecting minimal issues considering the code samples and patterns that have been emerging.

## Project setup

```bash
md ai-pic-generator && cd $_ && npx aws-cdk@latest init -l typescript
```

## Project Creation

Current time: 7:06AM CT. I'm estimating 2 hours for this project

Plan of attack:

1. Copy over Auth from previous project
2. Copy over the `publish` lambda
3. Copy over the DynamoDB table, modify accordingly
4. Work on the API, copying over resolvers and code snippets from previous projects as needed.
5. Work on the event-driven aspect by creating the webhook, S3 bucket, S3 trigger.
6. ?

## Auth

copied verbatim from previous project

## `Publish` Lambda

I removed `node_modules` from the previous project, copied over and installed node_modules here.

## Database

Copied straight over from previous project

Before jumping into API, I'm doing a quick sanity check to make sure things got copied over correctly....

Aside from forgetting to install `@aws-cdk/aws-cognito-identitypool-alpha`, all is good.

## API

A lot of the operations are the same but whereas the last project referred to a Story, this project refers to an generated image.

I'll probably kick myself for doing this since I'm bound to make some silly mistake, but I'm gonna copy this entire `api` directory.

Alright, first things first, we have to adjust the schema.

I think it makes sense to save the prompt the user entered in addition to the id of the saved image.

I ended up with the following:

```graphql
type Query {
	listAIPics: [AIPic] @aws_cognito_user_pools @aws_iam
}

type Mutation {
	createAIPic(prompt: String!): AIPic @aws_cognito_user_pools
	publish(data: AWSJSON): AWSJSON @aws_iam
}

type Subscription {
	subscribe: AWSJSON @aws_subscribe(mutations: ["publish"])
}

type AIPic {
	id: ID!
	completionStatus: COMPLETION_STATUS
	createdAt: AWSDateTime!
	updatedAt: AWSDateTime!
	prompt: String!
	imgId: String
}

enum COMPLETION_STATUS {
	STARTED
	PROCESSING
	COMPLETED
}
```

Note the prompt field, the optional `imgId`, and completion enum.

With my schema generated, I'm goign to generate my types.
In my schema directory I ran the following:

```bash
npx @aws-amplify/cli codegen
```

Alright, time to work on my API construct. In that file I essentially replaced every reference to "Story" with AIPic.

The resolvers needed to be tweaked a bit further but the gist is there.

## Creating the lambda function webhook

The lambda function needs to be called by replicate. Once called, it takes the image URL, does some magic to turn it into a stream, and store it in S3. So I need a bucket too.

I spent too much time in the Replicate docs, to get the webhook to work but it's simple enough.

ChatGPT gave me the code to save the image. We'll see how well it goes.
