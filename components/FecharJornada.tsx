"use client";

import { useState } from "react";
import { ClipboardCheck, Copy, Download, PartyPopper } from "lucide-react";
import { brl, pct } from "@/lib/format";
import type { FaixaStatus } from "@/lib/calculo";

export interface LinhaPreco {
  id: string;
  nome: string;
  status: FaixaStatus;
  cmv: number;
  precoVenda: number;
  precoMinimo: number;
  lucroReal: number;
  margemPct: number | null;
  abaixoDoPiso: boolean;
}

/**
 * Encerramento da jornada (etapa 4).
 *
 * O app terminava mostrando os números e parava — o dono via um relatório e
 * não sabia o que fazer com ele. Aqui a conta é fechada: dizemos que o
 * próximo passo é ajustar o cardápio, e entregamos a lista pronta para levar.
 *
 * Dois formatos de propósito: "copiar" resolve no celular (colar no WhatsApp
 * ou nas notas enquanto mexe no cardápio) e o CSV resolve no computador.
 */
export function FecharJornada({
  linhas,
  taxaAtual,
}: {
  linhas: LinhaPreco[];
  taxaAtual: number;
}) {
  const [copiado, setCopiado] = useState(false);

  if (linhas.length === 0) return null;

  const precisamSubir = linhas.filter((l) => l.abaixoDoPiso);

  function textoDaLista(): string {
    const cab = `Meus preços — taxa de entrega ${pct(taxaAtual)}\n`;
    const corpo = linhas
      .map((l) =>
        [
          `• ${l.nome}`,
          `   custo: ${brl(l.cmv)}`,
          `   preço hoje: ${brl(l.precoVenda)}`,
          `   preço mínimo: ${brl(l.precoMinimo)}${l.abaixoDoPiso ? "  <-- SUBIR" : ""}`,
          `   sobra: ${brl(l.lucroReal)}`,
        ].join("\n")
      )
      .join("\n\n");
    return `${cab}\n${corpo}\n\nCalculado no app do Casal do Açaí.`;
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoDaLista());
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador sem permissão de área de transferência (http, iOS antigo).
      window.prompt("Copie a lista abaixo:", textoDaLista());
    }
  }

  function baixarCsv() {
    const linhasCsv = [
      ["produto", "custo do copo", "preco hoje", "preco minimo", "quanto sobra", "margem %", "situacao"],
      ...linhas.map((l) => [
        l.nome,
        l.cmv.toFixed(2).replace(".", ","),
        l.precoVenda.toFixed(2).replace(".", ","),
        l.precoMinimo.toFixed(2).replace(".", ","),
        l.lucroReal.toFixed(2).replace(".", ","),
        l.margemPct != null ? l.margemPct.toFixed(1).replace(".", ",") : "",
        l.abaixoDoPiso ? "subir o preco" : "ok",
      ]),
    ];
    const csv = linhasCsv
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-precos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-8 rounded-2xl border-2 border-brand/25 bg-brand/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-deep">
        <PartyPopper size={20} className="text-brand" />
        Pronto! Agora é só ajustar seu cardápio
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-ink">
        Você chegou ao fim das 4 etapas. O número que importa agora é o{" "}
        <strong>preço mínimo</strong> de cada copo: é o valor abaixo do qual você trabalha de
        graça. Compare com o preço que está no seu cardápio hoje e corrija o que estiver abaixo.
      </p>

      {precisamSubir.length > 0 ? (
        <p className="mt-3 rounded-xl bg-loss-soft px-3 py-2 text-sm font-medium text-loss">
          {precisamSubir.length === 1
            ? "1 copo está abaixo do preço mínimo:"
            : `${precisamSubir.length} copos estão abaixo do preço mínimo:`}{" "}
          {precisamSubir.map((l) => l.nome).join(", ")}.
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-profit-soft px-3 py-2 text-sm font-medium text-profit">
          Todos os seus copos já estão acima do preço mínimo. 👏
        </p>
      )}

      <p className="mt-4 text-sm text-muted">
        Leve a lista com você para atualizar os preços na sua loja e nos aplicativos:
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={copiar}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid"
        >
          {copiado ? <ClipboardCheck size={16} /> : <Copy size={16} />}
          {copiado ? "Lista copiada!" : "Copiar lista"}
        </button>
        <button
          onClick={baixarCsv}
          className="flex items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-brand-deep ring-1 ring-line hover:bg-line/40"
        >
          <Download size={16} />
          Baixar planilha
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Quando o preço de um ingrediente mudar, atualize em &quot;Meus ingredientes&quot; — todos
        os copos se recalculam sozinhos e é só voltar aqui.
      </p>
    </section>
  );
}
