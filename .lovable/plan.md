
# Filtros por Status + Ajuste SEO

## 1. Filtros por status no Admin (`AdminReferrals.tsx`)
Adicionar uma barra de filtros acima da tabela com botoes/badges clicaveis para cada status, permitindo filtrar as indicacoes exibidas.

- Adicionar estado `filterStatus` (valor padrao: `"all"`)
- Renderizar uma linha de botoes/badges horizontais: **Todos**, **Pendente**, **Contatado**, **Agendado**, **Atendido**, **Convertido**, **Rejeitada**
- Filtrar a lista `referrals` no frontend com base no status selecionado (sem nova query ao banco)
- Mostrar contagem de cada status nos botoes (ex: "Pendente (3)")
- Botao ativo recebe estilo destacado

## 2. Ajuste SEO (`index.html` e `PublicReferral.tsx`)

### index.html
- Alterar `lang="en"` para `lang="pt-BR"`
- Titulo: "Dr. Erick - Programa de Indicacoes"
- Description: "Indique amigos e familiares para o Dr. Erick e ganhe recompensas exclusivas."
- Atualizar og:title, og:description e remover referencias ao Lovable
- Remover twitter:site @Lovable

### robots.txt
- Manter como esta (ja permite todos os bots)

## Detalhes Tecnicos

### AdminReferrals.tsx
- Novo estado: `const [filterStatus, setFilterStatus] = useState<string>("all")`
- Calcular contagens: `const counts = referrals.reduce(...)` para cada status
- Filtrar: `const filtered = filterStatus === "all" ? referrals : referrals.filter(r => r.status === filterStatus)`
- Renderizar barra de filtros com `Button` variant outline/default baseado na selecao
- Usar `filtered` no map da tabela em vez de `referrals`

### index.html
- Atualizar title, meta description, og:title, og:description
- Mudar lang para pt-BR
- Remover referencias ao Lovable nas meta tags
