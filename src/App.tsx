//https://docs.amplify.aws/react/build-a-backend/add-aws-services/rest-api/set-up-rest-api/
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react-core';
import { generateClient } from "aws-amplify/data";
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';
import Weather from "./Weather";

const client = generateClient<Schema>();

function App() {
  
  const {signOut} = useAuthenticator();
  const [idToken, setIdToken] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("")

  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  useEffect(() => {
    async function getToken() {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        setIdToken(token ?? 'No ID token found');
      } catch (error) { 
        console.error('Error fetching session:', error);
        setIdToken('Error fetching token');
      }
    }

    getToken();
  }, []);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  useEffect(() => {
    async function getToken() {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        setIdToken(token ?? 'No ID token found');
      } catch (error) {
        console.error('Error fetching session:', error);
        setIdToken('Error fetching token');
      }
    }

    getToken();
  }, []);

  useEffect(() => {
    if (!idToken) return;

    async function callApi() {
      try {
        const endpoint = outputs.custom.API.AdvisorPortalApi.endpoint;
        const path = 'UserPersonalization'; // Adjust the path as needed
        const response = await fetch(`${endpoint}${path}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await response.json();
        setGreeting(data);
      } catch (error) {
        console.error("API call failed:", error);
        setGreeting("API call failed");
      }
    }
    callApi();
  }, [idToken]);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <main>
      <h1>My todos - {greeting}</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <Weather token={idToken} />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      <div>
    </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
