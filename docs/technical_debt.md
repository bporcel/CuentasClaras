# Technical Debt & Future Improvements

## 1. Mock API implementation
**Issue**: The application currently relies on a generated mock data source in `src/lib/mock-data.ts`.
**Resolution Plan**: Implement true API bridges integrating with the Spanish Government's *Plataforma de Contratación del Sector Público*, the *Base de Datos Nacional de Subvenciones* (BDNS), and the *Boletín Oficial del Estado* (BOE). 
**Complexity**: High. Requires interpreting XML/JSON unstructured government endpoints and mapping them to the `SpendingData` generic interface reliably and daily.

## 2. In-Memory Caching Scalability
**Issue**: The caching layer in `src/lib/api.ts` (`cachedData`) is currently held in-memory within the Node process scope. Given the serverless deployment nature of Next.js, this cache will not function well when scaled across multiple edge instances.
**Resolution Plan**: Move caching logic to an external fast-cache (e.g. Redis) or leverage Next.js native `unstable_cache` and built-in `fetch` caching `revalidate` tags.

## 3. Empty States & Search Reactivity
**Issue**: The `/search` route currently provides a top-tier visual filtering mock but does not actively execute queries against `mock-data.ts`.
**Resolution Plan**: Wire up the React state inputs in `/search` to re-fetch and dynamically filter the array from the API layer, then render table results below instead of the static placeholder.
