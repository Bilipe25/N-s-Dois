import { Link, useLocation } from "react-router";
import { Home, Users, CheckSquare, Store, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const location = useLocation();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/checklist", icon: CheckSquare, label: "Tarefas" },
        { href: "/suppliers", icon: Store, label: "Fornecedores" },
        { href: "/guests", icon: Users, label: "Convidados" },
        { href: "/budget", icon: DollarSign, label: "Gastos" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/40 pb-safe pt-2 px-4 shadow-lg z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[64px]",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6 mb-1", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
