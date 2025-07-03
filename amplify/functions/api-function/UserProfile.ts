import type {APIGatewayProxyHandler} from "aws-lambda";
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);

  const latitude = event.queryStringParameters?.latitude;
  const longitude = event.queryStringParameters?.longitude;
  const apiKey = "18a213f18687259a868a7b5fc733958c";

  if (!latitude || !longitude) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ error: "Latitude and longitude are required" }),
    };
  }
  const url = `http://api.openweathermap.org/geo/1.0/reverse`
    + `?lat=${encodeURIComponent(latitude)}`
    + `&lon=${encodeURIComponent(longitude)}`
    + `&limit=1`
    + `&appid=${encodeURIComponent(apiKey)}`;

  return {
    statusCode: 200,
    // Modify the CORS settings below to match your specific requirements
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
      "Access-Control-Allow-Methods": "*",
    },
    body: JSON.stringify(url),
  };
};