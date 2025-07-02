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
import { userProfile, userPersonalization } from "./functions/api-function/resource";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { EndpointType } from "aws-cdk-lib/aws-apigateway";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

const backend = defineBackend({
  auth,
  data,
  userProfile,
  userPersonalization
});

// create a new API stack
const apiStack = backend.createStack("advisor-api-stack");

const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});


// create a new REST API
const advisorPortalApi = new RestApi(apiStack, "AdvisorPortalApi", {
  restApiName: "AdvisorPortalApi",
  deploy: true,
  deployOptions: {
    stageName: "dev", 
  },
  endpointConfiguration: {
    types: [EndpointType.REGIONAL],
  },
});

// create a new Lambda integration
const userProfileIntegration = new LambdaIntegration(
  backend.userProfile.resources.lambda
);
const userPersonalizationIntegration = new LambdaIntegration(
  backend.userPersonalization.resources.lambda
);

const corsOptions = {
  integration: new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Authorization,X-Amz-Date,Content-Type,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      'application/json': '{"statusCode": 200}',
    },
  }),
  methodResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
      'method.response.header.Access-Control-Allow-Origin': true,
    },
  }],
};

// create a new resource path with IAM authorization
const userProfileResource = advisorPortalApi.root.addResource("UserProfile", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
userProfileResource.addMethod("GET", userProfileIntegration); 
userProfileResource.addMethod(
  "OPTIONS",
  corsOptions.integration, {
    methodResponses: corsOptions.methodResponses,
    authorizationType: apigateway.AuthorizationType.NONE,
  }
);

const userPersonalizationResource = advisorPortalApi.root.addResource("UserPersonalization", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
    authorizer: cognitoAuth,
  },
});
userPersonalizationResource.addMethod("GET", userPersonalizationIntegration); 
userPersonalizationResource.addMethod(
  "OPTIONS",
  corsOptions.integration, {
    methodResponses: corsOptions.methodResponses,
    authorizationType: apigateway.AuthorizationType.NONE,
  }
);

// create a new IAM policy to allow Invoke access to the API
const advisorApiPolicy = new Policy(apiStack, "AdvisorApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${advisorPortalApi.arnForExecuteApi("*", "/UserProfile", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/UserProfile/*", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/UserPersonalization", "dev")}`,
        `${advisorPortalApi.arnForExecuteApi("*", "/UserPersonalization/*", "dev")}`,
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