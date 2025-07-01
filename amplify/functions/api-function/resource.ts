import { defineFunction } from "@aws-amplify/backend";
export const getPeople = defineFunction({
  name: "getPeople",
  entry: "./getPeople.ts", 
}); 