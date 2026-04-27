
# EduReserve - Sistema de Reservas Escolares

Sistema leve e intuitivo desenvolvido para gestão de recursos e espaços em ambiente escolar.

## Funcionalidades
- **Dashboard Inteligente**: Visualização imediata das reservas do dia atual.
- **Gestão de Recursos**: Cadastro de laboratórios, projetores, tablets e outros materiais.
- **Reservas sem Conflitos**: Validação automática de horários para evitar reservas duplicadas do mesmo recurso.
- **Interface Moderna**: Design limpo, responsivo e focado na usabilidade.

## Acesso Rápido (Dados Iniciais)
- **E-mail**: `admin@escola.com`
- **Senha**: `admin123`

## Tecnologias Utilizadas
- **Backend**: Node.js com Express (TypeScript)
- **Frontend**: React com Tailwind CSS
- **Banco de Dados**: SQLite (Relacional, leve e rápido)
- **Animações**: Motion
- **Ícones**: Lucide React

## Como Instalar e Rodar Localmente
1. Certifique-se de ter o Node.js instalado.
2. Clone o repositório.
3. Execute `npm install` para instalar as dependências.
4. Execute `npm run dev` para iniciar o servidor de desenvolvimento.
5. O sistema estará disponível em `http://localhost:3000`.

## Estrutura do Projeto
- `server.ts`: Servidor Express e lógica de banco de dados.
- `src/App.tsx`: Roteamento e layout principal.
- `src/components/`: Componentes da interface (Dashboard, Reservas, Recursos, Login).
- `database.db`: Arquivo de banco de dados SQLite (gerado automaticamente).
