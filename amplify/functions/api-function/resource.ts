import { defineFunction } from "@aws-amplify/backend";
export const userProfile = defineFunction({
  name: "UserProfile",
  entry: "./UserProfile.ts", 
}); 
export const userPersonalization = defineFunction({
  name: "UserPersonalization",
  entry: "./UserPersonalization.ts", 
}); 