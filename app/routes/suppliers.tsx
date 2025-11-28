import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, DollarSign, FileText } from "lucide-react";
import type { Route } from "./+types/suppliers";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Fornecedores - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: suppliers, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching suppliers:", error);
        return { suppliers: [] };
    }

    return { suppliers };
};

export default function Suppliers() {
    const { suppliers } = useLoaderData<typeof loader>();
    const [filter, setFilter] = useState<"todos" | "contratado" | "pendente">("todos");

    const filteredSuppliers = suppliers.filter((s: any) => {
        if (filter === "todos") return true;
        if (filter === "pendente") return s.status !== "contratado" && s.status !== "pago";
        return s.status === filter || (filter === "contratado" && s.status === "pago");
    });

    return (
        <div className="p-4 space-y-6 pb-20">
            <header className="flex justify-end items-center">
                <Button size="icon" className="rounded-full h-10 w-10 shadow-md" asChild>
                    <Link to="/suppliers/new">
                        <Plus className="h-6 w-6" />
                    </Link>
                </Button>
            </header>

            {/* Filtros */}
            <div className="flex gap-2">
                {["todos", "contratado", "pendente"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filteredSuppliers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhum fornecedor encontrado.</p>
                    {filter === "todos" && <p className="text-sm">Clique no + para adicionar.</p>}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSuppliers.map((supplier: any) => (
                        <Card key={supplier.id} className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all">
                            {supplier.photo_url && (
                                <div className="h-32 w-full overflow-hidden relative">
                                    <img src={supplier.photo_url} alt={supplier.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-2 left-3 text-white font-medium text-lg drop-shadow-md">
                                        {supplier.name}
                                    </div>
                                </div>
                            )}
                            <CardHeader className={`${supplier.photo_url ? 'pt-2' : 'pb-2'}`}>
                                <div className="flex justify-between items-start">
                                    {!supplier.photo_url && (
                                        <div>
                                            <span className="text-xs font-medium text-primary uppercase tracking-wider">{supplier.category}</span>
                                            <CardTitle className="text-lg">{supplier.name}</CardTitle>
                                        </div>
                                    )}
                                    {supplier.photo_url && (
                                        <span className="text-xs font-medium text-primary uppercase tracking-wider">{supplier.category}</span>
                                    )}
                                    <Badge variant={
                                        supplier.status === 'contratado' ? 'default' :
                                            supplier.status === 'pago' ? 'secondary' :
                                                'outline'
                                    } className="capitalize">
                                        {supplier.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {supplier.price && (
                                    <div className="flex items-center text-muted-foreground">
                                        <DollarSign className="h-4 w-4 mr-2 text-primary" />
                                        {Number(supplier.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                )}
                                {supplier.contact_info && (
                                    <div className="flex items-center text-muted-foreground">
                                        <Phone className="h-4 w-4 mr-2 text-primary" />
                                        {supplier.contact_info}
                                    </div>
                                )}
                                {supplier.contract_url && (
                                    <div className="pt-2">
                                        <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                                            <a href={supplier.contract_url} target="_blank" rel="noopener noreferrer">
                                                <FileText className="h-3 w-3 mr-2" /> Ver Contrato
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
