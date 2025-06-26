import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react-core';
import { generateClient } from "aws-amplify/data";
import type { AuthUser } from '@aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function App() {
  
  const {signOut} = useAuthenticator();
  const { user } = useAuthenticator((context) => [context.user]);

  const typedUser: AuthUser = user;
  const [idToken, setIdToken] = useState<string | null>(null);
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

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      <div>
      <p><strong>Username:</strong> {typedUser.username}</p>
      <p><strong>User ID:</strong> {typedUser.userId}</p>
      <p><strong>Email:</strong> {typedUser.signInDetails?.loginId}</p>
    </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
