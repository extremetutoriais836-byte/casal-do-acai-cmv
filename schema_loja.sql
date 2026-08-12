-- =====================================================================
--  Migração: nome da loja (personalização da interface).
--
--  `restaurantes.nome` já existia guardando o nome do DONO (vem do cadastro).
--  Em vez de reaproveitar e bagunçar as contas existentes, o nome da loja
--  entra em coluna própria: `nome_loja`.
--
--    nome       -> "Davi Wendell"      (dono; usado no painel admin)
--    nome_loja  -> "Açaí do Casal"     (loja; aparece no app para o cliente)
--
--  Rode no SQL Editor do Supabase. Idempotente.
-- =====================================================================

alter table public.restaurantes
  add column if not exists nome_loja text;

comment on column public.restaurantes.nome      is 'nome do DONO (cadastro)';
comment on column public.restaurantes.nome_loja is 'nome da LOJA, exibido no app';

-- Contas criadas antes desta coluna: usa o nome do dono como ponto de partida
-- (ele edita depois no app). Só preenche o que estiver vazio.
update public.restaurantes
   set nome_loja = nome
 where nome_loja is null
   and nome is not null;
