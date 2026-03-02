
# Kanban de Indicacoes com Drag and Drop

## Objetivo
Adicionar uma visualizacao Kanban na pagina de Indicacoes do admin, onde cada coluna representa um status (Pendente, Contatado, Agendado, Atendido, Convertido, Rejeitado) e os cards de leads podem ser arrastados entre colunas para atualizar o status automaticamente.

## Abordagem
Implementar drag-and-drop nativo usando a HTML5 Drag and Drop API (sem dependencias externas), mantendo a visualizacao de tabela existente com um toggle para alternar entre os modos.

## Mudancas

### 1. Toggle Tabela/Kanban
- Adicionar botoes de alternancia (icones List e Columns) na toolbar existente do `AdminReferrals.tsx`
- Estado `viewMode` controla qual visualizacao exibir ("table" | "kanban")

### 2. Componente KanbanBoard
- **Novo arquivo**: `src/components/admin/KanbanBoard.tsx`
- Uma coluna por status: Pendente, Contatado, Agendado, Atendido, Convertido, Rejeitado
- Cada coluna mostra o contador de cards e a cor correspondente ao status (reutilizando STATUS_CONFIG)
- Cards exibem: nome, telefone, afiliado, valor (se houver), data
- Botoes de acao nos cards: WhatsApp e Editar

### 3. Drag and Drop
- Usar `draggable`, `onDragStart`, `onDragOver`, `onDrop` nativos do HTML5
- Ao soltar um card em outra coluna, chama `updateStatus(id, novoStatus)` ja existente
- Feedback visual: coluna destaca ao receber drag (borda/fundo muda)
- Cards de status "converted" e "rejected" nao sao arrastáveis (finais)

### 4. Integracao
- O KanbanBoard recebe as mesmas props: `referrals` filtrados, `updateStatus`, `openEdit`, `formatWhatsAppUrl`
- Busca e filtros continuam funcionando em ambos os modos
- O botao "Nova Indicacao" permanece disponivel em ambos os modos

## Detalhes Tecnicos

### Estrutura do KanbanBoard
```text
+------------+------------+------------+------------+------------+------------+
| Pendente   | Contatado  | Agendado   | Atendido   | Convertido | Rejeitado  |
| (3)        | (2)        | (1)        | (0)        | (5)        | (1)        |
+------------+------------+------------+------------+------------+------------+
| [Card]     | [Card]     | [Card]     |            | [Card]     | [Card]     |
| [Card]     | [Card]     |            |            | [Card]     |            |
| [Card]     |            |            |            | [Card]     |            |
+------------+------------+------------+------------+------------+------------+
```

### Arquivos
- **Novo**: `src/components/admin/KanbanBoard.tsx` - Componente do kanban com colunas e cards
- **Editado**: `src/pages/admin/AdminReferrals.tsx` - Toggle de visualizacao e integracao do kanban

### Sem dependencias externas
- HTML5 Drag and Drop API e suficiente para este caso de uso
- Sem necessidade de instalar bibliotecas como react-beautiful-dnd ou dnd-kit
