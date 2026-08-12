-- =====================================================================
--  Migração: telefone/WhatsApp do dono, coletado no cadastro.
--  Serve para contato e para exportar a lista no painel admin.
--
--  Formato armazenado: SOMENTE DÍGITOS, com código do país —
--  ex.: 5511987654321. É o formato que o WhatsApp aceita direto
--  (https://wa.me/5511987654321), sem precisar limpar nada na hora do envio.
--
--  Rode no SQL Editor do Supabase. Idempotente.
--  Rodar DEPOIS do schema_entrega.sql.
-- =====================================================================

alter table public.restaurantes
  add column if not exists telefone text;

comment on column public.restaurantes.telefone is
  'WhatsApp do dono, somente digitos com DDI: 5511987654321';

-- Índice parcial: o painel admin filtra/exporta quem tem telefone.
create index if not exists idx_restaurantes_telefone
  on public.restaurantes (telefone)
  where telefone is not null;
