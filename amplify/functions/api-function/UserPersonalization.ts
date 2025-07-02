//call dynamodb to create, update, delete and load user personlization settings data
import type {APIGatewayProxyHandler} from "aws-lambda";
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  const claims = event.requestContext?.authorizer?.claims;
  const email = claims?.email || "unknown";

  const now = new Date();
  const hour = now.getHours();

   let greeting = '';
  if (hour >= 5 && hour < 12) {
    greeting = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return {
    statusCode: 200,
    // Modify the CORS settings below to match your specific requirements
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      "Access-Control-Allow-Methods": "*",
    },
    /*body: JSON.stringify("Hello from UserPersonalization[ById][ByEmailAddress] - arulraj joseph!"),*/
    body: JSON.stringify(`${greeting}, ${email}!`),
  };
};