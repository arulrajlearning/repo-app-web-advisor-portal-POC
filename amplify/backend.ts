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
import { getPeople, getProfile } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { EndpointType } from "aws-cdk-lib/aws-apigateway";

const backend = defineBackend({
  auth,
  data,
  getPeople,
  getProfile
});

// create a new API stack
const apiStack = backend.createStack("advisor-api-stack");

const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});


// create a new REST API
const advisorPortalApi = new RestApi(apiStack, "advisor-portal-api", {
  restApiName: "advisorPortalApi",
  deploy: true,
  deployOptions: {
    stageName: "dev", 
  },
   defaultCorsPreflightOptions: {
    allowOrigins: ['*'], // use specific domain(s) in production
    allowMethods: ['*'], // or [ 'GET', 'POST', 'OPTIONS' ]
    allowHeaders: ['*'],
  },
  endpointConfiguration: {
    types: [EndpointType.REGIONAL],
  },
});

// create a new Lambda integration
const getPeopleIntegration = new LambdaIntegration(
  backend.getPeople.resources.lambda
);
const getProfileIntegration = new LambdaIntegration(
  backend.getProfile.resources.lambda
);

// create a new resource path with IAM authorization
const peopleResource = advisorPortalApi.root.addResource("People", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
peopleResource.addMethod("GET", getPeopleIntegration); 

const profileResource = advisorPortalApi.root.addResource("Profile", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
profileResource.addMethod("GET", getProfileIntegration); 


// create a new IAM policy to allow Invoke access to the API
const advisorApiPolicy = new Policy(apiStack, "AdvisorApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${advisorPortalApi.arnForExecuteApi("*", "/People", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/People/*", "dev")}`,
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
      [advisorPortalApi.restApiName]: {
        endpoint: advisorPortalApi.url,
        region: Stack.of(advisorPortalApi).region,
        apiName: advisorPortalApi.restApiName,
      },
    },
  },
});