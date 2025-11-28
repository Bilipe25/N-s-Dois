import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

export function TopNav() {
    const location = useLocation();
    const navigate = useNavigate();

    // Mapa de títulos baseado na rota
    const getTitle = (pathname: string) => {
        if (pathname === "/") return "Nós Dois";
        if (pathname === "/settings") return "Configurações";
        if (pathname === "/tasks" || pathname === "/checklist") return "Checklist";
        if (pathname === "/suppliers") return "Fornecedores";
        if (pathname.startsWith("/suppliers/new")) return "Novo Fornecedor";
        if (pathname === "/guests") return "Lista de Convidados";
        if (pathname === "/budget") return "Orçamento";
        if (pathname === "/groomsmen") return "Padrinhos";
        if (pathname.startsWith("/groomsmen/new")) return "Novo Padrinho";
        if (pathname === "/bridal-shower") return "Chá de Casa Nova";
        if (pathname === "/inspirations") return "Inspirações";
        return "Nós Dois";
    };

    const title = getTitle(location.pathname);
    const isHome = location.pathname === "/";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-14 flex items-center px-4 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3 w-full">
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
        </header>
    );
}
