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

export type TipoApresentacao = "modelagem" | "engenharia";

export type StatusFaseItem =
  | "Concluído"
  | "Em Andamento"
  | "Planejado"
  | "Descartado";

export type PadraoCatalogoItem = {
  id: string;
  nome: string;
  categoria:
    | "Criacional"
    | "Estrutural"
    | "Comportamental"
    | "Anti-Decisão (Overengineering)";
  fase: string;
  status: StatusFaseItem;
  responsavel: string;
  ondeAplicado: string;
  problemaAntes: string;
  solucaoDepois: string;
  codigoAntes: string;
  codigoDepois: string;
  beneficioQualidade: string;
};

export type FaseRoadmapItem = {
  fase: string;
  titulo: string;
  status: StatusFaseItem;
  responsavel: string;
  entregas: string;
  evidenciaTeste: string;
};

export type CamadaTesteItem = {
  nivelRbt: string;
  camada: string;
  ferramenta: string;
  alvos: string;
  tecnicas: string;
  status: StatusFaseItem;
};

export type SnapshotCoberturaItem = {
  etapa: string;
  responsavel: string;
  testes: string;
  statements: string;
  branches: string;
  functions: string;
  lines: string;
  destaque?: boolean;
};
