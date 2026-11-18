# Troubleshooting: Erro EPERM ao Executar `tsc -b` e `vitest` no Sandbox Windows

- **Data:** 2026-11-17
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Ambiente:** Windows (PowerShell / execução dentro do sandbox do terminal do agente)
- **Severidade:** Média (impede typecheck incremental e carregamento de `vite.config.ts` no modo sandbox padrão)
- **Status:** Resolvido com Workaround documentado

## Sintomas e Erro
1. Ao rodar `npx tsc -b --noEmit` no sandbox padrão:
   ```text
   error TS5033: Could not write file 'C:/Users/gianl/NexusClass/node_modules/.tmp/tsconfig.app.tsbuildinfo': EPERM
   ```
2. Ao rodar `npx vitest run` (ou `--coverage`) no sandbox padrão:
   ```text
   failed to load config from C:\Users\gianl\NexusClass\vite.config.ts
   Error: EPERM: operation not permitted, open 'C:\Users\gianl\NexusClass\node_modules\.vite-temp\vite.config.ts.timestamp-...mjs'
   ```

## Causa Raiz
- `tsconfig.json` / `tsconfig.app.json` usam build incremental gravando cache `.tsbuildinfo` em `node_modules/.tmp/`.
- Vite / Vitest geram arquivo temporário compilado de `vite.config.ts` dentro de `node_modules/.vite-temp/`.
- No Windows dentro do sandbox padrão, operações de escrita/criação nessas subpastas de `node_modules/` podem retornar `EPERM: operation not permitted`.

## Solução Definitiva
Manter o workflow local usando os scripts padrão fora de restrições de escrita em `node_modules/` quando executados diretamente no terminal do desenvolvedor. Em CI ou pipelines restritos, desabilitar cache incremental do TypeScript quando necessário.

## Workaround
1. **Typecheck dentro do sandbox:**
   ```powershell
   npx tsc -p tsconfig.app.json --noEmit --incremental false
   ```
   (Valida toda a aplicação e `testes/` sem gravar em `node_modules/.tmp/`.)
2. **Testes Vitest / Cobertura:** executar `npx vitest run` (ou `npx vitest run --coverage`) fora do sandbox (`BypassSandbox: true` com autorização do usuário) ou diretamente no terminal local do desenvolvedor.

## Prevenção
- Nunca reportar o typecheck como válido apenas com base em cache antigo: usar `--incremental false` quando no sandbox.
- Lembrar da regra em `GEMINI.md`: **não executar `tsc` após edições exclusivas em arquivos `.md`**.
