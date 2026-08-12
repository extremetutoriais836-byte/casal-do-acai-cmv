"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { traduzErroAuth, traduzExcecao } from "@/lib/erros";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nova-senha`,
      });
      if (error) {
        console.error("[esqueci-senha] erro do Supabase:", error);
        setErro(traduzErroAuth(error.message, "enviar o link"));
        setEnviando(false);
        return;
      }
      // Sucesso: mensagem NEUTRA de propósito — não revela se o e-mail
      // tem conta (evita descobrir quem é cliente por tentativa e erro).
      setEnviado(true);
    } catch (e) {
      console.error("[esqueci-senha] exceção:", e);
      setErro(traduzExcecao(e, "enviar o link"));
    }
    setEnviando(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <Logo variant="dark" size={44} />
      </div>
      <div className="rounded-2xl bg-white p-7 shadow-2xl">
        {enviado ? (
          <>
            <h1 className="text-xl font-extrabold text-brand-deep">Verifique seu e-mail</h1>
            <p className="mt-3 text-sm text-ink">
              Se existir uma conta com <strong>{email}</strong>, enviamos um link para você
              criar uma senha nova.
            </p>
            <p className="mt-3 text-sm text-muted">
              O link vale por 1 hora. Não esqueça de olhar a caixa de spam.
            </p>
            <Link
              href="/login"
              className="mt-6 block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-vivid"
            >
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-brand-deep">Esqueceu a senha?</h1>
            <p className="mt-1 text-sm text-muted">
              Informe seu e-mail e enviamos um link para criar uma nova.
            </p>

            <form onSubmit={enviar} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </label>

              {erro && <p className="text-sm font-medium text-loss">{erro}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              Lembrou?{" "}
              <Link href="/login" className="font-semibold text-brand hover:text-brand-vivid">
                Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
