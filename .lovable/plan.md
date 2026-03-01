
# Integração com RD Station CRM

## Objetivo
Enviar automaticamente cada indicação cadastrada para o RD Station CRM como um **contato + negociação (deal)**, identificando quem indicou (afiliado) nos dados do deal.

## O que você precisa fornecer
- **Token de API do RD Station CRM** (encontrado em Configurações > Integrações > Token da API no seu RD Station CRM). A API v1 usa autenticação por token via query parameter.

## Como vai funcionar

### 1. Backend function: `sync-referral-rdstation`
Cria uma função backend que recebe os dados da indicação e:
1. Cria um **contato** no RD Station CRM com nome, telefone e email do indicado
2. Cria uma **negociação (deal)** vinculada a esse contato, com o nome do afiliado que indicou no título (ex: "Indicação de Maria Silva - João da Silva")
3. Retorna o ID do deal criado

Endpoints utilizados:
- `POST https://crm.rdstation.com/api/v1/contacts?token=TOKEN` - criar contato
- `POST https://crm.rdstation.com/api/v1/deals?token=TOKEN` - criar deal vinculado ao contato

### 2. Integração nos fluxos existentes
Dois pontos de envio para o RD Station:

- **Formulário público** (`PublicReferral.tsx`): Após inserir a indicação no banco, chama a function para sincronizar com o CRM
- **Formulário do afiliado** (`AffiliateDashboard.tsx`): Mesmo comportamento após inserir a indicação
- **Confirmação pelo admin** (`AdminReferrals.tsx`): Opcionalmente atualiza o deal no RD Station ao confirmar/rejeitar

### 3. Rastreamento do afiliado no CRM
O deal criado no RD Station incluirá:
- **Titulo**: "Indicação - [Nome do Indicado]"
- **Campo de notas/descrição**: "Indicado por: [Nome do Afiliado] (código: [referral_code])"

Isso permite filtrar e pontuar no RD Station quem indicou.

---

## Detalhes Técnicos

### Edge Function `sync-referral-rdstation`
```text
supabase/functions/sync-referral-rdstation/index.ts
```
- Recebe: `{ referred_name, referred_phone, referred_email, affiliate_name, referral_code }`
- Cria contato via API v1 do RD Station CRM
- Cria deal vinculado ao contato, com dados do afiliado na descrição
- Retorna sucesso/erro

### Configuração necessária
- Adicionar secret `RDSTATION_CRM_TOKEN` com o token da API do RD Station CRM

### Alterações no frontend
- `PublicReferral.tsx`: Após insert bem-sucedido, chama a edge function
- `AffiliateDashboard.tsx`: Após insert bem-sucedido, chama a edge function
- Ambos buscarão o nome do afiliado para enviar junto com os dados

### Banco de dados
- Adicionar coluna `rdstation_deal_id` na tabela `referrals` para rastrear o ID do deal criado (opcional, mas recomendado)
