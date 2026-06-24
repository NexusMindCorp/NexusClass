import type { LucideIcon } from "lucide-react";

export type CardItem = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

export type BadgeItem = {
  nome: string;
  icone: LucideIcon;
  cor: string;
};

export type DevItem = {
  nome: string;
  iniciais: string;
  cargo: string;
  github: string;
  corGradiente: string;
};

export type MetricaProjeto = {
  valor: string;
  rotulo: string;
};

export type FluxoProdutoItem = {
  etapa: string;
  detalhe: string;
};

export type ImplantacaoEtapa = {
  titulo: string;
  plataforma: string;
  detalhe: string;
};
