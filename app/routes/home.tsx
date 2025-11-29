import { Link, useLoaderData } from "react-router";
import { createClient } from "@/lib/supabase";
import { getSession } from "@/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, CheckSquare, Users, DollarSign, Store, Gift, User, Settings, Package, Calendar } from "lucide-react";
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

  // Fetch checklist counts
  const { count: pendingTasksCount } = await supabase
    .from("checklist_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendente");

  const { count: totalTasksCount } = await supabase
    .from("checklist_items")
    .select("*", { count: "exact", head: true });

  // Fetch guests counts
  const { data: allGuests } = await supabase
    .from("guests")
    .select("adults_count, children_count, rsvp_status");

  const confirmedGuestsCount = allGuests
    ?.filter(g => g.rsvp_status === "confirmado")
    .reduce((acc, guest) => acc + (guest.adults_count || 0) + (guest.children_count || 0), 0) || 0;

  const totalGuestsCount = allGuests
    ?.reduce((acc, guest) => acc + (guest.adults_count || 0) + (guest.children_count || 0), 0) || 0;

  // Fetch budget
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

  return {
    user,
    config,
    tasks: { pending: pendingTasksCount || 0, total: totalTasksCount || 0 },
    guests: { confirmed: confirmedGuestsCount, total: totalGuestsCount },
    budget: { paid: totalPaid, estimated: totalEstimated },
    nextTask
  };
};

export default function Home() {
  const { user, config, tasks, guests, budget, nextTask } = useLoaderData<typeof loader>();

  // Data do casamento da configuração ou fallback
  const weddingDate = config?.wedding_date ? new Date(config.wedding_date) : new Date("2025-09-20T16:00:00");
  const today = new Date();
  const diffTime = weddingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Cálculos de progresso
  const tasksProgress = tasks.total > 0 ? Math.round(((tasks.total - tasks.pending) / tasks.total) * 100) : 0;
  const budgetProgress = budget.estimated > 0 ? Math.round((budget.paid / budget.estimated) * 100) : 0;
  const guestsProgress = guests.total > 0 ? Math.round((guests.confirmed / guests.total) * 100) : 0;

  return (
    <div className="p-4 space-y-6 pb-20 relative">
      {/* Background Image se existir */}
      {config?.home_photo_url && (
        <div className="fixed inset-0 z-[-1]">
          <img src={config.home_photo_url} alt="Background" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background/90" />
        </div>
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-primary capitalize">Olá, {user}</h1>
          <p className="text-muted-foreground text-sm">
            {diffDays > 0 ? `Faltam ${diffDays} dias para o grande dia!` : "O grande dia chegou!"}
          </p>
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
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
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
        <Link to="/assets" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Package className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Nossos Bens</span>
        </Link>
        <Link to="/calendar" className="flex flex-col items-center gap-2 group">
          <div className="bg-white border border-primary/20 p-3 rounded-2xl text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
            <Calendar className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Agenda</span>
        </Link>
      </div>

      {/* Progresso Geral */}
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Progresso</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="font-medium">Checklist</span>
              </div>
              <span className="text-muted-foreground">{tasksProgress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${tasksProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{tasks.total - tasks.pending} de {tasks.total} tarefas concluídas</p>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium">Orçamento</span>
              </div>
              <span className="text-muted-foreground">{budgetProgress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${budgetProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {budget.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} pagos
            </p>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Convidados</span>
              </div>
              <span className="text-muted-foreground">{guestsProgress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${guestsProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{guests.confirmed} de {guests.total} confirmados</p>
          </div>
        </div>
      </div>

      {/* Timeline Visual */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Linha do Tempo</h2>
        <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-2">
          {/* Hoje */}
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Hoje</span>
              <span className="text-xs text-muted-foreground capitalize">
                {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>

          {/* Próxima Tarefa (se existir) */}
          {nextTask && (
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-muted bg-muted" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{nextTask.title}</span>
                <span className="text-xs text-muted-foreground">Próxima Tarefa</span>
              </div>
            </div>
          )}

          {/* Casamento */}
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-primary">O Grande Dia</span>
              <span className="text-xs text-muted-foreground capitalize">
                {weddingDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>



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
                + {tasks.pending > 1 ? tasks.pending - 1 : 0} outras pendentes
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Tudo em dia! 🎉</div>
          )}
        </CardContent>
      </Card >
    </div >
  );
}
