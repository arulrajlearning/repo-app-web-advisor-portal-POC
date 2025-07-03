import React, { useEffect, useState } from 'react';

type WeatherData = {
  name: string;
  main: {
    temp: number;
  };
  weather: { description: string }[];
};

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getWeather() {
      try {
        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
        console.log(position.coords.toJSON());
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;


        // Call your Lambda weather API
        const res = await fetch(`https://your-api-id.amazonaws.com/dev/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Weather API failed');
        const data = await res.json();

        setWeather(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching weather');
      }
    }

    getWeather();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!weather) return <div>Loading weather...</div>;

  return (
    <div>
      <h2>Weather in {weather.name}</h2>
      <p>{weather.weather[0].description}</p>
      <p>{weather.main.temp}°C</p>
    </div>
  );
};

export default Weather;
