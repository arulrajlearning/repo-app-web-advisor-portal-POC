import React, { useEffect, useState } from 'react';
import outputs from '../amplify_outputs.json';

type WeatherProps = {
    token: string;
};

const Weather: React.FC<WeatherProps> = ({ token }) => {
    const [weather, setWeather] = useState<string | null>(null);
    useEffect(() => {
        async function getWeather() {
            if (token) {
                try {

                    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject)
                    );
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    console.log(latitude);
                    console.log(longitude);
                    const endpoint = outputs.custom.API.AdvisorPortalApi.endpoint;
                    const resource = 'UserProfile'; // Adjust the path as needed
                    const url = `${endpoint}${resource}/?latitude=${encodeURIComponent(latitude.toString())}&longitude=${longitude.toString()}`;
                    console.log('url', url);
                    console.log('cognito token', token);
                    
                    const response = await fetch(url, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`, // now correctly passed from props
                        },
                    });

                    const data = await response.json();
                    console.log('API response:', data);
                    setWeather(`${data.name}, ${data.state}, ${data.country} is ${data.temperature}°F.`); // assuming data contains name, state, and country
                } catch (error) {
                    console.error("API call failed:", error);
                    setWeather("API call failed");
                }
            }
        }
        getWeather();
    }, [token]); // dependency added
    if (!weather) return <div>Loading weather...</div>;
    return (
        <div>
            <h2>Weather in {weather}</h2>
        </div>
    );
};

export default Weather;
