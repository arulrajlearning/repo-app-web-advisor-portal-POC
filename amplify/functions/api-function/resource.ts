import { defineFunction } from "@aws-amplify/backend";
export const getPeople = defineFunction({
  name: "getPeople",
  entry: "./src/getPeople.ts", 
}); 