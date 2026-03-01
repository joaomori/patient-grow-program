
# Sistema de Afiliados - Dr. Erick

## Visão Geral
Sistema de indicação onde afiliados (pacientes ou não) compartilham um link, indicam amigos/parentes, e ganham descontos ou procedimentos gratuitos conforme regras definidas pelo admin.

---

## 1. Autenticação e Perfis
- **Login do Admin** com email/senha (acesso completo ao sistema)
- **Login do Afiliado** com email/senha (acesso ao painel do afiliado)
- Cadastro de afiliado via link compartilhado pelo admin ou auto-cadastro

## 2. Painel do Admin
- **Dashboard com relatórios**: total de afiliados, indicações feitas, consultas fechadas, recompensas concedidas
- **Gestão de Afiliados**: listar, ativar/desativar afiliados
- **Gestão de Indicações**: ver indicações de cada afiliado, marcar manualmente quando um indicado fechou consulta/protocolo
- **Regras de Recompensa (configurável)**: definir quantas indicações convertidas são necessárias para ganhar desconto ou procedimento (ex: "A cada 3 pacientes que fecham, ganha 1 limpeza de pele")
- **Histórico de recompensas** concedidas

## 3. Painel do Afiliado
- **Link pessoal de indicação** para compartilhar
- **Formulário de indicação**: o afiliado preenche nome, telefone e email do indicado
- **Acompanhamento**: ver quantas indicações fez, quantas converteram, progresso até a próxima recompensa
- **Histórico de recompensas** já recebidas
- Visualização clara tipo "Faltam X pacientes para ganhar [procedimento]"

## 4. Notificações por Email
- Email automático para o afiliado quando uma indicação é confirmada pelo admin
- Email de lembrete: "Falta X paciente(s) para ganhar [recompensa]!"
- Email de parabéns quando o afiliado atinge uma recompensa

## 5. Formulário de Indicação (público)
- Página pública acessível pelo link do afiliado
- Campos: nome completo, telefone, email do indicado
- Vincula automaticamente ao afiliado que compartilhou o link

## 6. Design
- Visual simples e funcional, foco na usabilidade
- Layout limpo e responsivo (funciona bem no celular)
- Cores neutras e profissionais

## Tecnologia
- **Backend**: Lovable Cloud (Supabase) para banco de dados, autenticação e envio de emails
- **Frontend**: React com componentes visuais limpos e intuitivos
