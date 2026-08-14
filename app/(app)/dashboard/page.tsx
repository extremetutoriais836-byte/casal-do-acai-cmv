"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Smartphone, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/components/AppContext";
import { brl, parseDecimalBR, pct } from "@/lib/format";
import { calcularLucro, faixaDoCopo, faixaStatus, type ModeloEntrega } from "@/lib/calculo";
import type { Restaurante } from "@/lib/restaurante";
import type { ConfigApp } from "@/lib/config";
import { PageTitulo, Card, Vazio, Input, Rotulo } from "@/components/ui";
import { CmvBadge } from "@/components/CmvBadge";
import { FecharJornada, type LinhaPreco } from "@/components/FecharJornada";

interface FichaCmv {
  ficha_tecnica_id: string;
  nome_prato: string;
  preco_venda: number;
  cmv: number;
}

const corStatus: Record<string, string> = {
  ideal: "text-profit",
  atencao: "text-warn",
  acima: "text-loss",
};

export default function DashboardPage() {
  const { restaurante, setRestaurante, config } = useApp();
  const [fichas, setFichas] = useState<FichaCmv[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!restaurante) return;
    const { data } = await supabase
      .from("vw_cmv_ficha")
      .select("ficha_tecnica_id, nome_prato, preco_venda, cmv")
      .eq("restaurante_id", restaurante.id)
      .order("cmv");
    setFichas((data as FichaCmv[]) ?? []);
    setCarregando(false);
  }, [restaurante]);

  useEffect(() => {
    void (async () => {
      await carregar();
    })();
  }, [carregar]);

  async function persistir(patch: Partial<Restaurante>) {
    if (!restaurante) return;
    setRestaurante({ ...restaurante, ...patch });
    await supabase.from("restaurantes").update(patch).eq("id", restaurante.id);
  }

  if (!restaurante) return null;

  const modelo = restaurante.modelo_entrega;
  const taxaAtual =
    modelo === "propria" ? config.taxasEntrega.propria : restaurante.taxa_plataforma;

  // Uma passada só: alimenta os cards e o encerramento da jornada.
  const linhas: LinhaPreco[] = fichas.map((f) => {
    const r = calcularLucro({
      cmv: f.cmv,
      precoVenda: f.preco_venda,
      modelo,
      taxaPlataforma: restaurante.taxa_plataforma,
      metaLucro: restaurante.meta_lucro,
      taxaPropria: config.taxasEntrega.propria,
    });
    return {
      id: f.ficha_tecnica_id,
      nome: f.nome_prato,
      cmv: f.cmv,
      precoVenda: f.preco_venda,
      precoEquilibrio: r.precoEquilibrio,
      precoIdeal: r.precoIdeal,
      lucroReal: r.lucroReal,
      margemPct: r.margemPct,
      abaixoDoIdeal: f.preco_venda < r.precoIdeal,
      prejuizo: f.preco_venda < r.precoEquilibrio,
      status: faixaStatus(f.cmv, faixaDoCopo(f.nome_prato, config.faixasCmv)),
    };
  });

  return (
    <>
      <PageTitulo
        etapa="Etapa 4 de 4"
        titulo="Meu lucro"
        subtitulo="Quanto custa, quanto sobra e o preço mínimo de cada copo — já com a taxa de entrega."
      />

      <SeletorEntrega
        key={restaurante.id}
        restaurante={restaurante}
        config={config}
        onNomeLoja={(n) => persistir({ nome_loja: n })}
        onModelo={(m) => persistir({ modelo_entrega: m })}
        onTaxa={(t) => persistir({ taxa_plataforma: t })}
        onMeta={(m) => persistir({ meta_lucro: m })}
      />

      {carregando ? (
        <div className="flex h-32 items-center justify-center text-muted">Calculando…</div>
      ) : fichas.length === 0 ? (
        <Vazio>
          Nenhum copo para calcular ainda.{" "}
          <Link href="/fichas" className="font-semibold text-brand hover:text-brand-vivid">
            Monte seus copos
          </Link>
          .
        </Vazio>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Taxa aplicada agora: <span className="font-semibold text-ink">{pct(taxaAtual)}</span>.
            Os preços dos ingredientes vieram de exemplo —{" "}
            <Link href="/insumos" className="font-medium text-brand hover:text-brand-vivid">
              troque pelos da sua última compra
            </Link>
            .
          </p>

          {linhas.map((l) => (
            <Card key={l.id}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-brand-deep">{l.nome}</h3>
                <CmvBadge status={l.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Metrica
                  rotulo="Custo do copo (CMV)"
                  valor={brl(l.cmv)}
                  cor={l.status ? corStatus[l.status] : "text-ink"}
                />
                <Metrica rotulo="Preço de venda" valor={brl(l.precoVenda)} />
                <Metrica
                  rotulo="Preço ideal"
                  valor={brl(l.precoIdeal)}
                  cor="text-brand-deep"
                  sub={`p/ lucrar ${brl(restaurante.meta_lucro)}`}
                />
                <Metrica
                  rotulo="Quanto sobra"
                  valor={brl(l.lucroReal)}
                  cor={l.lucroReal >= 0 ? "text-profit" : "text-loss"}
                  sub={l.margemPct != null ? `margem ${pct(l.margemPct)}` : undefined}
                />
              </div>

              <p className="mt-3 text-[11px] text-muted">
                Piso de equilíbrio: <strong className="text-ink">{brl(l.precoEquilibrio)}</strong> —
                abaixo disso você paga para vender.
              </p>

              {l.prejuizo ? (
                <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-loss-soft px-3 py-2 text-xs font-medium text-loss">
                  <TriangleAlert size={14} />
                  Prejuízo: este preço não cobre nem o custo mais a taxa. Suba para pelo menos{" "}
                  {brl(l.precoEquilibrio)}.
                </p>
              ) : l.abaixoDoIdeal ? (
                <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
                  <TriangleAlert size={14} />
                  Você lucra, mas menos que sua meta de {brl(restaurante.meta_lucro)}. Para atingi-la,
                  venda a {brl(l.precoIdeal)}.
                </p>
              ) : null}
            </Card>
          ))}

          <FecharJornada linhas={linhas} taxaAtual={taxaAtual} metaLucro={restaurante.meta_lucro} />
        </div>
      )}
    </>
  );
}

/** Controles de entrega — estado local inicializado do restaurante (via key). */
function SeletorEntrega({
  restaurante,
  config,
  onNomeLoja,
  onModelo,
  onTaxa,
  onMeta,
}: {
  restaurante: Restaurante;
  config: ConfigApp;
  onNomeLoja: (n: string) => void;
  onModelo: (m: ModeloEntrega) => void;
  onTaxa: (t: number) => void;
  onMeta: (m: number) => void;
}) {
  const modelo = restaurante.modelo_entrega;
  const [taxaPlat, setTaxaPlat] = useState(() =>
    String(restaurante.taxa_plataforma).replace(".", ",")
  );
  const [meta, setMeta] = useState(() => String(restaurante.meta_lucro).replace(".", ","));
  const [nomeLoja, setNomeLoja] = useState(() => restaurante.nome_loja ?? "");

  function salvarNomeLoja() {
    const n = nomeLoja.trim();
    if (!n || n === restaurante.nome_loja) return;
    onNomeLoja(n);
  }

  function salvarTaxa() {
    const v = parseDecimalBR(taxaPlat);
    if (Number.isNaN(v) || v < 0 || v >= 100) {
      setTaxaPlat(String(restaurante.taxa_plataforma).replace(".", ","));
      return;
    }
    onTaxa(v);
  }
  function salvarMeta() {
    const v = parseDecimalBR(meta);
    if (Number.isNaN(v) || v < 0) {
      setMeta(String(restaurante.meta_lucro).replace(".", ","));
      return;
    }
    onMeta(v);
  }

  return (
    <Card className="mb-6">
      <label className="mb-5 block">
        <Rotulo ajuda="Aparece no topo do app e no menu">Nome da sua loja</Rotulo>
        <Input
          value={nomeLoja}
          onChange={(e) => setNomeLoja(e.target.value)}
          onBlur={salvarNomeLoja}
          placeholder="Ex: Açaí do Casal"
        />
      </label>

      <p className="mb-3 text-sm font-bold text-ink">Como você entrega?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onModelo("propria")}
          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
            modelo === "propria" ? "border-brand bg-brand/8" : "border-line hover:border-brand/40"
          }`}
        >
          <Bike size={22} className={modelo === "propria" ? "text-brand" : "text-muted"} />
          <span>
            <span className="block font-semibold text-ink">Entrega própria</span>
            <span className="block text-xs text-muted">
              taxa de {pct(config.taxasEntrega.propria)}
            </span>
          </span>
        </button>

        <button
          onClick={() => onModelo("plataforma")}
          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
            modelo === "plataforma" ? "border-brand bg-brand/8" : "border-line hover:border-brand/40"
          }`}
        >
          <Smartphone size={22} className={modelo === "plataforma" ? "text-brand" : "text-muted"} />
          <span>
            <span className="block font-semibold text-ink">Entrega pelo aplicativo</span>
            <span className="block text-xs text-muted">
              taxa de {pct(restaurante.taxa_plataforma)}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          <Rotulo ajuda="A comissão que o app cobra (varia por contrato)">
            Taxa do aplicativo (%)
          </Rotulo>
          <Input
            inputMode="decimal"
            value={taxaPlat}
            onChange={(e) => setTaxaPlat(e.target.value)}
            onBlur={salvarTaxa}
          />
        </label>
        <label>
          <Rotulo ajuda="Define o preço ideal de cada copo">Quanto você quer lucrar por copo</Rotulo>
          <Input
            inputMode="decimal"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            onBlur={salvarMeta}
          />
        </label>
      </div>
    </Card>
  );
}

function Metrica({
  rotulo,
  valor,
  cor = "text-ink",
  sub,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{rotulo}</p>
      <p className={`text-lg font-extrabold ${cor}`}>{valor}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
