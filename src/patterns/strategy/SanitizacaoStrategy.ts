/**
 * Padrão Strategy (GoF) — Sanitização e Validação Contextual (OWASP XSS Prevention).
 *
 * A prevenção de XSS exige tratamento distinto conforme o contexto de destino:
 *  - Texto livre / multilinha (persistência no banco): normalização estrutural
 *    sem corromper operadores ou trechos de código legítimos (<, >, &, ").
 *  - URLs (foto_url, banner_url, href, window.open): allowlist estrita http(s):.
 *  - Saída HTML literal (templates de e-mail): HTML Entity Encoding OWASP.
 */

export type ContextoSanitizacao = "texto" | "url" | "html";

export interface SanitizacaoStrategy<TEntrada = string, TSaida = string> {
  readonly contexto: ContextoSanitizacao;
  sanitizar(entrada: TEntrada): TSaida;
}

export interface OpcoesTextoEntrada {
  multiline?: boolean;
  maxLength?: number;
}

export interface OpcoesUrlSegura {
  permitirCaminhoRelativo?: boolean;
}

// Caracteres de controle ASCII invisíveis (exceto \n = 0x0A e \t = 0x09 quando multiline)
// eslint-disable-next-line no-control-regex
const REGEX_CONTROLE_MULTILINHA = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
// eslint-disable-next-line no-control-regex
const REGEX_CONTROLE_LINHA_UNICA = /[\u0000-\u001F\u007F]/g;

/**
 * Estratégia concreta para normalização estrutural de textos de entrada.
 * Remove bytes nulos e caracteres de controle invisíveis sem aplicar
 * HTML-encoding no banco (preservando fórmulas/código legítimos conforme OWASP).
 */
export class TextoEntradaStrategy
  implements SanitizacaoStrategy<string, string>
{
  readonly contexto = "texto" as const;
  private readonly multiline: boolean;
  private readonly maxLength?: number;

  constructor(opcoes: OpcoesTextoEntrada = {}) {
    this.multiline = opcoes.multiline ?? false;
    this.maxLength = opcoes.maxLength;
  }

  sanitizar(entrada: string): string {
    const normalizado = entrada.replace(/\r\n?/g, "\n");
    const semControle = this.multiline
      ? normalizado.replace(REGEX_CONTROLE_MULTILINHA, "")
      : normalizado.replace(REGEX_CONTROLE_LINHA_UNICA, " ");

    const limpo = semControle.trim();
    if (this.maxLength !== undefined && this.maxLength > 0 && limpo.length > this.maxLength) {
      return limpo.slice(0, this.maxLength).trim();
    }

    return limpo;
  }
}

/**
 * Estratégia concreta para validação de URLs por allowlist estrita (http: / https:).
 * Bloqueia esquemas perigosos (javascript:, data:, vbscript:, file:),
 * caracteres de controle, espaços e credenciais embutidas na URL.
 */
export class UrlHttpSeguraStrategy
  implements SanitizacaoStrategy<string | null | undefined, string | null>
{
  readonly contexto = "url" as const;
  private readonly permitirCaminhoRelativo: boolean;

  constructor(opcoes: OpcoesUrlSegura = {}) {
    this.permitirCaminhoRelativo = opcoes.permitirCaminhoRelativo ?? false;
  }

  sanitizar(entrada: string | null | undefined): string | null {
    if (!entrada) return null;

    const limpa = entrada.trim();
    if (!limpa) return null;

    if (REGEX_CONTROLE_LINHA_UNICA.test(limpa) || /[\s<>"']/.test(limpa)) {
      return null;
    }

    if (
      this.permitirCaminhoRelativo &&
      limpa.startsWith("/") &&
      !limpa.startsWith("//")
    ) {
      return limpa;
    }

    try {
      const parsed = new URL(limpa);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return null;
      }
      if (parsed.username || parsed.password) {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }
}

const MAPA_ENTIDADES_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Estratégia concreta para saída HTML literal (HTML Entity Encoding OWASP).
 * Converte &, <, >, " e ' em entidades seguras para contextos HTML.
 */
export class EscapeHtmlStrategy implements SanitizacaoStrategy<string, string> {
  readonly contexto = "html" as const;

  sanitizar(entrada: string): string {
    return entrada.replace(/[&<>"']/g, (char) => MAPA_ENTIDADES_HTML[char]);
  }
}

/**
 * Executa qualquer estratégia de sanitização seguindo o contrato Strategy (GoF).
 */
export function executarSanitizacao<TEntrada, TSaida>(
  entrada: TEntrada,
  estrategia: SanitizacaoStrategy<TEntrada, TSaida>,
): TSaida {
  return estrategia.sanitizar(entrada);
}

const estrategiaLinhaUnicaPadrao = new TextoEntradaStrategy({ multiline: false });
const estrategiaMultilinhaPadrao = new TextoEntradaStrategy({ multiline: true });
const estrategiaUrlHttp = new UrlHttpSeguraStrategy({
  permitirCaminhoRelativo: false,
});
const estrategiaUrlAsset = new UrlHttpSeguraStrategy({
  permitirCaminhoRelativo: true,
});
const estrategiaEscapeHtml = new EscapeHtmlStrategy();

export function sanitizarTextoLinhaUnica(
  texto: string,
  maxLength?: number,
): string {
  const estrategia =
    maxLength !== undefined
      ? new TextoEntradaStrategy({ multiline: false, maxLength })
      : estrategiaLinhaUnicaPadrao;
  return executarSanitizacao(texto, estrategia);
}

export function sanitizarTextoMultilinha(
  texto: string,
  maxLength?: number,
): string {
  const estrategia =
    maxLength !== undefined
      ? new TextoEntradaStrategy({ multiline: true, maxLength })
      : estrategiaMultilinhaPadrao;
  return executarSanitizacao(texto, estrategia);
}

export function obterUrlHttpSegura(
  url: string | null | undefined,
  opcoes?: OpcoesUrlSegura,
): string | null {
  const estrategia = opcoes?.permitirCaminhoRelativo
    ? estrategiaUrlAsset
    : estrategiaUrlHttp;
  return executarSanitizacao(url, estrategia);
}

export function exigirUrlHttpSeguraOuNula(
  url: string | null | undefined,
  mensagemErro = "Informe uma URL válida iniciada por https:// ou http://.",
): string | null {
  if (!url || url.trim() === "") return null;
  const segura = obterUrlHttpSegura(url);
  if (!segura) {
    throw new Error(mensagemErro);
  }
  return segura;
}

export function escaparHtml(texto: string): string {
  return executarSanitizacao(texto, estrategiaEscapeHtml);
}
