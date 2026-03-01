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