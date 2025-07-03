import type { APIGatewayProxyHandler } from "aws-lambda";

// Helper to build standard HTTP responses
const createResponse = (statusCode: number, body: object) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  },
  body: JSON.stringify(body),
});

// Fetch location data using coordinates
const fetchLocationData = async (latitude: string, longitude: string, apiKey: string) => {
  const locationUrl = `${process.env.Location_API_URL}?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&limit=1&appid=${encodeURIComponent(apiKey)}`;
  const response = await fetch(locationUrl);

  if (!response.ok) {
    throw new Error(`Location API error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
};

// Fetch weather data using location info
const fetchWeatherData = async (name: string, state: string, country: string, apiKey: string) => {
  const weatherUrl = `${process.env.Weather_API_URL}?q=${encodeURIComponent(name)},${encodeURIComponent(state)},${encodeURIComponent(country)}&appid=${encodeURIComponent(apiKey)}`;
  const response = await fetch(weatherUrl);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return await response.json();
};

// Convert Kelvin to Fahrenheit
const convertKelvinToFahrenheit = (kelvin: number) => ((kelvin - 273.15) * 9 / 5 + 32).toFixed(2);

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event - ", event);

  const latitude = event.queryStringParameters?.latitude;
  const longitude = event.queryStringParameters?.longitude;
  const apiKey = process.env.WEATHER_API_KEY;

  if (!latitude || !longitude) {
    return createResponse(400, { error: "Latitude and longitude are required" });
  }

  if (!apiKey || !process.env.Location_API_URL || !process.env.Weather_API_URL) {
    return createResponse(500, { error: "Missing required environment variables" });
  }

  try {
    const location = await fetchLocationData(latitude, longitude, apiKey);

    if (!location) {
      return createResponse(404, { error: "No location found for the provided coordinates" });
    }

    const { name, state, country } = location;
    const weather = await fetchWeatherData(name, state, country, apiKey);
    const temperature = convertKelvinToFahrenheit(weather.main.temp);

    return createResponse(200, { name, state, country, temperature });
  } catch (error) {
    console.error("Error fetching weather/location data:", error);
    return createResponse(500, { error: "Failed to fetch weather data" });
  }
};
