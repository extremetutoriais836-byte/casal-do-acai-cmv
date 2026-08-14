import Link from "next/link";
import { LogoMark } from "@/components/Logo";

/**
 * 404 próprio. O padrão do Next é em inglês, sem identidade e — o que mais
 * importa — sem caminho de volta: quem digita a URL errada ou segue um link
 * antigo fica preso. Aqui sempre há uma saída.
 */
export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoMark size={56} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Erro 404</p>
        <h1 className="mt-1 text-2xl font-extrabold text-brand-deep">
          Não encontramos esta página
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          O endereço pode ter sido digitado errado ou a página pode ter mudado de lugar.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid"
        >
          Ir para Meu lucro
        </Link>
        <Link
          href="/insumos"
          className="rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-brand-deep ring-1 ring-line hover:bg-line/40"
        >
          Meus ingredientes
        </Link>
      </div>
    </main>
  );
}
