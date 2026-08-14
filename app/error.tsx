"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

/**
 * Tela de erro do app. Sem isto, uma exceção em qualquer página vira tela
 * branca com texto em inglês — o usuário fica sem entender e sem saída.
 * Aqui ele consegue tentar de novo (sem recarregar tudo) ou voltar ao app.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erro não tratado:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-loss-soft">
        <TriangleAlert size={26} className="text-loss" />
      </span>

      <div>
        <h1 className="text-2xl font-extrabold text-brand-deep">Algo deu errado</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Tivemos um problema ao carregar esta tela. Seus dados estão salvos — nada foi perdido.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid"
        >
          <RefreshCw size={16} />
          Tentar de novo
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-brand-deep ring-1 ring-line hover:bg-line/40"
        >
          Voltar ao início
        </Link>
      </div>

      {error.digest && (
        <p className="text-xs text-muted">
          Se acontecer de novo, informe este código ao suporte:{" "}
          <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </main>
  );
}
