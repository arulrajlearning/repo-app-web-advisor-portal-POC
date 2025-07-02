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
import { MockIntegration, PassthroughBehavior } from "aws-cdk-lib/aws-apigateway";

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
  restApiName: "advisor-portal-api",
  deploy: true,
  deployOptions: {
    stageName: "dev", 
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // use specific domain(s) in production
    allowMethods: Cors.ALL_METHODS, // or [ 'GET', 'POST', 'OPTIONS' ]
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
  /*endpointConfiguration: {
    types: [EndpointType.REGIONAL],
  }*/
});

// create a new Lambda integration
const getPeopleIntegration = new LambdaIntegration(
  backend.getPeople.resources.lambda
);
const getProfileIntegration = new LambdaIntegration(
  backend.getProfile.resources.lambda
);

// create a new resource path with IAM authorization
const people = advisorPortalApi.root.addResource("People", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
people.addMethod("GET", getPeopleIntegration); 
people.addMethod("OPTIONS", new MockIntegration({
  integrationResponses: [{
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
    },
  }],
  passthroughBehavior: PassthroughBehavior.NEVER,
  requestTemplates: { "application/json": "{\"statusCode\": 200}" },
}), {
  methodResponses: [{
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Access-Control-Allow-Methods": true,
    },
  }],
});

const profile = advisorPortalApi.root.addResource("Profile", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
profile.addMethod("GET", getProfileIntegration); 
profile.addMethod("OPTIONS", new MockIntegration({
  integrationResponses: [{
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
      "method.response.header.Access-Control-Allow-Origin": "'*'",
      "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
    },
  }],
  passthroughBehavior: PassthroughBehavior.NEVER,
  requestTemplates: { "application/json": "{\"statusCode\": 200}" },
}), {
  methodResponses: [{
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Origin": true,
      "method.response.header.Access-Control-Allow-Methods": true,
    },
  }],
});

// create a new IAM policy to allow Invoke access to the API
const advisorApiPolicy = new Policy(apiStack, "AdvisorApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${advisorPortalApi.arnForExecuteApi("*", "/People", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/People/*", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/Profile", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/Profile/*", "dev")}`,
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