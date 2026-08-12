"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { traduzErroAuth, traduzExcecao } from "@/lib/erros";
import { mascaraTelefone, telefoneValido, telefoneParaArmazenar } from "@/lib/format";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (!telefoneValido(telefone)) {
      setErro("Informe um WhatsApp válido com DDD. Ex: (11) 98765-4321");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("A senha e a confirmação não são iguais.");
      return;
    }

    setEnviando(true);
    let data;
    try {
      const resp = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, telefone: telefoneParaArmazenar(telefone) } },
      });
      if (resp.error) {
        console.error("[cadastro] erro do Supabase:", resp.error);
        setErro(traduzErroAuth(resp.error.message, "criar a conta"));
        setEnviando(false);
        return;
      }
      data = resp.data;
    } catch (e) {
      console.error("[cadastro] exceção:", e);
      setErro(traduzExcecao(e, "criar a conta"));
      setEnviando(false);
      return;
    }

    // Com "Confirm email" desativado, já vem sessão -> entra direto.
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    // Fallback (confirmação de e-mail ativada no projeto Supabase).
    setAviso(
      "Conta criada! Confirme seu e-mail para entrar. Se preferir acesso imediato, desative 'Confirm email' no Supabase."
    );
    setEnviando(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <Logo variant="dark" size={44} />
      </div>
      <div className="rounded-2xl bg-white p-7 shadow-2xl">
        <h1 className="text-xl font-extrabold text-brand-deep">Criar sua conta</h1>
        <p className="mt-1 text-sm text-muted">Acesso vitalício, incluído na sua compra.</p>

        <form onSubmit={criar} className="mt-5 space-y-4">
          <Campo label="Nome" type="text" value={nome} onChange={setNome} autoComplete="name" required />
          <Campo label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Campo
            label="WhatsApp"
            type="tel"
            value={telefone}
            onChange={(v) => setTelefone(mascaraTelefone(v))}
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            ajuda="Com DDD. Usamos para falar com você sobre a ferramenta."
            required
          />
          <Campo label="Senha" type="password" value={senha} onChange={setSenha} autoComplete="new-password" required />
          <Campo label="Confirmar senha" type="password" value={confirmar} onChange={setConfirmar} autoComplete="new-password" required />

          {erro && <p className="text-sm font-medium text-loss">{erro}</p>}
          {aviso && <p className="text-sm font-medium text-profit">{aviso}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid disabled:opacity-60"
          >
            {enviando ? "Criando…" : "Criar conta e entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-vivid">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function Campo({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  ajuda,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  ajuda?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {ajuda && <span className="mb-1 block text-xs text-muted">{ajuda}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        inputMode={type === "tel" ? "numeric" : undefined}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

