"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do NAVEGADOR (sessão em cookies via @supabase/ssr).
 *
 * INICIALIZAÇÃO PREGUIÇOSA — de propósito. O cliente NÃO pode ser criado no
 * escopo do módulo: o Next avalia este arquivo no SERVIDOR ao pré-renderizar
 * as páginas, e `createBrowserClient` lança exceção se as variáveis não
 * estiverem definidas ali. Isso derrubava o build inteiro
 * ("Error occurred prerendering page ..."), mesmo com as chaves configuradas
 * corretamente em runtime.
 *
 * Criando sob demanda, o cliente só nasce quando alguém realmente usa
 * (já no navegador, depois da hidratação). O build nunca depende disso.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function invalido(v: string | undefined): boolean {
  return !v || v.trim() === "" || v.includes("<") || v.includes("SEU_") || v === "...";
}

let cliente: SupabaseClient | null = null;

function getCliente(): SupabaseClient {
  if (cliente) return cliente;

  // Falha ALTO e CLARO — não mascara com fallback silencioso.
  if (invalido(url) || invalido(anon)) {
    const msg =
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes ou inválidas. " +
      "Configure o .env.local (ou as Environment Variables na Vercel) e faça um novo deploy.";
    console.error(msg);
    throw new Error(msg);
  }

  cliente = createBrowserClient(url!, anon!);
  return cliente;
}

/**
 * Mesma API de sempre (`supabase.from(...)`, `supabase.auth...`): o proxy só
 * adia a criação. Métodos são vinculados ao cliente real para que o `this`
 * interno da biblioteca continue correto.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_alvo, prop, receptor) {
    const c = getCliente();
    const valor = Reflect.get(c, prop, receptor);
    return typeof valor === "function" ? valor.bind(c) : valor;
  },
});
