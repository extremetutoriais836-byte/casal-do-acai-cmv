"use client";

/** Primitivos de UI compartilhados pelas telas do painel. */

export function PageTitulo({
  titulo,
  subtitulo,
  etapa,
}: {
  titulo: string;
  subtitulo?: string;
  etapa?: string;
}) {
  return (
    <div className="mb-6">
      {etapa && (
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{etapa}</p>
      )}
      <h1 className="text-2xl font-extrabold text-brand-deep">{titulo}</h1>
      {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-5 ${className}`}>{children}</div>
  );
}

export function Rotulo({ children, ajuda }: { children: React.ReactNode; ajuda?: string }) {
  return (
    <span className="mb-1 block">
      <span className="block text-sm font-medium text-ink">{children}</span>
      {ajuda && <span className="block text-xs text-muted">{ajuda}</span>}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${props.className ?? ""}`}
    />
  );
}

export function Botao({
  children,
  variante = "primario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "perigo";
}) {
  const estilos: Record<string, string> = {
    primario: "bg-brand text-white hover:bg-brand-vivid",
    secundario: "bg-line/60 text-ink hover:bg-line",
    perigo: "bg-loss text-white hover:opacity-90",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${estilos[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/60 p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/**
 * Busca de lista. Aparece só quando a lista justifica (`aPartirDe`), para não
 * poluir a tela de quem tem poucos itens — que é o caso no primeiro acesso.
 */
export function CampoBusca({
  valor,
  onChange,
  placeholder,
  total,
  mostrando,
  aPartirDe = 8,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  total: number;
  mostrando: number;
  aPartirDe?: number;
}) {
  if (total < aPartirDe && valor === "") return null;

  return (
    <div className="mb-3">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <Input
          className="pl-9"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type="search"
        />
      </div>
      <p className="mt-1 px-1 text-xs text-muted">
        {valor ? `${mostrando} de ${total}` : `${total} no total`}
      </p>
    </div>
  );
}

/** Normaliza para busca: sem acento e sem caixa ("açaí" acha "acai"). */
export function normalizar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
