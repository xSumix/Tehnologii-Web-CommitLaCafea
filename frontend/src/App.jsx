import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Backend returned an error');
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Aprobări administrative și conformitate</h1>
      <p>M1 Runnable Skeleton — Mandatory Packages: <strong>AUD</strong> + <strong>SEC</strong></p>

      <section style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1.5rem' }}>
        <h2>Backend Connection Status</h2>
        {error && <p style={{ color: 'crimson' }}>Error: {error} (Make sure backend is running on port 3000)</p>}
        {!health && !error && <p>Checking backend connection...</p>}
        {health && (
          <pre style={{ background: '#f4f4f4', padding: '0.75rem', borderRadius: '4px' }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}