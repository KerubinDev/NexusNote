# NexusNote

**NexusNote** é um editor de notas Markdown moderno com foco em **links bidirecionais** e **armazenamento local-first**. Funciona perfeitamente em **navegadores web** e como **aplicativo mobile** (iOS e Android).

## 🚀 Características Principais

### ✨ Funcionalidades Avançadas

#### 🔗 Links Bidirecionais (Funcionando Perfeitamente!)
- **Sistema de links wiki estilo Obsidian**: `[[Nome da Nota]]`
- **Clique para navegar**: Clique em qualquer link para abrir a nota
- **Criação automática**: Se a nota não existir, ela é criada automaticamente
- **Suporte a aliases**: `[[Nota|Texto Alternativo]]` para links com texto customizado
- **Busca inteligente**: Case-insensitive e normalização de espaços

#### 🕸️ Graph View - Visualização de Conexões
- **Grafo interativo**: Veja todas as conexões entre suas notas em um grafo animado
- **Força-direcionado**: Física realística que mostra a estrutura do conhecimento
- **Navegação**: Clique em qualquer nó para abrir a nota correspondente
- **Estatísticas**: Veja quantas notas e conexões você tem
- **Atalho**: `Ctrl/Cmd + G`

#### 🔍 Busca Global Avançada
- **Busca instantânea**: Encontre notas por nome ou conteúdo
- **Fuzzy search**: Tolerante a erros de digitação (usando Fuse.js)
- **Relevância**: Resultados ordenados por relevância com porcentagem de match
- **Preview**: Veja o contexto onde a busca foi encontrada
- **Atalho**: `Ctrl/Cmd + K`

#### ⌨️ Atalhos de Teclado
- `Ctrl/Cmd + K`: Abrir busca global
- `Ctrl/Cmd + G`: Toggle Graph View
- `Ctrl/Cmd + S`: Salvar nota atual
- `Ctrl/Cmd + B`: Toggle sidebar (backlinks/outline)
- `Esc`: Fechar modais

#### 📝 Editor Markdown Completo
- **Live preview**: Alterne entre edição e visualização
- **Syntax highlighting**: Suporte completo a Markdown padrão
- **Auto-save**: Salva automaticamente após 2 segundos
- **Múltiplas abas**: Trabalhe com várias notas simultaneamente
- **Feedback visual**: Confirmação ao salvar

#### 🔙 Backlinks & Outline
- **Backlinks automáticos**: Veja todas as notas que referenciam a nota atual
- **Outline dinâmico**: Navegação rápida pelos cabeçalhos (H1, H2, H3)
- **Clique para navegar**: Clique em qualquer backlink para abrir a nota

#### 📁 Gerenciamento de Arquivos
- **CRUD completo**: Criar, renomear, deletar notas e pastas
- **Hierarquia visual**: Árvore de arquivos expansível
- **Operações rápidas**: Duplo clique para renomear, botões de ação no hover

#### 🎨 UI/UX Moderna
- **Design limpo**: Interface minimalista focada na produtividade
- **Transições suaves**: Animações e transições em todas as interações
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Tema escuro**: Interface confortável para longas sessões de trabalho
- **Tooltips**: Dicas contextuais em todos os botões

#### 📱 Multiplataforma
- **Web (PWA)**: Funciona no navegador, pode ser instalado
- **Android**: App nativo via Capacitor
- **iOS**: App nativo via Capacitor
- **Offline-first**: Funciona completamente offline

### 🎯 Plataformas Suportadas

- ✅ **Web** (PWA - Progressive Web App)
- ✅ **Android** (via Capacitor)
- ✅ **iOS** (via Capacitor)
- ✅ **Desktop** (via navegador/PWA)

## 📦 Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 18 + TypeScript |
| **Estilização** | Tailwind CSS |
| **Markdown** | react-markdown + remark-gfm |
| **Mobile** | Capacitor 5 |
| **Armazenamento Web** | IndexedDB (via idb) |
| **Armazenamento Mobile** | Capacitor Filesystem |
| **Build Tool** | Vite |
| **PWA** | vite-plugin-pwa |

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 18+ e npm/yarn
- Para mobile: Android Studio (Android) e Xcode (iOS)

### Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd NexusNote

# Instale as dependências
npm install

# Execute em modo desenvolvimento (web)
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção

```bash
# Build para web
npm run build

# Os arquivos estarão na pasta `dist`
```

### Desenvolvimento Mobile

```bash
# Após fazer build, sincronize com Capacitor
npm run build
npm run cap:sync

# Abra no Android Studio
npm run android

# Ou no Xcode (macOS apenas)
npm run ios
```

## 📱 Instalação como PWA

### No Navegador

1. Acesse a aplicação no navegador
2. Clique no ícone de instalação na barra de endereço (ou menu)
3. A aplicação será instalada como um aplicativo standalone

### No Mobile

**Android:**
- Abra o site no Chrome
- Menu → "Adicionar à tela inicial"

**iOS:**
- Abra o site no Safari
- Compartilhar → "Adicionar à Tela de Início"

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes React
│   ├── ExplorerPanel.tsx    # Painel esquerdo (navegação de arquivos)
│   ├── EditorPanel.tsx     # Painel central (editor de notas)
│   └── SidebarPanel.tsx    # Painel direito (backlinks e outline)
├── contexts/            # Context API
│   └── VaultContext.tsx    # Contexto global do vault
├── utils/               # Utilitários
│   ├── storage.ts          # Sistema de armazenamento adaptativo
│   ├── markdown.ts         # Parser de Markdown e links wiki
│   └── helpers.ts           # Funções auxiliares
├── styles/              # Estilos globais
│   └── index.css
├── types.ts            # Tipos TypeScript
└── App.tsx             # Componente principal
```

## 📖 Como Usar

### Criando uma Nova Nota

1. Clique no botão **"+ Nota"** no painel esquerdo
2. A nota será criada e aberta automaticamente
3. Comece a escrever!

### Criando Links Bidirecionais

Use a sintaxe `[[Nome da Nota]]` no seu Markdown:

```markdown
Esta é uma nota sobre [[Desenvolvimento Web]].

Outro link: [[React|Framework React]]
```

- Clique no link para navegar para a nota
- Se a nota não existir, ela será criada automaticamente
- Use `[[Nota|Alias]]` para criar links com texto alternativo

### Visualizando Backlinks

O painel direito mostra automaticamente todas as notas que referenciam a nota atual através de links bidirecionais.

### Navegação por Outline

O painel direito também mostra todos os cabeçalhos da nota atual, permitindo navegação rápida.

## 🔧 Funcionalidades Técnicas

### Sistema de Armazenamento Adaptativo

O NexusNote usa diferentes sistemas de armazenamento dependendo da plataforma:

- **Web (Navegador)**: IndexedDB para persistência local
- **Mobile (iOS/Android)**: Capacitor Filesystem API

A classe `Storage` abstrai essas diferenças, permitindo que o código funcione identicamente em todas as plataformas.

### Parsing de Links Wiki

O sistema de links bidirecionais usa regex para:
1. Extrair todos os links `[[...]]` do conteúdo
2. Identificar links para uma nota específica
3. Gerar lista de backlinks automaticamente

## 🐛 Troubleshooting

### Problemas com IndexedDB

Se você encontrar problemas com dados antigos, limpe o IndexedDB:
- Chrome DevTools → Application → IndexedDB → Delete

### Problemas no Mobile

Certifique-se de que:
- O build foi feito antes de sincronizar: `npm run build && npm run cap:sync`
- As permissões de arquivo estão configuradas no `capacitor.config.ts`

## 📝 Histórias de Usuário Implementadas

| ID | Funcionalidade | Status |
|----|----------------|--------|
| **HU01** | Criação e Persistência de Notas | ✅ |
| **HU02** | Formatação Markdown Básica | ✅ |
| **HU03** | Links Bidirecionais (Core Feature) | ✅ |
| **HU04** | Visualização de Backlinks | ✅ |
| **HU05** | Explorador de Arquivos Funcional | ✅ |

## 🚧 Melhorias Futuras

- [ ] Sistema de tags (#tag) com autocomplete
- [ ] Drag and drop para organizar pastas
- [ ] Modo de apresentação (presentation mode)
- [ ] Temas personalizáveis (claro/escuro customizáveis)
- [ ] Sincronização na nuvem opcional
- [ ] Sistema de plugins
- [ ] Exportação/Importação (Markdown, PDF, HTML)
- [ ] Templates de notas
- [ ] Mermaid diagrams
- [ ] Code blocks com syntax highlighting avançado

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

**Desenvolvido com ❤️ para a comunidade de gestão de conhecimento pessoal (PKM)**
