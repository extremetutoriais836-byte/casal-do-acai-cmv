import type { SupabaseClient } from "@supabase/supabase-js";
import { paraDigitacao, unidadeDigitacao } from "./format";

/**
 * Leitura das fichas com seus ingredientes — usada pela tela de montagem
 * (/fichas) e pela de consulta (/ficha-tecnica). Ficando num lugar só, as
 * duas telas não divergem quando a regra mudar.
 */

export interface InsumoRef {
  id: string;
  nome: string;
  unidade_medida: string;
  custo_por_unidade: number;
}

export interface ItemFicha {
  insumo_id: string;
  quantidade_utilizada: number;
}

export interface FichaCompleta {
  id: string;
  nome_prato: string;
  preco_venda: number;
  itens: ItemFicha[];
}

export interface LinhaIngrediente {
  insumoId: string;
  nome: string;
  /** Quantidade na unidade em que o usuário digita (g/ml/un). */
  quantidade: number;
  unidade: string;
  /** Custo de UMA unidade digitada (ex.: 1 g), já convertido. */
  custoUnitario: number;
  /** Quanto este ingrediente custa neste copo. */
  custoNoCopo: number;
  /** Participação no custo total do copo (%). */
  pctDoCusto: number;
  /** Insumo apagado ou fora da lista — não deveria acontecer. */
  orfao: boolean;
}

export async function carregarFichasCompletas(
  supabase: SupabaseClient,
  restauranteId: string
): Promise<{ insumos: InsumoRef[]; fichas: FichaCompleta[] }> {
  const [{ data: ins }, { data: fic }] = await Promise.all([
    supabase
      .from("insumos")
      .select("id, nome, unidade_medida, custo_por_unidade")
      .eq("restaurante_id", restauranteId)
      .order("nome"),
    supabase
      .from("fichas_tecnicas")
      .select("id, nome_prato, preco_venda")
      .eq("restaurante_id", restauranteId)
      .order("nome_prato"),
  ]);

  const insumos = (ins as InsumoRef[]) ?? [];
  const base = (fic as Omit<FichaCompleta, "itens">[]) ?? [];
  const ids = base.map((f) => f.id);

  const porFicha = new Map<string, ItemFicha[]>();
  if (ids.length > 0) {
    const { data: itens } = await supabase
      .from("ingredientes_ficha")
      .select("ficha_tecnica_id, insumo_id, quantidade_utilizada")
      .in("ficha_tecnica_id", ids);
    for (const it of (itens as (ItemFicha & { ficha_tecnica_id: string })[]) ?? []) {
      const lista = porFicha.get(it.ficha_tecnica_id);
      if (lista) lista.push(it);
      else porFicha.set(it.ficha_tecnica_id, [it]);
    }
  }

  return {
    insumos,
    fichas: base.map((f) => ({ ...f, itens: porFicha.get(f.id) ?? [] })),
  };
}

export function indexarInsumos(insumos: InsumoRef[]): Map<string, InsumoRef> {
  return new Map(insumos.map((i) => [i.id, i]));
}

/** CMV = Σ (quantidade armazenada × custo por unidade). Mesma conta da view. */
export function cmvDaFicha(f: FichaCompleta, porId: Map<string, InsumoRef>): number {
  return f.itens.reduce((acc, it) => {
    const ins = porId.get(it.insumo_id);
    return acc + (ins ? it.quantidade_utilizada * ins.custo_por_unidade : 0);
  }, 0);
}

/**
 * Abre o custo do copo ingrediente a ingrediente, já na unidade que o dono
 * entende (gramas, ml, unidades) e com o peso de cada um no total — é o que
 * mostra onde vale negociar com o fornecedor.
 * Ordenado do mais caro para o mais barato, de propósito.
 */
export function detalharIngredientes(
  f: FichaCompleta,
  porId: Map<string, InsumoRef>
): LinhaIngrediente[] {
  const total = cmvDaFicha(f, porId);

  return f.itens
    .map((it) => {
      const ins = porId.get(it.insumo_id);
      if (!ins) {
        return {
          insumoId: it.insumo_id,
          nome: "Ingrediente removido",
          quantidade: it.quantidade_utilizada,
          unidade: "",
          custoUnitario: 0,
          custoNoCopo: 0,
          pctDoCusto: 0,
          orfao: true,
        };
      }
      const custoNoCopo = it.quantidade_utilizada * ins.custo_por_unidade;
      const quantidade = paraDigitacao(it.quantidade_utilizada, ins.unidade_medida);
      return {
        insumoId: ins.id,
        nome: ins.nome,
        quantidade,
        unidade: unidadeDigitacao(ins.unidade_medida),
        custoUnitario: quantidade > 0 ? custoNoCopo / quantidade : 0,
        custoNoCopo,
        pctDoCusto: total > 0 ? (custoNoCopo / total) * 100 : 0,
        orfao: false,
      };
    })
    .sort((a, b) => b.custoNoCopo - a.custoNoCopo);
}
