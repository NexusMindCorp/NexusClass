# 📚 Projeto Piloto Shadcn - Educacional

> Um projeto educativo para aprender sobre **shadcn/ui**, seus componentes, estilização com **Tailwind CSS** e boas práticas de desenvolvimento com **React** e **TypeScript**.

---
## 🌐 Página de Visualização
 [🔗 Acesse a aplicação hospedada](https://gianluccapaiva.github.io/ProjetoPilotoShadcn/)

---
## 📖 Sumário

1. [Sobre o Projeto](#sobre-o-projeto)
2. [Objetivo Educacional](#objetivo-educacional)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Pré-requisitos](#pré-requisitos)
5. [Instalação Passo a Passo](#instalação-passo-a-passo)
6. [Estrutura do Projeto](#estrutura-do-projeto)
7. [Como Usar shadcn/ui](#como-usar-shadcnui)
8. [Como Usar Tailwind CSS](#como-usar-tailwind-css)
9. [Processo de Criação de Componentes](#processo-de-criação-de-componentes)
10. [Scripts Disponíveis](#scripts-disponíveis)
11. [Exemplos de Uso](#exemplos-de-uso)
12. [Recursos Adicionais](#recursos-adicionais)
13. [Conteúdos complementares](#conteudos-complementares)

---

## 🎯 Sobre o Projeto

**Projeto Piloto Shadcn** é uma aplicação **estritamente educativa e não comercial** desenvolvida para aprender e explorar:

- ✅ A biblioteca **shadcn/ui** e seus componentes reutilizáveis
- ✅ Estilização moderna com **Tailwind CSS** (utilitário-first)
- ✅ Boas práticas de componentização em React
- ✅ Temas escuro/claro com **next-themes**
- ✅ Integração com ícones via **Lucide React**
- ✅ Notificações com **Sonner**
- ✅ Calendário com **React Day Picker**

---

## 🎓 Objetivo Educacional

Este projeto visa ensinar:

1. **Como instalar e configurar shadcn/ui** em um projeto Vite + React
2. **Como personalizar e estilizar componentes** shadcn com Tailwind CSS
3. **Como estruturar componentes** de forma reutilizável e modular
4. **Como gerenciar temas** (dark/light) em uma aplicação React
5. **Como integrar bibliotecas** complementares (Radix UI, class-variance-authority, etc.)
6. **Padrões de CSS variables** para customização dinâmica
7. **Boas práticas de desenvolvimento** em TypeScript + React

---

## 🛠️ Tecnologias Utilizadas

### Core
| Tecnologia | Versão | Propósito |
|-----------|---------|-----------|
| **React** | ^19.2.0 | Biblioteca UI |
| **TypeScript** | ~5.9.3 | Tipagem estática |
| **Vite** | ^7.3.1 | Build tool & dev server |
| **Tailwind CSS** | ^4.2.1 | Framework CSS utilitário |

### UI & Componentes
| Biblioteca | Versão | Propósito |
|-----------|---------|-----------|
| **shadcn/ui** | - | Componentes reutilizáveis |
| **Radix UI** | ^1.4.3 | Primitivos acessíveis (base do shadcn) |
| **Lucide React** | ^0.575.0 | Ícones |
| **Sonner** | ^2.0.7 | Notificações (toast messages) |

### Utilitários
| Biblioteca | Versão | Propósito |
|-----------|---------|-----------|
| **next-themes** | ^0.4.6 | Gerenciamento de temas |
| **class-variance-authority** | ^0.7.1 | Variações de estilos |
| **clsx** | ^2.1.1 | Composição de classes |
| **tailwind-merge** | ^3.5.0 | Merge inteligente de classes Tailwind |
| **date-fns** | ^4.1.0 | Manipulação de datas |
| **react-day-picker** | ^9.14.0 | Componente calendário |

### Desenvolvimento
- **ESLint** - Linting de código
- **@vitejs/plugin-react** - Suporte JSX no Vite
- **@tailwindcss/vite** - Plugin Tailwind para Vite

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** versão 18.0 ou superior ([Download](https://nodejs.org/))
- **npm** ou **pnpm** (com npm vem o Node.js)
- **Git** (opcional, para clonar o repositório)
- Um editor de código como **VS Code**

Verificar versão:
```bash
node --version  # v18.0.0 ou superior
npm --version   # 9.0.0 ou superior
```

---

## 🚀 Instalação Passo a Passo

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/GianluccaPaiva/ProjetoPilotoShadcn.git
cd ProjetoPilotoShadcn
```

Ou manualmente: Baixar o arquivo ZIP do repositório.

### 2️⃣ Instalar Dependências

```bash
npm install
```

Este comando instala todas as dependências listadas no `package.json`.

### 3️⃣ Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:5173/ProjetoPilotoShadcn/` (ou a porta configurada pelo Vite).

### 4️⃣ Verificar a Instalação

Se você pode visualizar a aplicação rodando sem erros no console, a instalação foi bem-sucedida! ✅

---

## 📁 Estrutura do Projeto

```
ProjetoPilotoShadcn/
├── public/                          # Arquivos estáticos
│   ├── Logos/                       # Logos da aplicação
│   └── sons/                        # Arquivos de áudio
│
├── src/                             # Código-fonte principal
│   ├── components/                  # Componentes React
│   │   ├── ui/                      # Componentes shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ... (mais componentes)
│   │   │
│   │   ├── provedores/              # Provedores de contexto
│   │   │   └── ThemeProvider.tsx    # Gerenciamento de temas
│   │   │
│   │   ├── App.tsx                  # Componente raiz
│   │   ├── Navbar.tsx               # Barra de navegação
│   │   ├── AppSidebar.tsx           # Barra lateral
│   │   ├── Mural.tsx                # Painel principal
│   │   ├── Mensagens.tsx            # Seção de mensagens
│   │   ├── Calendario.tsx           # Calendário
│   │   └── ... (mais componentes)
│   │
│   ├── hooks/                       # Hooks customizados
│   │   ├── useGerenciador.ts        # Gerenciar estados
│   │   ├── useMural.ts
│   │   ├── usePesquisa.ts
│   │   └── ... (mais hooks)
│   │
│   ├── lib/                         # Funções utilitárias
│   │   ├── utils.ts                 # Funções helpers
│   │   └── assetPath.ts
│   │
│   ├── dados/                       # Dados estáticos
│   │   └── turmas.json
│   │
│   ├── App.css                      # Estilos globais
│   ├── index.css                    # Configuração Tailwind + shadcn
│   ├── main.tsx                     # Entrada React
│   └── index.html                   # HTML principal
│
├── components.json                  # Configuração shadcn/ui
├── vite.config.ts                   # Configuração Vite
├── tailwind.config.ts               # Configuração Tailwind CSS
├── tsconfig.json                    # Configuração TypeScript
├── eslint.config.js                 # Configuração ESLint
├── package.json                     # Dependências do projeto
└── README.md                        # Este arquivo
```

### 📝 Explicação das Pastas Principais

- **`src/components/ui/`** - Componentes shadcn/ui (Button, Card, Avatar, etc.)
- **`src/components`** - Componentes customizados específicos da aplicação
- **`src/hooks/`** - Hooks React customizados para lógica reutilizável
- **`src/lib/`** - Funções utilitárias e helpers
- **`src/index.css`** - Arquivo central de estilos com variáveis CSS

---

## 🎨 Como Usar shadcn/ui

### O Que é shadcn/ui?

**shadcn/ui** é uma coleção de componentes React reutilizáveis baseados em **Radix UI** já estilizados com **Tailwind CSS**. Diferente de outras bibliotecas:

- ✅ São copiados para seu projeto (você é o dono do código)
- ✅ 100% customizáveis com Tailwind CSS
- ✅ Praticamente nenhuma dependência
- ✅ Totalmente acessíveis (WCAG)

### Instalando Novos Componentes

Para adicionar um novo componente shadcn/ui ao projeto:

```bash
npx shadcn-ui@latest add [nome-do-componente]
```

**Exemplos:**

```bash
npx shadcn-ui@latest add button      # Adiciona componente Button
npx shadcn-ui@latest add dialog      # Adiciona componente Dialog
npx shadcn-ui@latest add combobox    # Adiciona componente Combobox
```

Os componentes serão adicionados em `src/components/ui/`.

### Usando um Componente Shadcn

Exemplo: Importar e usar o componente **Button**

```tsx
import { Button } from "@/components/ui/button"

export function MeuComponente() {
  return (
    <div>
      <Button>Clique em mim</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Deletar</Button>
      <Button disabled>Desabilitado</Button>
    </div>
  )
}
```

### Entendendo as Props dos Componentes

Os componentes shadcn geralmente aceitam estas props:

```tsx
<Button
  variant="outline"        // Variação visual
  size="lg"               // Tamanho (sm, default, lg)
  disabled={false}        // Estado desabilitado
  className="mt-4"        // Classes Tailwind adicionais
  onClick={() => {}}      // Event handlers
  asChild               // Renderiza como filho (avançado)
>
  Texto do botão
</Button>
```

### Encontrando Componentes Disponíveis

Visite a [Documentação oficial do shadcn/ui](https://ui.shadcn.com/docs/components) para ver todos os componentes disponíveis.

---

## 🎨 Como Usar Tailwind CSS

### O Que é Tailwind CSS?

**Tailwind CSS** é um framework CSS utilitário que permite construir interfaces apenas com classes pré-definidas, sem escrever CSS custom.

### Exemplo: Tailwind vs CSS Tradicional

**CSS Tradicional:**
```css
.botao {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.botao:hover {
  background-color: #2563eb;
}
```

**Tailwind CSS:**
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600">
  Clique aqui
</button>
```

### Classes Tailwind Úteis

| Utilidade | Descrição | Exemplo |
|-----------|-----------|---------|
| **Espaçamento** | Padding e Margin | `p-4`, `m-2`, `px-6`, `my-4` |
| **Cores** | Cor de fundo e texto | `bg-blue-500`, `text-red-600` |
| **Tipografia** | Tamanho, peso, alinhamento | `text-lg`, `font-bold`, `text-center` |
| **Layout** | Flexbox, Grid, Position | `flex`, `grid`, `absolute`, `relative` |
| **Tamanho** | Width, Height | `w-full`, `h-screen`, `w-1/2` |
| **Bordas** | Border, Radius | `border`, `rounded-lg`, `border-2` |
| **Sombras** | Drop shadows | `shadow-md`, `shadow-lg` |
| **Efeitos** | Hover, Focus, etc | `hover:bg-blue-600`, `focus:outline-none` |
| **Responsividade** | Media queries | `md:text-lg`, `lg:flex`, `sm:hidden` |

### Exemplo Prático: Card Tailwind

```tsx
<div className="bg-white rounded-lg shadow-md p-6 max-w-sm mx-auto">
  <h2 className="text-xl font-bold mb-2">Título</h2>
  <p className="text-gray-600 mb-4">Esta é uma descrição curta.</p>
  <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">
    Ação
  </button>
</div>
```

### Modo Dark com Tailwind

No Index.css já está configurado o suporte a dark mode:

```tsx
// No seu componente
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Conteúdo que muda com o tema
</div>
```

### Responsividade

```tsx
<div className="
  text-sm              // Mobile
  md:text-base         // Tablet (768px)
  lg:text-lg           // Desktop (1024px)
  flex
  flex-col             // Mobile
  md:flex-row          // Tablet+
  gap-4
">
  Conteúdo responsivo
</div>
```

### Ferramenta Útil: IntelliSense

Para melhor autocompletar no VS Code:
1. Instale a extensão **Tailwind CSS IntelliSense** (oficial)
2. Comece a digitar uma classe Tailwind
3. Veja sugestões em tempo real

---

## 🔧 Processo de Criação de Componentes

### Passo 1: Estrutura Básica de um Componente

```tsx
// src/components/MeuComponente.tsx
import React from 'react'
import { Button } from '@/components/ui/button'

interface MeuComponenteProps {
  titulo: string
  descricao?: string
  onClick?: () => void
}

export const MeuComponente: React.FC<MeuComponenteProps> = ({
  titulo,
  descricao,
  onClick,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">{titulo}</h2>
      {descricao && <p className="text-gray-600 mb-4">{descricao}</p>}
      <Button onClick={onClick} variant="outline">
        Ação
      </Button>
    </div>
  )
}

export default MeuComponente
```

### Passo 2: Adicionar Tipos TypeScript

```tsx
// types/index.ts
export interface Turma {
  id: string
  nome: string
  alunos: number
  professor: string
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info'
}
```

### Passo 3: Criar um Hook Customizado (Opcional)

```tsx
// src/hooks/useMeuComponente.ts
import { useState } from 'react'

export const useMeuComponente = () => {
  const [estado, setEstado] = useState(false)
  
  const toggle = () => setEstado(!estado)
  
  return { estado, toggle }
}
```

### Passo 4: Usar Componentes shadcn

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export const MeuComponenteCompleto = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Card</CardTitle>
        <CardDescription>Descrição do card</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Abrir Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <p>Conteúdo do dialog</p>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
```

### Passo 5: Estilizar com Tailwind + CVA (Class Variance Authority)

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const componenteVariants = cva(
  'p-4 rounded-lg transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white',
        outline: 'border border-gray-300',
        ghost: 'bg-transparent text-gray-900',
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface MeuComponenteProps extends VariantProps<typeof componenteVariants> {
  children: React.ReactNode
}

export const MeuComponente = ({
  variant,
  size,
  children,
}: MeuComponenteProps) => (
  <div className={cn(componenteVariants({ variant, size }))}>
    {children}
  </div>
)
```

### Passo 6: Exportar do Index

```tsx
// src/components/index.ts
export { MeuComponente } from './MeuComponente'
export type { MeuComponenteProps } from './MeuComponente'
```

### Dica: Usar o Utilitário `cn()`

A função `cn()` em `src/lib/utils.ts` mescla classes Tailwind de forma inteligente:

```tsx
import { cn } from '@/lib/utils'

// Sem conflitos de classes
<div className={cn(
  'px-4 py-2 rounded',
  'bg-blue-500',        // Pode ser sobrescrito
  isActive && 'bg-blue-700', // Sobrescreve se ativo
)}>
  Conteúdo
</div>
```

---

## 📜 Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build produção
npm run preview

# Lint do código
npm run lint

# Deploy no GitHub Pages
npm run deploy
```

### Detalhes dos Scripts

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `vite` | Inicia servidor Vite com hot reload |
| `build` | `tsc -b && vite build` | Compila TypeScript e faz build Vite |
| `preview` | `vite preview` | Visualiza o build de produção localmente |
| `lint` | `eslint .` | Verifica problemas e padrões de código |
| `deploy` | `npm run build && gh-pages -d dist` | Faz deploy no GitHub Pages |

---

## 💡 Exemplos de Uso

### Exemplo 1: Usando o Theme Provider

O projeto já tem suporte a temas dark/light implementados com `next-themes`:

```tsx
import { useTheme } from '@/components/provedores/ThemeProvider'

export function SwitchTema() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={() => setTheme('light')}>☀️ Claro</button>
      <button onClick={() => setTheme('dark')}>🌙 Escuro</button>
    </div>
  )
}
```

### Exemplo 2: Criando uma Lista com Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ItemProps {
  titulo: string
  status: 'ativo' | 'inativo'
}

export function ListaItens({ itens }: { itens: ItemProps[] }) {
  return (
    <div className="space-y-4">
      {itens.map((item, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{item.titulo}</CardTitle>
              <Badge variant={item.status === 'ativo' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
```

### Exemplo 3: Usando Lucide Icons

```tsx
import { Bell, Moon, Sun, Search, Home } from 'lucide-react'

export function NavBar() {
  return (
    <nav className="flex items-center gap-4 p-4">
      <Home className="w-5 h-5" />
      <Search className="w-5 h-5" />
      <Bell className="w-5 h-5" />
      <Sun className="w-5 h-5" />
      <Moon className="w-5 h-5" />
    </nav>
  )
}
```

### Exemplo 4: Usando Sonner para Notificações

```tsx
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function NotificacaoExemplo() {
  return (
    <div className="space-y-2">
      <Button onClick={() => toast.success('Operação realizada!')}>
        Sucesso
      </Button>
      <Button onClick={() => toast.error('Algo deu errado!')}>
        Erro
      </Button>
      <Button onClick={() => toast.loading('Carregando...')}>
        Loading
      </Button>
    </div>
  )
}
```

### Exemplo 5: Form com Validation

```tsx
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function FormularioExemplo() {
  const [email, setEmail] = React.useState('')
  const [erro, setErro] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setErro('Email inválido')
      return
    }
    setErro('')
    console.log('Enviando:', email)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>
      {erro && <p className="text-red-600">{erro}</p>}
      <Button type="submit" className="w-full">
        Enviar
      </Button>
    </form>
  )
}
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **[shadcn/ui](https://ui.shadcn.com/)** - Documentação completa dos componentes
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Documentação Tailwind
- **[Radix UI](https://www.radix-ui.com/)** - Primitivos acessíveis
- **[Lucide Icons](https://lucide.dev/)** - Biblioteca de ícones
- **[React Day Picker](https://react-day-picker.js.org/)** - Calendário
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme provider

### Tutoriais Recomendados

1. **Começando com shadcn/ui**
   - [Setup no Vite](https://ui.shadcn.com/docs/installation/vite)
   - [Customização de Componentes](https://ui.shadcn.com/docs/customize/components)

2. **Tailwind CSS**
   - [Começar do Zero](https://tailwindcss.com/docs/installation)
   - [Utility-First Workflow](https://tailwindcss.com/docs/utility-first)
   - [Responsive Design](https://tailwindcss.com/docs/responsive-design)

3. **React + TypeScript**
   - [React Docs](https://react.dev/)
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Extensões VS Code Recomendadas

- **Tailwind CSS IntelliSense** - Autocompletar Tailwind
- **Prettier** - Formatação de código
- **ESLint** - Linting em tempo real
- **Thunder Client** ou **REST Client** - Testar APIs

---

## 🛠️ Troubleshooting

### Problema: Vite não encontra módulos

**Solução:** Verifique se o caminho no `vite.config.ts` está correto:
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Problema: Estilos Tailwind não aparecem

**Solução:** Certifique-se que o `index.css` está importado em `src/main.tsx`:
```tsx
import './index.css'
```

### Problema: Componentes shadcn não instalam

**Solução:** Execute com a versão correta:
```bash
npx shadcn-ui@latest add [componente]
```

### Problema: Tema escuro não funciona

**Solução:** Verifique se `ThemeProvider` envolve a aplicação em `App.tsx`.

---

## 📄 Licença

Este é um projeto **estritamente educativo e não comercial**. Sinta-se livre para usar, modificar e compartilhar para fins de aprendizado.

---

## Conteudos Complementares

- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Video explicativo](https://youtu.be/SjsQdfvxjL8?si=4AFkvBoYP9aNvJ0_)

---

**Última atualização:** 2 de Março de 2026
**Objetivo:** Educacional e não comercial
**Status:** ✅ Em desenvolvimento e aprendizado contínuo
