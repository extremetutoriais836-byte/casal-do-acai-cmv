"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { seedFichasAcai } from "./seedAcai";
import { TAXA_PLATAFORMA_PADRAO, type ModeloEntrega } from "./calculo";
import { traduzErroBanco, type ErroBanco } from "./erros";

export interface Restaurante {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  nome_loja: string | null;
  faturamento_estimado: number | null;
  onboarding_ok: boolean;
  modelo_entrega: ModeloEntrega;
  taxa_plataforma: number;
  meta_lucro: number;
  bloqueado: boolean;
}

/** Usuário logado (ou null). Usar no mount das telas do painel. */
export async function getUsuarioAtual(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Garante o registro em `restaurantes` (FK restaurante_id depende dele) e,
 * na PRIMEIRA vez, semeia as 5 fichas de açaí. Idempotente.
 * Retorna o restaurante já normalizado.
 */
export async function ensureRestauranteDoUsuario(user: User): Promise<Restaurante> {
  const nome =
    (user.user_metadata?.nome as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Minha açaiteria";

  // Cria se não existir (id = auth.uid()). ignoreDuplicates evita corrida.
  const meta = user.user_metadata ?? {};
  const payload: Record<string, unknown> = {
    id: user.id,
    nome,
    email: user.email ?? null,
    telefone: (meta.telefone as string | undefined) ?? null,
    nome_loja: (meta.nome_loja as string | undefined)?.trim() || nome,
  };

  const error = await upsertTolerante(payload);
  if (error) {
    // Sem este registro nada funciona: os inserts de insumo/ficha/custo
    // quebram por chave estrangeira. Falhar aqui, com mensagem clara, é
    // melhor que deixar a conta pela metade e o erro aparecer em toda tela.
    console.error("[restaurante] falha ao criar/garantir o registro:", error);
    throw new Error(traduzErroBanco(error, "configurar sua conta"));
  }

  // Semeia o kit de açaí na primeira vez.
  try {
    await seedFichasAcai(supabase, user.id);
  } catch (e) {
    // Não bloqueia o acesso se o seed falhar — só loga.
    console.error("[seed açaí] falhou:", e);
  }

  return getRestaurante(user.id);
}

/** Lê o restaurante já com defaults aplicados. */
export async function getRestaurante(id: string): Promise<Restaurante> {
  const { data } = await supabase
    .from("restaurantes")
    .select(
      "id, nome, nome_loja, email, telefone, faturamento_estimado, onboarding_ok, modelo_entrega, taxa_plataforma, meta_lucro, bloqueado"
    )
    .eq("id", id)
    .single();

  const r = (data ?? {}) as Partial<Restaurante>;
  return {
    id,
    nome: r.nome ?? "Minha açaiteria",
    email: r.email ?? null,
    telefone: r.telefone ?? null,
    nome_loja: r.nome_loja ?? null,
    faturamento_estimado: r.faturamento_estimado ?? null,
    onboarding_ok: r.onboarding_ok ?? false,
    modelo_entrega: (r.modelo_entrega as ModeloEntrega) ?? "plataforma",
    taxa_plataforma: r.taxa_plataforma ?? TAXA_PLATAFORMA_PADRAO,
    meta_lucro: r.meta_lucro ?? 4.0,
    bloqueado: r.bloqueado ?? false,
  };
}

export async function marcarOnboardingOk(id: string): Promise<void> {
  await supabase.from("restaurantes").update({ onboarding_ok: true }).eq("id", id);
}

/** Nome da coluna citada num erro "coluna não existe" (PGRST204). */
function colunaFaltante(e: ErroBanco): string | null {
  const txt = `${e.message ?? ""} ${e.details ?? ""}`;
  if (e.code !== "PGRST204" && !/column .* does not exist|could not find/i.test(txt)) return null;
  const m = txt.match(/'([a-z_]+)'|column "([a-z_]+)"/i);
  return m?.[1] ?? m?.[2] ?? null;
}

/**
 * Upsert que sobrevive a migração pendente.
 *
 * Se o banco ainda não tem alguma coluna nova, o PostgREST recusa a linha
 * inteira. Em vez de deixar a conta sem registro — que quebra TODAS as telas
 * seguintes por chave estrangeira —, removemos a coluna citada no erro e
 * tentamos de novo. O usuário perde só aquele campo, não o acesso.
 */
async function upsertTolerante(payload: Record<string, unknown>): Promise<ErroBanco | null> {
  const atual = { ...payload };
  const opcoes = { onConflict: "id", ignoreDuplicates: true } as const;

  // Limite = nº de colunas opcionais; evita laço infinito em erro repetido.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { error } = await supabase.from("restaurantes").upsert(atual, opcoes);
    if (!error) return null;

    const coluna = colunaFaltante(error);
    if (!coluna || !(coluna in atual) || coluna === "id") return error;

    console.warn(
      `[restaurante] coluna "${coluna}" não existe no banco — falta rodar a migração. ` +
        "Criando a conta sem esse campo para não travar o uso."
    );
    delete atual[coluna];
  }
  return null;
}
