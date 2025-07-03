import type { APIGatewayProxyHandler } from "aws-lambda";
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
  const locationUrl = `http://api.openweathermap.org/geo/1.0/reverse`
    + `?lat=${encodeURIComponent(latitude)}`
    + `&lon=${encodeURIComponent(longitude)}`
    + `&limit=1`
    + `&appid=${encodeURIComponent(apiKey)}`;
  try {
    const locationResponse = await fetch(locationUrl);
    if (!locationResponse.ok) {
      throw new Error(`HTTP error! status: ${locationResponse.status}`);
    }
    const lcationData = await locationResponse.json();

    if (Array.isArray(lcationData) && lcationData.length > 0) {
      const { name, state, country } = lcationData[0];
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather`
        + `?q=${encodeURIComponent(name)},${encodeURIComponent(state)},${encodeURIComponent(country)}`
        + `&appid=${encodeURIComponent(apiKey)}`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error(`HTTP error! status: ${weatherResponse.status}`);
      }
      const weatherData = await weatherResponse.json();
      const { main: {temp} } = weatherData;
      const tempInCelsius = (temp - 273.15).toFixed(2); // Convert Kelvin to Celsius
      //arulraj joseph - you can use weatherData to get more details like temperature, humidity, etc.
      if (Array.isArray(lcationData) && lcationData.length > 0) {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
          },
          body: JSON.stringify({ name, state, country, temperature: tempInCelsius }),
        };
      }
      else {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
          },
          body: JSON.stringify({ error: "No weather found for the provided location" }),
        };
      }

    }
    else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
        },
        body: JSON.stringify({ error: "No location found for the provided coordinates" }),
      };
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ error: "Failed to fetch weather data" }),
    };
  }
};