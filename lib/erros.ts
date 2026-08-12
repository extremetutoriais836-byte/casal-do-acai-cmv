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
