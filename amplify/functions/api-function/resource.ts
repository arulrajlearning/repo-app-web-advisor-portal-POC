import { defineFunction } from "@aws-amplify/backend";
export const getPeople = defineFunction({
  name: "getPeople",
  entry: "./api-function/getPeople.ts", 
}); 