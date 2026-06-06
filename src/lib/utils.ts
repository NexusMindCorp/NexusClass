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
    "bg-blue-200 text-blue-900 dark:bg-blue-900/50 dark:text-blue-400",
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-400",
    "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-400",
    "bg-purple-200 text-purple-900 dark:bg-purple-900/50 dark:text-purple-400",
    "bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-400",
    "bg-pink-200 text-pink-900 dark:bg-pink-900/50 dark:text-pink-400",
    "bg-teal-200 text-teal-900 dark:bg-teal-900/50 dark:text-teal-400",
    "bg-indigo-200 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-400",

    "bg-orange-200 text-orange-900 dark:bg-orange-900/50 dark:text-orange-400",
    "bg-cyan-200 text-cyan-900 dark:bg-cyan-900/50 dark:text-cyan-400",
    "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-900/50 dark:text-fuchsia-400",
    "bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-400",
    "bg-violet-200 text-violet-900 dark:bg-violet-900/50 dark:text-violet-400",
    "bg-sky-200 text-sky-900 dark:bg-sky-900/50 dark:text-sky-400",
    "bg-lime-200 text-lime-900 dark:bg-lime-900/50 dark:text-lime-400",

    "bg-slate-200 text-slate-900 dark:bg-slate-900/50 dark:text-slate-400",
    "bg-gray-200 text-gray-900 dark:bg-gray-900/50 dark:text-gray-400",
    "bg-zinc-200 text-zinc-900 dark:bg-zinc-900/50 dark:text-zinc-400",
    "bg-neutral-200 text-neutral-900 dark:bg-neutral-900/50 dark:text-neutral-400",
    "bg-stone-200 text-stone-900 dark:bg-stone-900/50 dark:text-stone-400",

    "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-400",
    "bg-yellow-200 text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-400",
    "bg-blue-300 text-blue-950 dark:bg-blue-900/50 dark:text-blue-400",
    "bg-purple-300 text-purple-950 dark:bg-purple-900/50 dark:text-purple-400",
    "bg-emerald-300 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-400",

    "bg-rose-300 text-rose-950 dark:bg-rose-900/50 dark:text-rose-400",
    "bg-orange-300 text-orange-950 dark:bg-orange-900/50 dark:text-orange-400",
    "bg-cyan-300 text-cyan-950 dark:bg-cyan-900/50 dark:text-cyan-400",
    "bg-violet-300 text-violet-950 dark:bg-violet-900/50 dark:text-violet-400",
    "bg-teal-300 text-teal-950 dark:bg-teal-900/50 dark:text-teal-400",
  ];

  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }

  return cores[Math.abs(hash) % cores.length];
};