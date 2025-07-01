import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { getPeople } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
  getPeople,
});

// create a new API stack
const apiStack = backend.createStack("advisor-api-stack");

// create a new REST API
const peopleApi = new RestApi(apiStack, "PeopleApi", {
  restApiName: "PeopleApi",
  deploy: true,
  deployOptions: {
    stageName: "dev", 
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const getPeopleIntegration = new LambdaIntegration(
  backend.getPeople.resources.lambda
);

// create a new resource path with IAM authorization
const itemsPath = peopleApi.root.addResource("items", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});
itemsPath.addMethod("GET", getPeopleIntegration);
itemsPath.addMethod("POST", getPeopleIntegration);
itemsPath.addMethod("DELETE", getPeopleIntegration);
itemsPath.addMethod("PUT", getPeopleIntegration);

// add a proxy resource path to the API
itemsPath.addProxy({
  anyMethod: true,
  defaultIntegration: getPeopleIntegration,
});


// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = peopleApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", getPeopleIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const advisorApiPolicy = new Policy(apiStack, "AdvisorApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${peopleApi.arnForExecuteApi("*", "/items", "dev")}`,
        `${peopleApi.arnForExecuteApi("*", "/items/*", "dev")}`,
        `${peopleApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  advisorApiPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  advisorApiPolicy
);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [peopleApi.restApiName]: {
        endpoint: peopleApi.url,
        region: Stack.of(peopleApi).region,
        apiName: peopleApi.restApiName,
      },
    },
  },
});