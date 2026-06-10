import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    // O esbuild não emite decorator metadata; os testes instanciam as classes
    // diretamente (sem o container de DI do Nest), então só os decorators legacy bastam.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
