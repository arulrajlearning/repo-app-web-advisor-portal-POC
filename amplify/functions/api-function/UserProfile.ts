import type {APIGatewayProxyHandler} from "aws-lambda";
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  const latitude = event.queryStringParameters?.latitude;
  const longitude = event.queryStringParameters?.longitude;
  return {
    statusCode: 200,
    // Modify the CORS settings below to match your specific requirements
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      "Access-Control-Allow-Methods": "*",
    },
    body: JSON.stringify(`${latitude}, ${longitude}!`)
  };
};