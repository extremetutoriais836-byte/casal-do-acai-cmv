/**
 * Tradução de erros do Supabase Auth para português.
 *
 * Regra: mensagem amigável para as causas CONHECIDAS; para as desconhecidas,
 * mostrar o texto original. Engolir o erro atrás de um "tente novamente"
 * genérico deixa o usuário (e quem dá suporte) sem nada para investigar.
 */
export type AcaoAuth = "entrar" | "criar a conta" | "enviar o link" | "salvar a senha";

export function traduzErroAuth(msg: string, acao: AcaoAuth): string {
  const m = msg ?? "";

  // --- Credenciais / conta ---
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered|already exists|user already/i.test(m))
    return "Este e-mail já tem conta. Tente entrar.";
  if (/email not confirmed/i.test(m))
    return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";

  // --- Configuração do projeto Supabase ---
  if (/signups? not allowed|signup.*disabled|not allowed for this instance/i.test(m))
    return "O cadastro está desativado no Supabase (Authentication → Providers → Email).";
  if (/invalid api key|invalid.*jwt|apikey/i.test(m))
    return "A chave do Supabase está inválida. Confira NEXT_PUBLIC_SUPABASE_ANON_KEY e refaça o deploy.";
  if (/database error|unexpected_failure/i.test(m))
    return "O banco recusou a operação. Confira se as migrações foram aplicadas.";

  // --- Rede / projeto fora do ar ---
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(m))
    return "Não foi possível falar com o banco de dados. O projeto Supabase pode estar pausado — reative no painel e tente de novo.";
  if (/rate limit|too many requests|email rate/i.test(m))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (/same.*password|should be different/i.test(m))
    return "A nova senha precisa ser diferente da anterior.";
  if (/session|token.*expired|invalid.*token/i.test(m))
    return "O link expirou ou já foi usado. Peça um novo em 'Esqueci minha senha'.";

  // --- Validação ---
  if (/password.*(6|short|length)|weak password/i.test(m))
    return "Senha inválida (mínimo 6 caracteres).";
  if (/valid email|invalid email|email address.*invalid/i.test(m))
    return "E-mail inválido.";

  // Desconhecido: mostra o original, senão não há como diagnosticar.
  return `Não foi possível ${acao}. Detalhe técnico: ${m}`;
}

/** Erro lançado (não retornado) — ex.: cliente Supabase sem configuração. */
export function traduzExcecao(e: unknown, acao: AcaoAuth): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("[Supabase]"))
    return "O app está sem configuração do banco de dados. Avise o suporte.";
  return traduzErroAuth(msg, acao);
}

/* ------------------------------------------------------------------ *
 *  Erros de banco (PostgREST / Postgres)
 * ------------------------------------------------------------------ */

export interface ErroBanco {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * Traduz falhas de gravação. Mesma regra de sempre: mensagem acionável para
 * o que é conhecido, e o texto original quando não for — nunca um
 * "tente novamente" que não diz nada.
 */
export function traduzErroBanco(e: ErroBanco | null | undefined, acao = "salvar"): string {
  const m = e?.message ?? "";
  const c = e?.code ?? "";
  const tudo = `${m} ${e?.details ?? ""} ${e?.hint ?? ""}`;

  // Coluna ausente: migração pendente no Supabase.
  if (c === "PGRST204" || /column .* does not exist|could not find the .* column/i.test(tudo)) {
    const coluna = tudo.match(/'([a-z_]+)'|column "([a-z_]+)"/i);
    const nome = coluna?.[1] ?? coluna?.[2];
    return `O banco de dados está desatualizado${nome ? ` (falta a coluna "${nome}")` : ""}. Falta rodar uma migração no Supabase. Avise o suporte.`;
  }

  // Chave estrangeira: normalmente o restaurante do usuário não existe.
  if (c === "23503" || /violates foreign key|foreign key constraint/i.test(tudo)) {
    return "Sua conta ainda não terminou de ser configurada. Recarregue a página (F5) e tente de novo — se persistir, saia e entre novamente.";
  }

  // RLS: sessão expirada ou gravando em conta alheia.
  if (c === "42501" || /row-level security|violates row-level security/i.test(tudo)) {
    return "Sem permissão para gravar. Sua sessão pode ter expirado — saia e entre de novo.";
  }

  if (c === "23505" || /duplicate key|already exists/i.test(tudo)) {
    return "Esse item já existe na sua lista.";
  }

  if (c === "23514" || /violates check constraint/i.test(tudo)) {
    return "Algum valor está fora do permitido (preço ou quantidade). Confira os números.";
  }

  if (/failed to fetch|networkerror|load failed/i.test(tudo)) {
    return "Sem conexão com o banco de dados. Verifique sua internet — se persistir, o projeto pode estar pausado.";
  }

  return `Não foi possível ${acao}.${m ? ` Detalhe técnico: ${m}` : ""}`;
}
