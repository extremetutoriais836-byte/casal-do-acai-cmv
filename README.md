# Casal do Açaí — calculadora de CMV

Calculadora de **custo (CMV)** e **precificação** para dono de açaiteria.
Responde uma pergunta só: *quanto custa e por quanto eu devo vender cada copo.*

Não é ERP, não é sistema de gestão, não é integrador de delivery.

## As quatro etapas

```
1. Meus ingredientes → 2. Meus copos → 3. Custos fixos → 4. Meu lucro
```

1. **Meus ingredientes** — quanto você pagou e quanto vem no pacote; o custo por grama sai sozinho
2. **Meus copos** — a ficha de cada tamanho (já vem com os 5 copos do método prontos)
3. **Custos fixos** — aluguel, energia, equipe
4. **Meu lucro** — custo, margem, **preço mínimo** e faixa de CMV por copo, já com a taxa de entrega

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4
(`@theme` em `app/globals.css`, sem `tailwind.config`) · Supabase (Postgres + Auth
via `@supabase/ssr`, sessão em cookies) · lucide-react.

Sem framework de teste — o gate é `npm run build` (compila + TypeScript + ESLint).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev                  # http://localhost:3000
```

## Banco de dados

Rode os `.sql` **na ordem** no SQL Editor do Supabase. Todos são idempotentes.
A ordem importa: as policies de RLS dependem de `tem_acesso_loja`
(`schema_multitenant.sql`) e o `schema_bloqueio.sql` substitui uma função criada
em `schema_assinaturas.sql`.

```
schema.sql · schema_rls.sql · schema_custos.sql · schema_mapeamentos.sql
schema_pedidos.sql · schema_status_ifood.sql · schema_assinaturas.sql
schema_onboarding.sql · schema_pedidos_reais.sql · schema_resumo.sql
schema_cs_loja.sql · schema_templates_nicho.sql · schema_benchmark.sql
schema_multitenant.sql · schema_gestor.sql
→ schema_entrega.sql · schema_config.sql · seed_acaiteria.sql · schema_bloqueio.sql
```

As quatro últimas são desta versão. Ver `CLAUDE.md` para o que cada uma faz.

### Configuração do Supabase Auth

Em **Authentication → Providers → Email**, desative **"Confirm email"** — sem
isso o comprador cadastra e não consegue entrar na hora.

## Fórmulas

```
taxa          = modelo_entrega = 'propria' ? 15,5% : taxa_plataforma
valor_liquido = preco_venda * (1 - taxa/100)
lucro_real    = valor_liquido - CMV
preco_minimo  = (CMV + meta_lucro) / (1 - taxa/100)
```

Conferência (CMV R$ 4,50 · meta R$ 4,00): preço mínimo **R$ 10,06** na entrega
própria e **R$ 12,14** na do aplicativo. Se não bater, a fórmula está errada.

## Painel administrativo

`/admin`, liberado por `ADMIN_EMAILS` (server-only). Mostra cadastros, quantos
montaram a primeira ficha, e edita os links de vídeo do tutorial, as faixas de
CMV e as taxas — tudo em `config_app`, **sem redeploy**.

Requer `SUPABASE_SERVICE_ROLE_KEY` (JWT longo). Essa chave bypassa a RLS: só em
route handler, **nunca** em componente `"use client"`, nunca com `NEXT_PUBLIC_`.

---

Ferramenta desenvolvida pela [Locus Company](https://locuscompany.com.br).
