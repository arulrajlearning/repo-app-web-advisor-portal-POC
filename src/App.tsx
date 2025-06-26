import React, { useEffect, useState } from 'react';

type GreetingResponse = {
  message: string;
};

function App() {
  const [greeting, setGreeting] = useState<GreetingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://ztf3yhcase.execute-api.us-east-1.amazonaws.com/dev/Greeting';
  const cognitoTokenKey =
    'CognitoIdentityServiceProvider.n4c3d2j9o32vbqfjt1qrbp28n.a40874b8-b081-70f1-2324-5a5f81cc56fd.idToken';

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const token = localStorage.getItem(cognitoTokenKey);
        if (!token) throw new Error('No auth token found');

        const res = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setGreeting(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      }
    };

    fetchGreeting();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Greeting from API</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {greeting ? <pre>{JSON.stringify(greeting, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}

export default App;
