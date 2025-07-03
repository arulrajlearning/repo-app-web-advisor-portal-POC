import type { APIGatewayProxyHandler } from "aws-lambda";
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  const latitude = event.queryStringParameters?.latitude;
  const longitude = event.queryStringParameters?.longitude;

  const apiKey = "18a213f18687259a868a7b5fc733958c";
  const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&limit=1&appid=${apiKey}`;

  try {

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const { name, state, country } = data[0];
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
        },
        body: JSON.stringify({ name, state, country }),
      };
    }
    else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Location not found" }),
      };
    }
  }
  catch (error) {
    console.error("Error fetching location data:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ error: "Failed to fetch location data" }),
    };
  }
};  