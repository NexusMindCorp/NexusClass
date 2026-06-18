import type { ErroSupabase } from "@/hooks/CalendarioHooks/type";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCorMateria = (nomeDaMateria: string) => {
  const cores = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",

    "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400",
    "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
    "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-400",
  ];

  let hash = 0;
  for (let i = 0; i < nomeDaMateria.length; i++) {
    hash = nomeDaMateria.charCodeAt(i) + ((hash << 5) - hash);
  }

  return cores[Math.abs(hash) % cores.length];
};

export const getCorNomeUsuario = (nome: string) => {
  const cores = [
    "bg-blue-600 text-white dark:bg-blue-500/25 dark:text-blue-200",
    "bg-emerald-600 text-white dark:bg-emerald-500/25 dark:text-emerald-200",
    "bg-red-600 text-white dark:bg-red-500/25 dark:text-red-200",
    "bg-purple-600 text-white dark:bg-purple-500/25 dark:text-purple-200",
    "bg-amber-600 text-white dark:bg-amber-500/25 dark:text-amber-100",
    "bg-pink-600 text-white dark:bg-pink-500/25 dark:text-pink-200",
    "bg-teal-600 text-white dark:bg-teal-500/25 dark:text-teal-200",
    "bg-indigo-600 text-white dark:bg-indigo-500/25 dark:text-indigo-200",

    "bg-orange-600 text-white dark:bg-orange-500/25 dark:text-orange-200",
    "bg-cyan-600 text-white dark:bg-cyan-500/25 dark:text-cyan-200",
    "bg-fuchsia-600 text-white dark:bg-fuchsia-500/25 dark:text-fuchsia-200",
    "bg-rose-600 text-white dark:bg-rose-500/25 dark:text-rose-200",
    "bg-violet-600 text-white dark:bg-violet-500/25 dark:text-violet-200",
    "bg-sky-600 text-white dark:bg-sky-500/25 dark:text-sky-200",
    "bg-lime-700 text-white dark:bg-lime-500/25 dark:text-lime-100",

    "bg-slate-600 text-white dark:bg-slate-500/25 dark:text-slate-200",
    "bg-neutral-600 text-white dark:bg-neutral-500/25 dark:text-neutral-200",
    "bg-green-600 text-white dark:bg-green-500/25 dark:text-green-200",
    "bg-yellow-600 text-white dark:bg-yellow-500/25 dark:text-yellow-100",
    "bg-blue-700 text-white dark:bg-blue-500/30 dark:text-blue-100",
    "bg-purple-700 text-white dark:bg-purple-500/30 dark:text-purple-100",
    "bg-emerald-700 text-white dark:bg-emerald-500/30 dark:text-emerald-100",

    "bg-rose-700 text-white dark:bg-rose-500/30 dark:text-rose-100",
    "bg-orange-700 text-white dark:bg-orange-500/30 dark:text-orange-100",
    "bg-cyan-700 text-white dark:bg-cyan-500/30 dark:text-cyan-100",
    "bg-violet-700 text-white dark:bg-violet-500/30 dark:text-violet-100",
    "bg-teal-700 text-white dark:bg-teal-500/30 dark:text-teal-100",
  ];

  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }

  return cores[Math.abs(hash) % cores.length];
};

export const capitalizer = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const capitalizerNomeTodo = (nome: string) => {
  nome.split(" ").map(capitalizer);
  return nome.split(" ").map(capitalizer).join(" ");
};

export function formatarDataLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

export function montarDataEvento(data: string, horario: string) {
  const dataEvento = new Date(`${data}T${horario}`)
  return Number.isNaN(dataEvento.getTime()) ? null : dataEvento
}
export function comparaDataHj(data: Date) {
  const diaHoje = new Date();
  diaHoje.setHours(0, 0, 0, 0); 
  return data >= diaHoje;
}

export function formatarDataCurta(dataIso: string) {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
};

export function hojeChaveLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};
export function isDataEntregaFutura(dataEntrega: string) {
    const dataAtual = new Date();
    const dataEntregaObj = new Date(dataEntrega);
    return dataEntregaObj > dataAtual;
};

export function paraChaveData(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}
export function paraData(chaveData: string) {
  const [ano, mes, dia] = chaveData.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

export function hojeLocal() {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

export function formatarErroSupabase(erro: ErroSupabase, acao: string) {
  if (erro.code === "PGRST205") {
    return `Falha ao ${acao}: PostgREST nao encontrou public.eventos_calendario no cache de schema. Rode o SQL em supabase/001_eventos_calendario.sql e recarregue o schema.`
  }

  if (erro.code === "42P01") {
    return `Falha ao ${acao}: tabela eventos_calendario nao existe. Rode o SQL em supabase/001_eventos_calendario.sql.`
  }

  if (erro.code === "42501") {
    return `Falha ao ${acao}: permissao negada (RLS). Verifique as policies da tabela eventos_calendario.`
  }

  const detalhes = erro.details ? ` (${erro.details})` : ""
  const mensagem = erro.message ? ` ${erro.message}${detalhes}` : ""
  return `Falha ao ${acao} no Supabase.${mensagem}`
}
export function extrairUrlsAnexo(anexoUrl: string | null): string[] {
    if (!anexoUrl) return [];
    try {
        if (anexoUrl.startsWith("[") && anexoUrl.endsWith("]")) {
            const parsed = JSON.parse(anexoUrl);
            if (Array.isArray(parsed)) return parsed;
        }
        return [anexoUrl];
    } catch {
        return [anexoUrl];
    }
}

export function obterNomeArquivoDoUrl(url: string): string {
    try {
        const decoded = decodeURIComponent(url);
        const cleanUrl = decoded.split("?")[0];
        const parts = cleanUrl.split("/");
        return parts[parts.length - 1];
    } catch {
        return "";
    }
}

export function obterChaveDataLocal(dataIso: string) {
  return new Date(dataIso).toLocaleDateString("pt-BR")
}

export function formatarDataRelativa(dataIso: string) {
  const data = new Date(dataIso)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(hoje.getDate() - 1)

  if (data.toDateString() === hoje.toDateString()) {
    return "Hoje"
  }

  if (data.toDateString() === ontem.toDateString()) {
    return "Ontem"
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function obterSetLocalStorage(chave: string) {
  if (typeof window === "undefined") {
    return new Set<string>()
  }

  try {
    const valorSalvo = window.localStorage.getItem(chave)
    const valores = valorSalvo ? JSON.parse(valorSalvo) : []
    return new Set<string>(Array.isArray(valores) ? valores : [])
  } catch {
    return new Set<string>()
  }
}

export function salvarSetLocalStorage(chave: string, valores: Set<string>) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(chave, JSON.stringify(Array.from(valores)))
}
