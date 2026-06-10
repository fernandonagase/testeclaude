import { useEffect, useState } from 'react';
import { DEX_CATEGORIES, healthResponseSchema, type HealthResponse } from '@collectdex/shared';

/**
 * Esqueleto da web (Fase 0): foco futuro em criação de Dexes (doc 02, épico B).
 * TODO(Fase 1): formulário real de criação + listagem de itens.
 */
export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch('/healthz')
      .then(async (res) => healthResponseSchema.parse(await res.json()))
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Collectdex 📒</h1>
      <p>Uma Pokédex para qualquer coisa — esqueleto da Fase 0.</p>

      <section>
        <h2>Criar uma Dex</h2>
        <p>Categorias disponíveis:</p>
        <ul>
          {DEX_CATEGORIES.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </section>

      <footer style={{ marginTop: '2rem', color: '#666' }}>
        API: {health ? `${health.status} (db: ${health.db}, v${health.version})` : 'offline'}
      </footer>
    </main>
  );
}
