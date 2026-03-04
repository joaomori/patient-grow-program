

# Sistema de Metas com Período de 6 Meses e Timer

## Resumo
Implementar um sistema onde as indicações do afiliado são contabilizadas dentro de janelas de 6 meses. O afiliado verá um contador regressivo mostrando quanto tempo falta para o período expirar, e o progresso acumulado de indicações convertidas nesse período.

## Alterações no Banco de Dados

Adicionar à tabela `affiliates` uma coluna `current_period_start` (timestamp) que marca o início do período de 6 meses ativo. Quando o afiliado faz sua primeira indicação e não tem período ativo, o sistema define essa data. Isso permite filtrar apenas indicações dentro do período válido.

```sql
ALTER TABLE public.affiliates 
ADD COLUMN current_period_start timestamp with time zone DEFAULT NULL;
```

## Alterações no Frontend — Painel do Afiliado

### `src/pages/affiliate/AffiliateDashboard.tsx`

1. **Buscar `current_period_start`** do registro do afiliado
2. **Filtrar indicações confirmadas** apenas dentro do período de 6 meses (de `current_period_start` até `current_period_start + 6 meses`)
3. **Calcular e exibir**:
   - Contador regressivo (dias/horas restantes até fim do período)
   - Data de início e fim do período
   - Indicações convertidas no período atual vs meta
   - Barra de progresso baseada apenas nas indicações do período
4. **Iniciar período automaticamente**: quando o afiliado submete uma indicação e `current_period_start` é null ou o período anterior já expirou, atualizar para `now()`

### Componente visual do timer
- Card dedicado com ícone de relógio
- Contagem regressiva atualizada a cada minuto via `setInterval`
- Exibir "X dias e Y horas restantes"
- Data de início e fim formatadas
- Quando o período expira, mostrar mensagem de "Período encerrado" e resetar

## Lógica de Negócio

- Período de 6 meses começa na primeira indicação do afiliado (ou é resetado quando expira)
- Apenas indicações com status `converted`/`confirmed` e `created_at` dentro do período contam para a meta
- Ao submeter uma nova indicação, verificar se o período está ativo; se não, iniciar novo período
- O progresso e recompensas são calculados apenas com base nas indicações do período vigente

