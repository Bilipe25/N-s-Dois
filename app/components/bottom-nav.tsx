import { NavLink, useLocation } from "react-router";
import { Home, Users, CheckSquare, Store, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    pendingTasksCount?: number;
}

export function BottomNav({ pendingTasksCount = 0 }: BottomNavProps) {
    const location = useLocation();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/checklist", icon: CheckSquare, label: "Tarefas", badge: pendingTasksCount },
        { href: "/suppliers", icon: Store, label: "Fornecedores" },
        { href: "/guests", icon: Users, label: "Convidados" },
        { href: "/budget", icon: DollarSign, label: "Gastos" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/40 pb-safe pt-2 px-4 shadow-lg z-[100]">
            <div className="flex justify-between items-center max-w-md mx-auto h-full">
                {navItems.map((item) => {
                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            prefetch="none"
                            end={item.href === "/"}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[64px] relative cursor-pointer touch-manipulation",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        <item.icon className={cn("h-6 w-6 mb-1", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.badge ? (
                                            <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-in zoom-in">
                                                {item.badge > 9 ? "9+" : item.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
