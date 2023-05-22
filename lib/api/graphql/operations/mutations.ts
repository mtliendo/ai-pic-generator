/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createAIPic = /* GraphQL */ `
  mutation CreateAIPic($prompt: String!) {
    createAIPic(prompt: $prompt) {
      id
      completionStatus
      createdAt
      updatedAt
      prompt
      imgId
    }
  }
`;
export const publish = /* GraphQL */ `
  mutation Publish($data: AWSJSON) {
    publish(data: $data)
  }
`;
