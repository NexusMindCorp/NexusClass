import {
  Bell,
  BookOpenCheck,
  Bot,
  CalendarDays,
  ClipboardList,
  Cloud,
  Code2,
  Component,
  Database,
  Layers,
  Lock,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  MousePointerClick,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import type {
  BadgeItem,
  CardItem,
  DevItem,
  FluxoProdutoItem,
  ImplantacaoEtapa,
  MetricaProjeto,
} from "./type";

export const devs: DevItem[] = [
  {
    nome: "Gianlucca Paiva",
    iniciais: "GP",
    cargo: "Full-stack, requisitos e segurança",
    github: "https://github.com/gianluccapaiva",
    corGradiente: "bg-gradient-to-br from-purple-600 to-pink-500",
  },
  {
    nome: "Gabriel Lineker",
    iniciais: "GL",
    cargo: "Full-stack, UI/UX e arquitetura",
    github: "https://github.com/gabriellineker",
    corGradiente: "bg-gradient-to-br from-indigo-600 to-purple-500",
  },
];

export const tecnologias: BadgeItem[] = [
  {
    nome: "Vite React",
    icone: Zap,
    cor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    nome: "TypeScript",
    icone: Code2,
    cor: "text-blue-700 dark:text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    nome: "Tailwind CSS",
    icone: Layers,
    cor: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  {
    nome: "Supabase",
    icone: Database,
    cor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    nome: "Supabase Auth",
    icone: Lock,
    cor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    nome: "Vercel",
    icone: Cloud,
    cor: "text-neutral-700 dark:text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
  },
  {
    nome: "Resend",
    icone: Mail,
    cor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    nome: "Gemini AI",
    icone: Sparkles,
    cor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    nome: "Realtime",
    icone: Bell,
    cor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    nome: "shadcn/ui",
    icone: Component,
    cor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

export const atores: CardItem[] = [
  {
    titulo: "Aluno",
    descricao:
      "Inscreve-se em turmas, acompanha murais, envia atividades, tira dúvidas e usa mensagens, calendário e o Tigreso.",
    icone: User,
  },
  {
    titulo: "Professor",
    descricao:
      "Gerencia turmas, publica avisos, cria atividades, acompanha entregas, atribui notas e responde dúvidas.",
    icone: BookOpenCheck,
  },
  {
    titulo: "Gestão / Master",
    descricao:
      "Tem visão administrativa ampliada para apoiar a organização das turmas e a demonstração do sistema.",
    icone: ShieldCheck,
  },
];

export const metricasProjeto: MetricaProjeto[] = [
  {
    valor: "+300",
    rotulo: "commits no GitHub",
  },
  {
    valor: "+130h",
    rotulo: "estimadas pelo Git",
  },
  {
    valor: "+30",
    rotulo: "dias com atividade",
  },
  {
    valor: "2",
    rotulo: "desenvolvedores",
  },
];

export const fluxoProduto: FluxoProdutoItem[] = [
  {
    etapa: "Login",
    detalhe: "O Supabase Auth valida a sessão e carrega o perfil.",
  },
  {
    etapa: "Turmas",
    detalhe: "O usuário encontra disciplinas e controla inscrições.",
  },
  {
    etapa: "Interação",
    detalhe:
      "Mural, atividades, dúvidas, chat e calendário concentram o uso diário.",
  },
  {
    etapa: "Persistência",
    detalhe: "PostgreSQL, Storage e Realtime mantêm os dados sincronizados.",
  },
];

export const implantacaoEtapas: ImplantacaoEtapa[] = [
  {
    titulo: "Protótipo",
    plataforma: "GitHub Pages",
    detalhe:
      "Publicação inicial da SPA enquanto o projeto ainda era majoritariamente front-end.",
  },
  {
    titulo: "Versão final",
    plataforma: "Vercel",
    detalhe:
      "Build automatizado do Vite, variáveis de ambiente e deploy integrado ao GitHub.",
  },
  {
    titulo: "Backend",
    plataforma: "Supabase",
    detalhe:
      "Auth, PostgreSQL, Storage, Realtime, triggers e Edge Function fora da camada de hospedagem.",
  },
];

export const funcionalidadesImplementadas: CardItem[] = [
  {
    titulo: "Autenticação e sessões",
    descricao:
      "Login, cadastro, logout, rotas protegidas e carregamento do perfil autenticado via Supabase Auth.",
    icone: Lock,
  },
  {
    titulo: "Turmas e inscrições",
    descricao:
      "Listagem dinâmica de turmas, pesquisa, entrada em turmas e controle de inscrição por usuário.",
    icone: Users,
  },
  {
    titulo: "Mural e atividades",
    descricao:
      "Avisos por turma, criação de atividades, anexos, entregas de alunos e avaliação com nota e feedback.",
    icone: ClipboardList,
  },
  {
    titulo: "Comunicação",
    descricao:
      "Mensagens privadas em tempo real, dúvidas entre aluno e professor, suporte, denúncias, e-mails administrativos e indicadores visuais.",
    icone: MessageCircle,
  },
  {
    titulo: "Calendário e alertas",
    descricao:
      "Eventos pessoais e de turma, lembretes de compromissos e notificações para o usuário durante o uso.",
    icone: CalendarDays,
  },
  {
    titulo: "Assistente Tigreso",
    descricao:
      "Chatbot integrado ao Gemini, com consulta ao contexto da plataforma: eventos, atividades, posts e dúvidas.",
    icone: Bot,
  },
];

export const qualidadeUx: CardItem[] = [
  {
    titulo: "Responsividade",
    descricao:
      "Interface adaptada para desktop e mobile, com sidebar responsiva e componentes reutilizáveis.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Segurança",
    descricao:
      "Acesso protegido por autenticação, RLS no banco e operações sensíveis concentradas no Supabase.",
    icone: ShieldCheck,
  },
  {
    titulo: "Persistência",
    descricao:
      "Dados dinâmicos gravados em PostgreSQL na nuvem, substituindo a dependência de arquivos locais.",
    icone: Database,
  },
  {
    titulo: "Manutenibilidade",
    descricao:
      "TypeScript, separação por componentes e hooks customizados para organizar o estado e as regras de interface.",
    icone: Code2,
  },
  {
    titulo: "Desempenho",
    descricao:
      "SPA com Vite e React, transições internas rápidas e uso de localStorage para estados visuais não críticos.",
    icone: Zap,
  },
  {
    titulo: "Usabilidade",
    descricao:
      "Temas claro/escuro, feedback por toasts, badges de notificação e layout com navegação lateral.",
    icone: MousePointerClick,
  },
];

export const conexaoSistema: CardItem[] = [
  {
    titulo: "Frontend SPA",
    descricao:
      "A interface roda no navegador, com React Router, componentes reutilizáveis e troca interna de telas.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Supabase SDK",
    descricao:
      "O cliente centraliza chamadas de login, consultas, inserts, updates, Storage e Realtime.",
    icone: PlugZap,
  },
  {
    titulo: "Banco PostgreSQL",
    descricao:
      "As entidades principais ficam em tabelas como perfis, turmas, mural, atividades, entregas e mensagens.",
    icone: Database,
  },
  {
    titulo: "Segurança e tempo real",
    descricao:
      "RLS, Auth, triggers, cron, canais WebSocket e Edge Function protegem e automatizam fluxos sensíveis.",
    icone: RadioTower,
  },
];

export const limitacoes = [
  "Não realiza aulas ao vivo ou streaming interno.",
  "Não processa pagamentos, mensalidades ou boletos.",
  "Não substitui sistemas acadêmicos oficiais da instituição.",
  "Não emite diplomas, históricos escolares ou diários oficiais.",
];
