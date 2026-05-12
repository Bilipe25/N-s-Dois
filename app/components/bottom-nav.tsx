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
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border/40 pb-safe pt-2 px-3 shadow-lg backdrop-blur-md z-[100]">
            <div className="flex justify-between items-center max-w-md mx-auto h-full">
                {navItems.map((item) => {
                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            prefetch="none"
                            end={item.href === "/"}
                            className={({ isActive }) => cn(
                                "flex min-h-12 min-w-[60px] flex-col items-center justify-center rounded-lg p-2 transition-colors relative cursor-pointer touch-manipulation sm:min-w-[64px]",
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
                                    <span className="max-w-[64px] truncate text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
