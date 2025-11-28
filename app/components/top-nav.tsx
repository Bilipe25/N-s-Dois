import { useLocation, useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Settings, Bell } from "lucide-react";

export function TopNav({ unreadCount = 0 }: { unreadCount?: number }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Mapa de títulos baseado na rota
    const getTitle = (pathname: string) => {
        if (pathname === "/") return "Nós Dois";
        if (pathname === "/settings") return "Configurações";
        if (pathname === "/notifications") return "Notificações";
        if (pathname === "/tasks" || pathname === "/checklist") return "Checklist";
        if (pathname.startsWith("/checklist/")) return "Editar Tarefa";
        if (pathname === "/suppliers") return "Fornecedores";
        if (pathname === "/suppliers/new") return "Novo Fornecedor";
        if (pathname.startsWith("/suppliers/")) return "Editar Fornecedor";
        if (pathname === "/guests") return "Lista de Convidados";
        if (pathname === "/guests/new") return "Novo Convidado";
        if (pathname.startsWith("/guests/")) return "Editar Convidado";
        if (pathname === "/budget") return "Orçamento";
        if (pathname.startsWith("/budget/")) return "Editar Item";
        if (pathname === "/groomsmen") return "Padrinhos";
        if (pathname === "/groomsmen/new") return "Novo Padrinho";
        if (pathname.startsWith("/groomsmen/")) return "Editar Padrinho";
        if (pathname === "/bridal-shower") return "Chá de Casa Nova";
        if (pathname === "/calendar") return "Agenda";
        if (pathname === "/inspirations") return "Inspirações";
        if (pathname === "/assets") return "Nossos Bens";
        return "Nós Dois";
    };

    const title = getTitle(location.pathname);
    const isHome = location.pathname === "/";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-14 flex items-center px-4 shadow-sm transition-all duration-300 justify-between">
            <div className="flex items-center gap-3">
                {!isHome ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-full">
                        <Heart className="h-4 w-4 text-primary fill-primary" />
                    </div>
                )}

                <h1 className={`font-serif text-lg font-medium text-foreground tracking-wide ${isHome ? 'text-xl' : ''}`}>
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary relative" asChild>
                    <Link to="/notifications">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </Link>
                </Button>
                {isHome && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" asChild>
                        <Link to="/settings">
                            <Settings className="h-5 w-5" />
                        </Link>
                    </Button>
                )}
            </div>
        </header>
    );
}
