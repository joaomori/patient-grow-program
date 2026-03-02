

# Adicionar novos status nas indicações

## Situação atual
As indicações possuem 3 status: **Pendente**, **Confirmada** e **Rejeitada**.

## Novos status
Vamos adicionar 4 novos status, criando um fluxo completo:

**Pendente** → **Contatado** → **Agendado** → **Atendido** → **Convertido**

E o status **Rejeitada** continua disponível em qualquer etapa.

## Alterações

### 1. Painel Admin (`AdminReferrals.tsx`)
- Atualizar a função `statusBadge` para exibir os 6 status com cores distintas
- Substituir os botões "Confirmar/Rejeitar" por um dropdown/select que permite avançar o status para qualquer etapa
- Manter o botão "Rejeitar" disponível em todas as etapas (exceto "Convertido" e "Rejeitada")
- Ao marcar como "Convertido", preencher o campo `confirmed_at` (equivalente à conversão final)

### 2. Painel do Afiliado (`AffiliateDashboard.tsx`)
- Atualizar o Badge para mostrar os novos status traduzidos em português
- O afiliado continua apenas visualizando (sem ações)

### 3. Mapeamento de cores dos status

| Status | Label | Cor |
|--------|-------|-----|
| pending | Pendente | secondary (cinza) |
| contacted | Contatado | outline (borda) |
| scheduled | Agendado | azul (custom) |
| attended | Atendido | amarelo (custom) |
| converted | Convertido | verde (default/primary) |
| rejected | Rejeitada | destructive (vermelho) |

### 4. Contagem de conversões
- Atualizar a lógica de `confirmedCount` no `AffiliateDashboard` para contar status `converted` (em vez de `confirmed`) para o progresso de recompensas

## Detalhes Técnicos

- Nenhuma migration necessaria -- o campo `status` e do tipo `text`, entao aceita qualquer valor
- Adicionar variantes de cor ao Badge usando `className` com Tailwind para os status que nao tem variante nativa (azul, amarelo, verde)
- No admin, usar um `Select` (radix) com as opcoes de status para transicionar a indicacao
- Manter compatibilidade com o status antigo `confirmed` mapeando-o para "Confirmada" na exibicao

