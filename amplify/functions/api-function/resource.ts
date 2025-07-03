import { defineFunction, secret} from "@aws-amplify/backend";
export const userProfile = defineFunction({
  name: "UserProfile",
  entry: "./UserProfile.ts", 
  environment: {
    Location_API_URL: secret('Location_API_URL') ?? '',
    Weather_API_URL: secret('Weather_API_URL')?? '',
    WEATHER_API_KEY : secret('WEATHER_API_KEY') ?? '', // Replace with your actual API key
  }
}); 
export const userPersonalization = defineFunction({
  name: "UserPersonalization",
  entry: "./UserPersonalization.ts", 
}); 