-- Gabriel Lineker, 2026-11-20. Inspeção somente leitura do acesso ao calendário.
SELECT p.tablename, p.policyname, p.permissive, p.roles,
       t.rowsecurity AS rls_habilitada, p.qual AS condicao
FROM pg_catalog.pg_policies AS p
JOIN pg_catalog.pg_tables AS t USING (schemaname, tablename)
WHERE p.schemaname = 'public'
  AND p.tablename IN ('evento_calendario', 'alerta_calendario')
  AND p.cmd IN ('SELECT', 'ALL')
ORDER BY p.tablename, p.policyname;
