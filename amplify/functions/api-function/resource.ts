import { defineFunction } from "@aws-amplify/backend";
export const getPeople = defineFunction({
  name: "getPeople",
  entry: "./getPeople.ts", 
}); 
export const getProfile = defineFunction({
  name: "getProfile",
  entry: "./getProfile.ts", 
}); 