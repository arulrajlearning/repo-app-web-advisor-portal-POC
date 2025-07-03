import type { APIGatewayProxyHandler, APIGatewayProxyEvent  } from "aws-lambda";

// --- CORS headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// --- Standard response builder ---
const createResponse = (statusCode: number, body: object) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

// --- Utility: Kelvin to Fahrenheit ---
const convertKelvinToFahrenheit = (kelvin: number) =>
  ((kelvin - 273.15) * 9) / 5 + 32;

// --- Fetch location ---
const fetchLocationData = async (latitude: string, longitude: string, apiKey: string) => {
  const url = `${process.env.Location_API_URL}?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Location API error: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
};

// --- Fetch weather ---
const fetchWeatherData = async (name: string, state: string, country: string, apiKey: string) => {
  const url = `${process.env.Weather_API_URL}?q=${encodeURIComponent(name)},${encodeURIComponent(state)},${encodeURIComponent(country)}&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return await response.json();
};

// --- Handle GET request --- 
const handleGetRequest = async (event: APIGatewayProxyEvent) => {
  const latitude = event.queryStringParameters?.latitude;
  const longitude = event.queryStringParameters?.longitude;

  if (!latitude || !longitude) {
    return createResponse(400, { error: "Latitude and longitude are required" });
  }

  const apiKey = process.env.WEATHER_API_KEY;
  const locationUrl = process.env.Location_API_URL;
  const weatherUrl = process.env.Weather_API_URL;

  if (!apiKey || !locationUrl || !weatherUrl) {
    return createResponse(500, { error: "Missing required environment variables" });
  }

  try {
    const location = await fetchLocationData(latitude, longitude, apiKey);
    if (!location) {
      return createResponse(404, { error: "No location found for provided coordinates" });
    }

    const { name, state, country } = location;
    const weather = await fetchWeatherData(name, state, country, apiKey);
    const temperature = convertKelvinToFahrenheit(weather.main.temp);

    return createResponse(200, {
      name,
      state,
      country,
      temperature: `${temperature} °F`,
      description: weather.weather?.[0]?.description || "No description",
    });
  } catch (err) {
    console.error("Error fetching data:", err);
    return createResponse(500, { error: "Failed to fetch location or weather data" });
  }
};

// --- Lambda entrypoint ---
export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  console.log(`Received ${method} request`);

  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (method === "GET") {
    return handleGetRequest(event);
  }

  return createResponse(501, { error: `${method} not implemented yet` });
};
