"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { traduzErroAuth, traduzExcecao } from "@/lib/erros";

type Estado = "verificando" | "pronto" | "invalido";

/**
 * Destino do link enviado por e-mail. O Supabase redireciona para cá com a
 * sessão de recuperação: dependendo do fluxo, via `?code=` (PKCE) ou via
 * tokens no fragmento da URL (tratados automaticamente pelo cliente).
 * Só liberamos o formulário quando existe sessão de fato.
 */
export default function NovaSenhaPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    // O evento chega quando o cliente processa o link de recuperação.
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (!ativo) return;
      if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") setEstado("pronto");
    });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!ativo) return;
        if (data.session) {
          setEstado("pronto");
          return;
        }

        // Fluxo PKCE: troca o código da URL por uma sessão.
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!ativo) return;
          setEstado(error ? "invalido" : "pronto");
          return;
        }
        setEstado("invalido");
      } catch (e) {
        console.error("[nova-senha] falha ao validar o link:", e);
        if (ativo) setEstado("invalido");
      }
    })();

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirmar) return setErro("A senha e a confirmação não são iguais.");

    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        console.error("[nova-senha] erro do Supabase:", error);
        setErro(traduzErroAuth(error.message, "salvar a senha"));
        setSalvando(false);
        return;
      }
    } catch (e) {
      console.error("[nova-senha] exceção:", e);
      setErro(traduzExcecao(e, "salvar a senha"));
      setSalvando(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <Logo variant="dark" size={44} />
      </div>
      <div className="rounded-2xl bg-white p-7 shadow-2xl">
        {estado === "verificando" && (
          <p className="py-6 text-center text-sm text-muted">Verificando o link…</p>
        )}

        {estado === "invalido" && (
          <>
            <h1 className="text-xl font-extrabold text-brand-deep">Link inválido ou expirado</h1>
            <p className="mt-3 text-sm text-ink">
              Links de recuperação valem por 1 hora e só podem ser usados uma vez. Peça um novo.
            </p>
            <Link
              href="/esqueci-senha"
              className="mt-6 block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-vivid"
            >
              Pedir novo link
            </Link>
          </>
        )}

        {estado === "pronto" && (
          <>
            <h1 className="text-xl font-extrabold text-brand-deep">Criar nova senha</h1>
            <p className="mt-1 text-sm text-muted">Escolha uma senha de pelo menos 6 caracteres.</p>

            <form onSubmit={salvar} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Nova senha</span>
                <input
                  type="password"
                  value={senha}
                  onChange={(ev) => setSenha(ev.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Confirmar senha</span>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(ev) => setConfirmar(ev.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </label>

              {erro && <p className="text-sm font-medium text-loss">{erro}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid disabled:opacity-60"
              >
                {salvando ? "Salvando…" : "Salvar e entrar"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
