import { describe, expect, it, vi } from "vitest";
import {
  EscapeHtmlStrategy,
  TextoEntradaStrategy,
  UrlHttpSeguraStrategy,
  escaparHtml,
  executarSanitizacao,
  exigirUrlHttpSeguraOuNula,
  obterUrlHttpSegura,
  sanitizarTextoLinhaUnica,
  sanitizarTextoMultilinha,
} from "@/patterns/strategy/SanitizacaoStrategy";
import { PerfilRepository } from "@/repositories/PerfilRepository";
import type { ClienteSupabaseTipado } from "@/repositories/base";

describe("SanitizacaoStrategy (GoF Strategy — Prevenção XSS OWASP)", () => {
  describe("TextoEntradaStrategy (Contexto: texto livre / banco)", () => {
    it("remove caracteres de controle invisíveis mas preserva operadores legítimos (<, >, &, aspas)", () => {
      const estrategia = new TextoEntradaStrategy({ multiline: true });
      expect(estrategia.contexto).toBe("texto");

      const entrada =
        "  SELECT * FROM aluno WHERE nota < 60 && nome <> 'Ana'\r\nLinha 2\u0000\u0007\u001F  ";
      expect(executarSanitizacao(entrada, estrategia)).toBe(
        "SELECT * FROM aluno WHERE nota < 60 && nome <> 'Ana'\nLinha 2",
      );
    });

    it("converte quebras de linha e tabs em espaço no modo linha única e respeita maxLength", () => {
      expect(sanitizarTextoLinhaUnica("  Título\ncom\tquebra\u0000  ")).toBe(
        "Título com quebra",
      );
      expect(sanitizarTextoLinhaUnica("ABCDEFGH", 5)).toBe("ABCDE");
      expect(sanitizarTextoMultilinha("Linha 1\r\nLinha 2", 10)).toBe(
        "Linha 1\nLi",
      );
    });
  });

  describe("UrlHttpSeguraStrategy (Contexto: URL / allowlist http(s))", () => {
    it("aceita apenas URLs http:// e https:// válidas", () => {
      const estrategia = new UrlHttpSeguraStrategy();
      expect(estrategia.contexto).toBe("url");

      expect(obterUrlHttpSegura("https://cdn.nexusclass.edu.br/avatar.png")).toBe(
        "https://cdn.nexusclass.edu.br/avatar.png",
      );
      expect(obterUrlHttpSegura("http://localhost:5173/img.png")).toBe(
        "http://localhost:5173/img.png",
      );
    });

    it("rejeita esquemas perigosos (javascript:, data:, vbscript:, file:), HTML inline e credenciais", () => {
      expect(obterUrlHttpSegura("javascript:alert(1)")).toBeNull();
      expect(obterUrlHttpSegura("JAVASCRIPT:alert(1)")).toBeNull();
      expect(obterUrlHttpSegura("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(obterUrlHttpSegura("vbscript:msgbox(1)")).toBeNull();
      expect(obterUrlHttpSegura("file:///etc/passwd")).toBeNull();
      expect(obterUrlHttpSegura("https://user:pass@evil.example/a.png")).toBeNull();
      expect(obterUrlHttpSegura("https://example.com/<script>")).toBeNull();
      expect(obterUrlHttpSegura("https://example.com/a\u0000b")).toBeNull();
      expect(obterUrlHttpSegura("url-invalida")).toBeNull();
      expect(obterUrlHttpSegura("   ")).toBeNull();
      expect(obterUrlHttpSegura(null)).toBeNull();
    });

    it("permite caminho relativo interno apenas quando permitirCaminhoRelativo=true e bloqueia protocol-relative (//)", () => {
      expect(
        obterUrlHttpSegura("/Logos/Logo.png", { permitirCaminhoRelativo: true }),
      ).toBe("/Logos/Logo.png");
      expect(
        obterUrlHttpSegura("/Logos/Logo.png", { permitirCaminhoRelativo: false }),
      ).toBeNull();
      expect(
        obterUrlHttpSegura("//evil.example/x.png", {
          permitirCaminhoRelativo: true,
        }),
      ).toBeNull();
    });

    it("exigirUrlHttpSeguraOuNula retorna null para vazio e lança erro para URL maliciosa", () => {
      expect(exigirUrlHttpSeguraOuNula("")).toBeNull();
      expect(exigirUrlHttpSeguraOuNula(null)).toBeNull();
      expect(exigirUrlHttpSeguraOuNula("https://example.com/ok.png")).toBe(
        "https://example.com/ok.png",
      );
      expect(() => exigirUrlHttpSeguraOuNula("javascript:alert(1)")).toThrow(
        /https:\/\/ ou http:\/\//,
      );
    });
  });

  describe("EscapeHtmlStrategy (Contexto: saída HTML literal — OWASP)", () => {
    it("escapa &, <, >, aspas duplas e aspas simples em payloads XSS", () => {
      const estrategia = new EscapeHtmlStrategy();
      expect(estrategia.contexto).toBe("html");

      expect(
        escaparHtml(`<img src="x" onerror='alert(1)'> & <script>x()</script>`),
      ).toBe(
        "&lt;img src=&quot;x&quot; onerror=&#x27;alert(1)&#x27;&gt; &amp; &lt;script&gt;x()&lt;/script&gt;",
      );
    });
  });

  describe("Integração com PerfilRepository.atualizarDados", () => {
    it("bloqueia foto_url com javascript: antes mesmo de enviar ao Supabase", async () => {
      const from = vi.fn();
      const repo = new PerfilRepository({ from } as unknown as ClienteSupabaseTipado);

      await expect(
        repo.atualizarDados("00000000-0000-0000-0000-000000000008", {
          foto_url: "javascript:alert('xss')",
          bio: "Bio normal",
        }),
      ).rejects.toThrow(/https:\/\/ ou http:\/\//);

      expect(from).not.toHaveBeenCalled();
    });
  });
});
