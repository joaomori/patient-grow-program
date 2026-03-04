

# Renomear "Dr. Erick" para "Dr. Erik / Dra. Amablia"

## Alteracoes

Substituir todas as ocorrencias de "Dr. Erick" pelo nome correto em 4 arquivos:

1. **`src/pages/PublicReferral.tsx`** (linhas 117, 165): Titulo hero e footer
2. **`src/pages/Login.tsx`** (linha 42): Descricao do card de login
3. **`src/pages/LandingAfiliados.tsx`** (linhas 29, 84): Texto do programa e footer
4. **`src/components/admin/AdminSidebar.tsx`** (linha 42): Label do sidebar admin

Todas as referencias "Dr. Erick" serao trocadas por "Dr. Erik / Dra. Amablia".

## Correcao do bug do Kanban

Alem da renomeacao, vou corrigir o bug onde o status nao atualiza no Kanban. O problema esta em `src/pages/admin/AdminKanban.tsx`: as chamadas `supabase.update()` nao verificam erros, entao o toast de sucesso aparece mesmo quando a operacao falha. Adicionarei tratamento de erro nas funcoes `updateStatus` e `saveEdit`.

