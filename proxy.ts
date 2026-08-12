import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (antigo `middleware` — renomeado no Next 16). Protege as rotas do
 * painel e renova a sessão do Supabase a cada request.
 *  - Sem sessão fora das telas de auth -> /login
 *  - Com sessão nas telas de auth       -> /dashboard
 * As rotas /api tratam a própria autenticação (não redirecionam aqui).
 * /admin fica protegido por ser rota comum (exige sessão); o e-mail é
 * conferido no route handler /api/admin (ADMIN_EMAILS).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * O proxy roda ANTES de toda página: se ele lançar exceção, o site inteiro
   * responde "Internal Server Error" — inclusive o /login, o que impede até
   * de diagnosticar. `createServerClient` lança quando as chaves faltam, então
   * nada aqui pode ficar fora de um try/catch.
   *
   * Sem configuração válida ninguém consegue autenticar, logo o correto é
   * tratar como "sem usuário" (falha FECHADA) e mandar para /login — que
   * renderiza e mostra o erro de forma legível.
   */
  let user = null;

  if (supabaseUrl && supabaseAnon) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      // getUser() revalida o token no servidor (não confie só no cookie).
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("[proxy] Falha ao validar a sessão no Supabase:", e);
      user = null;
    }
  } else {
    console.error(
      "[proxy] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. " +
        "Configure as Environment Variables e faça um NOVO deploy (variáveis " +
        "NEXT_PUBLIC_* são embutidas no bundle durante o build)."
    );
  }

  const isAuthPage = path.startsWith("/login") || path.startsWith("/cadastro");

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Roda em tudo, exceto assets estáticos, ícones e as rotas /api
  // (que autenticam sozinhas).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.json|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
