/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type AIPic = {
  __typename: "AIPic",
  id: string,
  completionStatus?: COMPLETION_STATUS | null,
  createdAt: string,
  updatedAt: string,
  prompt: string,
  imgId?: string | null,
};

export enum COMPLETION_STATUS {
  STARTED = "STARTED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
}


export type CreateAIPicMutationVariables = {
  prompt: string,
};

export type CreateAIPicMutation = {
  createAIPic?:  {
    __typename: "AIPic",
    id: string,
    completionStatus?: COMPLETION_STATUS | null,
    createdAt: string,
    updatedAt: string,
    prompt: string,
    imgId?: string | null,
  } | null,
};

export type PublishMutationVariables = {
  data?: string | null,
};

export type PublishMutation = {
  publish?: string | null,
};

export type ListAIPicsQuery = {
  listAIPics?:  Array< {
    __typename: "AIPic",
    id: string,
    completionStatus?: COMPLETION_STATUS | null,
    createdAt: string,
    updatedAt: string,
    prompt: string,
    imgId?: string | null,
  } | null > | null,
};

export type SubscribeSubscription = {
  subscribe?: string | null,
};
