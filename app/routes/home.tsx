import { Link, useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckSquare, Users, DollarSign, Store, Gift, User, Settings } from "lucide-react";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Dashboard - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user") || "Amor";
  const supabase = createClient(request);

  // Fetch config
  const { data: config } = await supabase.from("app_config").select("*").single();

  // Fetch counts
  const { count: tasksCount } = await supabase
    .from("checklist_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendente");

  const { count: guestsCount } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("confirmed", true);

  const { data: budgetItems } = await supabase
    .from("budget_items")
    .select("paid_value, estimated_value");

  const totalPaid = budgetItems?.reduce((acc, item) => acc + (Number(item.paid_value) || 0), 0) || 0;
  const totalEstimated = budgetItems?.reduce((acc, item) => acc + (Number(item.estimated_value) || 0), 0) || 0;

  // Fetch next task
  const { data: nextTask } = await supabase
    .from("checklist_items")
    .select("title")
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return { user, config, tasksCount: tasksCount || 0, guestsCount: guestsCount || 0, totalPaid, totalEstimated, nextTask };
};

export default function Home() {
  const { user, config, tasksCount, guestsCount, totalPaid, totalEstimated, nextTask } = useLoaderData<typeof loader>();

  // Data do casamento da configuração ou fallback
  const weddingDate = config?.wedding_date ? new Date(config.wedding_date) : new Date("2025-09-20T16:00:00");
  const today = new Date();
  const diffTime = weddingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 space-y-6 pb-20 relative">
      {/* Background Image se existir */}
      {config?.home_photo_url && (
        <div className="fixed inset-0 z-[-1] opacity-10">
          <img src={config.home_photo_url} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-primary capitalize">Olá, {user}</h1>
          <p className="text-muted-foreground text-sm">
            {diffDays > 0 ? `Faltam ${diffDays} dias para o grande dia!` : "O grande dia chegou!"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings" className="bg-secondary/50 p-2 rounded-full text-muted-foreground hover:text-primary transition-colors">
            <Settings className="w-6 h-6" />
          </Link>
          <div className="bg-primary/10 p-2 rounded-full">
            <Heart className="text-primary w-6 h-6 fill-primary" />
          </div>
        </div>
      </header>

      {/* Contagem Regressiva Destaque */}
      <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2 relative z-10">
          <span className="text-xs uppercase tracking-widest opacity-90 font-medium">Contagem Regressiva</span>
          <div className="text-6xl font-serif font-bold tracking-tighter">{Math.max(0, diffDays)}</div>
          <span className="text-sm opacity-90">Dias Restantes</span>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Link to="/checklist" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <CheckSquare className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Tarefas</span>
        </Link>
        <Link to="/guests" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Convidados</span>
        </Link>
        <Link to="/budget" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <DollarSign className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Gastos</span>
        </Link>
        <Link to="/suppliers" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Store className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Fornecedores</span>
        </Link>
        <Link to="/groomsmen" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <User className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Padrinhos</span>
        </Link>
        <Link to="/bridal-shower" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Gift className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Chá</span>
        </Link>
        <Link to="/inspirations" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Inspirações</span>
        </Link>
      </div>

      {/* Resumo Cards */}
      <div className="grid gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Tarefa</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextTask ? (
              <>
                <div className="text-lg font-bold truncate">{nextTask.title}</div>
                <p className="text-xs text-muted-foreground">
                  + {tasksCount > 1 ? tasksCount - 1 : 0} outras pendentes
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Tudo em dia! 🎉</div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium">Confirmados</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{guestsCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium">Pago</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">
                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
