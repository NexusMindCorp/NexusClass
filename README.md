<div align="center">

<img src="./public/Logos/Logo.png" alt="NexusClass Logo" height="120" />

# NexusClass

Plataforma educacional interativa construída com React, TypeScript, Tailwind CSS v4 e shadcn/ui. Integra o modelo Gemini AI (Tigreso Chatbot) e Supabase para gerenciamento de dados.

[![Node.js version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-3c873a?style=flat-square&logo=node.js)](https://nodejs.org)
[![React version](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Integrated-green?style=flat-square&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Enabled-purple?style=flat-square&logo=google-gemini)](https://ai.google.dev)

[Visão Geral](#-visão-geral) • [Recursos Principais](#-recursos-principais) • [Tecnologias Utilizadas](#-tecnologias-utilizadas) • [Pré-requisitos](#-pré-requisitos) • [Instalação](#-instalação) • [Configuração](#-configuração) • [Estrutura do Projeto](#-estrutura-do-projeto) • [Scripts Disponíveis](#-scripts-disponíveis)

</div>

---

## 🌐 Visão Geral

O **NexusClass** é uma plataforma educacional moderna projetada para simplificar a interação escolar entre estudantes e professores. O projeto combina conceitos avançados de componentização React com estilização utilitária de última geração em **Tailwind CSS v4** e componentes acessíveis baseados em **shadcn/ui**.

A plataforma oferece um portal de atividades, mural escolar, gerenciamento de turmas, agendamento de eventos e um tutor de estudos integrado alimentado por inteligência artificial (Google Gemini).

---

## ✨ Recursos Principais

- **Portal de Turmas & Alunos**: Painel administrativo para visualização de disciplinas, professores responsáveis e listagem de alunos cadastrados.
- **Mural Escolar**: Centralização de avisos, notícias e notificações relevantes para toda a turma.
- **Chat em Tempo Real**: Canal interativo de mensagens integradas para promover a colaboração e comunicação rápida.
- **Tigreso (Assistente IA)**: Chatbot inteligente baseado na API do Google Gemini, configurado como tutor auxiliar para dúvidas e tarefas escolares.
- **Calendário Letivo**: Sistema de agendamento visual de provas, prazos de entrega e reuniões.
- **Temas Dinâmicos**: Transição fluida entre modo claro e escuro implementada com `next-themes`.
- **Efeitos Sonoros Interativos**: Respostas de áudio integradas com a biblioteca `howler` para enriquecer a experiência do usuário.
- **Autenticação & Banco de Dados**: Estrutura preparada para integração direta com Supabase para dados de sessão e persistência.

---

## 🛠️ Tecnologias Utilizadas

### Core & Compiladores
- **React 19**: Desenvolvimento ágil e eficiente de interfaces declarativas.
- **TypeScript**: Tipagem estática robusta garantindo maior previsibilidade ao projeto.
- **Vite 7**: Ambiente rápido de bundling e servidor local com Hot Module Replacement (HMR).
- **Tailwind CSS v4**: Design system flexível por meio de classes utilitárias e otimização por compilador nativo.

### UI & Componentes
- **shadcn/ui & Radix UI**: Componentes de interface modulares, acessíveis (padrão WCAG) e customizáveis.
- **Lucide React**: Ampla biblioteca de ícones vetoriais modernos.
- **Sonner**: Sistema elegante para toasts e notificações nativas da aplicação.
- **React Day Picker & date-fns**: Manipulação precisa de datas e calendário interativo.

### Integrações & Utilitários
- **Google Generative AI SDK**: Integração nativa com a API do Gemini.
- **Supabase JS Client**: Conexão com banco de dados seguro em tempo real.
- **next-themes**: Gerenciamento simplificado de preferência de tema do usuário.
- **Howler.js**: Controle e reprodução de efeitos sonoros.
- **Class Variance Authority (CVA)**: Criação inteligente de variantes de estilos CSS.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de que você possui as seguintes ferramentas instaladas:

- **Node.js** (versão 18.0.0 ou superior)
- Gerenciador de pacotes **npm** ou **pnpm**

Para verificar as versões locais, execute:
```bash
node --version
npm --version
```

---

## 🚀 Instalação

1. Clone este repositório para a sua máquina local:
   ```bash
   git clone https://github.com/GianluccaPaiva/ProjetoPilotoShadcn.git
   cd ProjetoPilotoShadcn
   ```

2. Instale todas as dependências do projeto:
   ```bash
   npm install
   ```

---

## ⚙️ Configuração

A aplicação necessita de credenciais externas para habilitar o assistente de IA e o banco de dados.

1. Duplique o arquivo de variáveis de ambiente de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` criado e preencha as variáveis correspondentes:
   ```env
   VITE_GEMINI_KEY=sua_chave_de_api_do_google_gemini
   VITE_SUPABASE_URL=sua_url_do_projeto_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_publica_do_supabase
   ```

> [!IMPORTANT]
> Sem a configuração das credenciais do Gemini no `.env`, a funcionalidade do assistente **Tigreso** não conseguirá processar as mensagens recebidas.

---

## 📁 Estrutura do Projeto

Abaixo está descrita a organização das principais pastas e arquivos no diretório `src`:

```
src/
├── components/          # Componentes de interface e seções da aplicação
│   ├── ui/              # Componentes base do shadcn/ui instalados
│   └── provedores/      # Contextos e Providers globais (ex: ThemeProvider)
├── Layout/              # Estruturas reutilizáveis de layout de página e erro
├── dados/               # Base de dados mockados locais em formato JSON
├── hooks/               # Custom hooks de controle de estado e regras de negócio
├── lib/                 # Configurações de clientes (Supabase, helpers de estilização)
├── referenciaGlobal/    # Declarações globais de tipagem TypeScript
├── App.tsx              # Componente raiz, rotas e fluxos centrais
├── main.tsx             # Ponto de entrada oficial da renderização do React
└── index.css            # Folha de estilo global com importações e variáveis do Tailwind v4
```

---

## 📜 Scripts Disponíveis

Os seguintes comandos estão definidos no `package.json`:

| Comando | Função |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento na porta padrão do Vite. |
| `npm run build` | Compila o código TypeScript e constrói o pacote de produção otimizado. |
| `npm run lint` | Executa o ESLint para analisar possíveis erros e conformidade de estilo. |
| `npm run preview` | Executa um servidor local com base na build gerada em produção. |
| `npm run deploy` | Compila a aplicação e envia a build estática para o GitHub Pages. |

> [!TIP]
> Ao executar o servidor de desenvolvimento (`npm run dev`), você poderá acessar a aplicação localmente pelo endereço fornecido no console (geralmente `http://localhost:5173/ProjetoPilotoShadcn/`).
