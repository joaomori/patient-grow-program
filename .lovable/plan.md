
# Landing Pages + CRM com WhatsApp + Valores + Dashboard

## 1. Landing Page para Afiliados (`/seja-afiliado`)
Pagina publica atrativa para captar novos afiliados, com:
- Hero section com titulo "Indique e Ganhe" e descricao do programa
- Secao de beneficios (recompensas, facilidade, acompanhamento)
- Secao "Como funciona" em 3 passos (Cadastre-se, Indique, Ganhe)
- CTA direcionando para `/signup`
- Design responsivo e moderno

Arquivo: `src/pages/LandingAfiliados.tsx`
Rota: `/seja-afiliado`

## 2. Landing Page para Indicacao (`/indicar`)
Melhorar a pagina publica de indicacao existente (`PublicReferral.tsx`):
- Adicionar hero com branding do Dr. Erick
- Secao de confianca (por que agendar, depoimentos placeholder)
- Manter formulario existente com melhor visual
- Design consistente com a LP de afiliados

Arquivo: atualizar `src/pages/PublicReferral.tsx`

## 3. Campo de Valor de Fechamento (Banco de Dados)
Adicionar coluna `deal_value` (numeric, nullable) na tabela `referrals` para registrar o valor monetario de cada conversao.

```sql
ALTER TABLE public.referrals ADD COLUMN deal_value numeric DEFAULT NULL;
```

## 4. Botao WhatsApp no CRM Admin (`AdminReferrals.tsx`)
- Adicionar icone de WhatsApp em cada linha da tabela de indicacoes
- Ao clicar, abre `https://wa.me/55{telefone}` em nova aba
- Disponivel para todos os status

## 5. Editar Valor de Fechamento no Admin
- Adicionar campo "Valor (R$)" no dialog de edicao de indicacoes
- Campo numerico, opcional, visivel apenas para admin
- Salvar no campo `deal_value` da tabela `referrals`

## 6. Dashboard com Relatorios e Metricas
Melhorar o `AdminDashboard.tsx` com:
- **Card de receita total**: soma dos `deal_value` de indicacoes convertidas
- **Card de ticket medio**: receita total / numero de conversoes
- **Grafico de indicacoes por mes**: grafico de barras com Recharts mostrando volume mensal
- **Grafico de conversao por status**: grafico de pizza com distribuicao de status
- **Tabela de top afiliados**: ranking dos afiliados com mais conversoes e maior receita gerada

---

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE public.referrals ADD COLUMN deal_value numeric DEFAULT NULL;
```

### Novos arquivos
- `src/pages/LandingAfiliados.tsx` — LP para captar afiliados

### Arquivos modificados
- `src/App.tsx` — nova rota `/seja-afiliado`
- `src/pages/PublicReferral.tsx` — redesign da LP de indicacao
- `src/pages/admin/AdminReferrals.tsx` — botao WhatsApp + campo deal_value no edit
- `src/pages/admin/AdminDashboard.tsx` — dashboard com graficos e metricas financeiras

### Graficos (Recharts)
- BarChart para indicacoes por mes (ultimos 6 meses)
- PieChart para distribuicao de status
- Cards com receita total, ticket medio, taxa de conversao

### WhatsApp
- Funcao helper para formatar telefone: remove caracteres nao numericos, adiciona 55 se necessario
- Link: `https://wa.me/{telefoneFormatado}`
