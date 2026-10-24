import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

// Stubs seguros para variáveis globais de build (definidas no vite.config.ts)
// Garante que nenhum teste utilize chaves reais ou falhe por ReferenceError
vi.stubGlobal('__URL_SUPABASE__', 'http://localhost:54321');
vi.stubGlobal('__KEY_SUPABASE__', 'test-anon-key-dummy');
vi.stubGlobal('__API_GEMINI_KEY__', 'test-gemini-key-dummy');
vi.stubGlobal('__APP_VERSION__', '0.0.0-test');
vi.stubGlobal('__BASE_URL__', '/NexusClassWeb/');

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
