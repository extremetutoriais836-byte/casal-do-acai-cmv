"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Pencil, ShoppingBasket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/components/AppContext";
import { brl, num, pct } from "@/lib/format";
import { faixaDoCopo, faixaStatus } from "@/lib/calculo";
import {
  carregarFichasCompletas,
  cmvDaFicha,
  detalharIngredientes,
  indexarInsumos,
  type FichaCompleta,
  type InsumoRef,
  type LinhaIngrediente,
} from "@/lib/fichas";
import { PageTitulo, Card, Vazio } from "@/components/ui";
import { CmvBadge } from "@/components/CmvBadge";

export default function FichaTecnicaPage() {
  const { restaurante, config } = useApp();
  const [insumos, setInsumos] = useState<InsumoRef[]>([]);
  const [fichas, setFichas] = useState<FichaCompleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberta, setAberta] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!restaurante) return;
    const dados = await carregarFichasCompletas(supabase, restaurante.id);
    setInsumos(dados.insumos);
    setFichas(dados.fichas);
    // Com poucos copos, abrir o primeiro evita a tela parecer vazia.
    setAberta((atual) => atual ?? dados.fichas[0]?.id ?? null);
    setCarregando(false);
  }, [restaurante]);

  useEffect(() => {
    void (async () => {
      await carregar();
    })();
  }, [carregar]);

  const porId = indexarInsumos(insumos);

  return (
    <>
      <PageTitulo
        titulo="Ficha técnica"
        subtitulo="O que vai em cada copo, quanto custa cada ingrediente e quanto ele pesa no custo total."
      />

      {carregando ? (
        <div className="flex h-32 items-center justify-center text-muted">Carregando…</div>
      ) : fichas.length === 0 ? (
        <Vazio>
          Você ainda não tem copos montados.{" "}
          <Link href="/fichas" className="font-semibold text-brand hover:text-brand-vivid">
            Montar meus copos
          </Link>
          .
        </Vazio>
      ) : (
        <div className="space-y-3">
          {fichas.map((f) => {
            const cmv = cmvDaFicha(f, porId);
            const status = faixaStatus(cmv, faixaDoCopo(f.nome_prato, config.faixasCmv));
            const linhas = detalharIngredientes(f, porId);
            const cmvPct = f.preco_venda > 0 ? (cmv / f.preco_venda) * 100 : null;
            const expandida = aberta === f.id;

            return (
              <Card key={f.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setAberta(expandida ? null : f.id)}
                  aria-expanded={expandida}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-line/25"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-brand-deep">{f.nome_prato}</span>
                      <CmvBadge status={status} />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {linhas.length} ingrediente{linhas.length === 1 ? "" : "s"} · vende por{" "}
                      {brl(f.preco_venda)}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-extrabold text-brand-deep">{brl(cmv)}</span>
                    <span className="block text-[11px] text-muted">
                      {cmvPct != null ? `${pct(cmvPct)} do preço` : "custo do copo"}
                    </span>
                  </span>

                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted transition-transform ${expandida ? "rotate-180" : ""}`}
                  />
                </button>

                {expandida && (
                  <div className="border-t border-line bg-surface/60 px-4 py-4">
                    {linhas.length === 0 ? (
                      <p className="text-sm text-muted">
                        Este copo ainda não tem ingredientes.{" "}
                        <Link href="/fichas" className="font-medium text-brand hover:text-brand-vivid">
                          Adicionar agora
                        </Link>
                        .
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-3">
                          {linhas.map((l) => (
                            <LinhaIngredienteItem key={l.insumoId} linha={l} />
                          ))}
                        </ul>

                        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                          <span className="text-sm font-semibold text-ink">Custo total do copo</span>
                          <span className="font-extrabold text-brand-deep">{brl(cmv)}</span>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm text-muted">Sobra sobre o preço de venda</span>
                          <span
                            className={`font-semibold ${
                              f.preco_venda - cmv >= 0 ? "text-profit" : "text-loss"
                            }`}
                          >
                            {brl(f.preco_venda - cmv)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          Isto é antes da taxa de entrega e dos custos fixos. O lucro real está em{" "}
                          <Link href="/dashboard" className="font-medium text-brand hover:text-brand-vivid">
                            Meu lucro
                          </Link>
                          .
                        </p>
                      </>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/fichas"
                        className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm font-semibold text-brand-deep ring-1 ring-line hover:bg-line/40"
                      >
                        <Pencil size={14} /> Editar este copo
                      </Link>
                      <Link
                        href="/insumos"
                        className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm font-semibold text-brand-deep ring-1 ring-line hover:bg-line/40"
                      >
                        <ShoppingBasket size={14} /> Atualizar preços
                      </Link>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          <p className="px-1 pt-2 text-xs text-muted">
            O ingrediente que aparece primeiro é o que mais pesa no custo — normalmente é
            nele que vale negociar com o fornecedor.
          </p>
        </div>
      )}
    </>
  );
}

function LinhaIngredienteItem({ linha }: { linha: LinhaIngrediente }) {
  if (linha.orfao) {
    return (
      <li className="text-sm text-warn">
        Ingrediente removido — edite o copo para corrigir.
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{linha.nome}</span>
        <span className="shrink-0 text-sm font-semibold text-ink">{brl(linha.custoNoCopo)}</span>
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-3 text-[11px] text-muted">
        <span>
          {num(linha.quantidade, linha.quantidade % 1 === 0 ? 0 : 2)} {linha.unidade}
          {linha.custoUnitario > 0 && (
            <> · {brl(linha.custoUnitario)} por {linha.unidade || "unidade"}</>
          )}
        </span>
        <span>{pct(linha.pctDoCusto, 0)} do custo</span>
      </div>

      {/* Barra: torna visível, de relance, quem domina o custo do copo. */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand/70"
          style={{ width: `${Math.max(linha.pctDoCusto, 1)}%` }}
        />
      </div>
    </li>
  );
}
