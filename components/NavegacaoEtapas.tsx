"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITENS } from "./nav";

/**
 * Avançar/voltar entre as 4 etapas — só no MOBILE.
 *
 * No desktop a sidebar fica sempre visível e já cumpre esse papel; no celular
 * ela vive atrás do menu, e sem isto o usuário precisa abrir o menu a cada
 * etapa concluída. Aparece apenas nas telas que são etapas.
 */
export function NavegacaoEtapas() {
  const pathname = usePathname();
  const idx = NAV_ITENS.findIndex((i) => i.href === pathname);
  if (idx === -1) return null;

  const anterior = idx > 0 ? NAV_ITENS[idx - 1] : null;
  const proxima = idx < NAV_ITENS.length - 1 ? NAV_ITENS[idx + 1] : null;

  return (
    <nav
      aria-label="Navegação entre etapas"
      className="mt-8 border-t border-line pt-4 md:hidden"
    >
      <div className="flex items-stretch gap-2">
        {anterior ? (
          <Link
            href={anterior.href}
            className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3 py-3 text-left active:bg-line/50"
          >
            <ChevronLeft size={18} className="shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="block text-[11px] text-muted">Voltar</span>
              <span className="block truncate text-sm font-semibold text-ink">
                {anterior.label}
              </span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}

        {proxima && (
          <Link
            href={proxima.href}
            className="flex flex-1 items-center justify-end gap-2 rounded-xl bg-brand px-3 py-3 text-right text-white active:bg-brand-vivid"
          >
            <span className="min-w-0">
              <span className="block text-[11px] text-white/75">Próxima etapa</span>
              <span className="block truncate text-sm font-semibold">{proxima.label}</span>
            </span>
            <ChevronRight size={18} className="shrink-0" />
          </Link>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Etapa {idx + 1} de {NAV_ITENS.length}
      </p>
    </nav>
  );
}
