import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Trash2, Pencil, Users, Phone, Mail, Heart, UploadCloud, Loader2 } from "lucide-react";
import type { Route } from "./+types/groomsmen";
import { useGroomsmen, useDeleteGroomsman, useCreateGroomsman } from "@/hooks/useGroomsmen";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateGroomsmanSchema, type CreateGroomsmanInput, type Groomsman } from "@/schemas/groomsmen";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Padrinhos - Nós Dois" }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
    const supabase = createClient(request);
    const { data: groomsmen, error } = await supabase
        .from("groomsmen")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Error fetching groomsmen:", error);
        return { groomsmen: [] };
    }

    return { groomsmen };
};

export default function Groomsmen() {
    const { groomsmen: initialData } = useLoaderData<typeof loader>();
    const { data: groomsmen = [] } = useGroomsmen(initialData);
    const { mutate: deleteGroomsman } = useDeleteGroomsman();
    const { mutate: createGroomsman, isPending: isCreating } = useCreateGroomsman("Gabriel");

    const [roleFilter, setRoleFilter] = useState<string>("todos");
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Groomsman | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const roles = [
        { id: "todos", label: "Todos" },
        { id: "padrinho", label: "Padrinhos" },
        { id: "madrinha", label: "Madrinhas" },
        { id: "daminha", label: "Daminhas" },
        { id: "pajem", label: "Pajens" },
    ];

    const form = useForm<CreateGroomsmanInput>({
        resolver: zodResolver(CreateGroomsmanSchema),
        defaultValues: {
            role: "padrinho",
            side: "noivo"
        }
    });

    const filterGroomsmen = (side: string) => {
        return groomsmen.filter((person) => {
            const matchesSide = person.side === side;
            const matchesRole = roleFilter === "todos" ? true : person.role === roleFilter;
            return matchesSide && matchesRole;
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja remover?")) {
            deleteGroomsman(id);
            setSelectedPerson(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            form.setValue("photo", file);
        } else {
            setPreviewUrl(null);
            form.setValue("photo", undefined);
        }
    };

    const onSubmit = (data: CreateGroomsmanInput) => {
        createGroomsman(data, {
            onSuccess: () => {
                setShowAddDrawer(false);
                form.reset();
                setPreviewUrl(null);
            }
        });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "padrinho": return "bg-blue-100 text-blue-700";
            case "madrinha": return "bg-pink-100 text-pink-700";
            case "daminha": return "bg-purple-100 text-purple-700";
            case "pajem": return "bg-green-100 text-green-700";
            default: return "bg-stone-100 text-stone-700";
        }
    };

    const renderList = (side: string) => {
        const list = filterGroomsmen(side);

        if (list.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-stone-300" />
                    </div>
                    <p className="text-sm">Ninguém cadastrado com este filtro.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-3">
                {list.map((person) => (
                    <Card
                        key={person.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-stone-200"
                        onClick={() => setSelectedPerson(person)}
                    >
                        <div className="aspect-square bg-stone-100 flex items-center justify-center relative">
                            {person.photo_url ? (
                                <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-stone-300">
                                    <User className="h-16 w-16" />
                                </div>
                            )}
                            <Badge className={`absolute top-2 right-2 ${getRoleColor(person.role)} text-[10px] border-0`}>
                                {person.role}
                            </Badge>
                        </div>
                        <CardContent className="p-3 text-center bg-white">
                            <h3 className="font-medium text-sm truncate text-stone-800">{person.name}</h3>
                            <p className="text-[10px] text-stone-400 capitalize">Time {person.side === "noivo" ? "do Noivo" : "da Noiva"}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // Contagem por lado
    const noivaCt = groomsmen.filter(p => p.side === "noiva").length;
    const noivoCt = groomsmen.filter(p => p.side === "noivo").length;

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header Stats */}
            <div className="flex justify-between items-center bg-white rounded-xl p-4 border border-stone-200">
                <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-pink-500">{noivaCt}</p>
                    <p className="text-xs text-stone-500">Time Noiva</p>
                </div>
                <div className="h-10 w-px bg-stone-200" />
                <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-blue-500">{noivoCt}</p>
                    <p className="text-xs text-stone-500">Time Noivo</p>
                </div>
                <div className="h-10 w-px bg-stone-200" />
                <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-stone-800">{groomsmen.length}</p>
                    <p className="text-xs text-stone-500">Total</p>
                </div>
            </div>

            {/* Filtro de Função */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {roles.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => setRoleFilter(role.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${roleFilter === role.id
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                            }`}
                    >
                        {role.label}
                    </button>
                ))}
            </div>

            <Tabs defaultValue="noiva" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-stone-100">
                    <TabsTrigger value="noiva" className="data-[state=active]:bg-white">
                        <Heart className="h-4 w-4 mr-2 text-pink-500" />
                        Time da Noiva
                    </TabsTrigger>
                    <TabsTrigger value="noivo" className="data-[state=active]:bg-white">
                        <Heart className="h-4 w-4 mr-2 text-blue-500" />
                        Time do Noivo
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="noiva">
                    {renderList("noiva")}
                </TabsContent>
                <TabsContent value="noivo">
                    {renderList("noivo")}
                </TabsContent>
            </Tabs>

            {/* FAB */}
            {!showAddDrawer && !selectedPerson && (
                <div className="fixed bottom-24 right-6 z-40">
                    <Button
                        onClick={() => setShowAddDrawer(true)}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-stone-900 hover:bg-stone-800 text-white transition-transform hover:scale-105"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Drawer de Adicionar Padrinho */}
            <Drawer open={showAddDrawer} onOpenChange={setShowAddDrawer}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader className="text-left border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl">Novo Padrinho/Madrinha</DrawerTitle>
                                <DrawerDescription>Adicione alguém especial ao cortejo</DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Nome</label>
                            <Input {...form.register("name")} placeholder="Ex: João Silva" className="h-11" />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* Role & Side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Função</label>
                                <Select
                                    onValueChange={(val) => form.setValue("role", val as any)}
                                    defaultValue={form.getValues("role")}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="padrinho">Padrinho</SelectItem>
                                        <SelectItem value="madrinha">Madrinha</SelectItem>
                                        <SelectItem value="daminha">Daminha</SelectItem>
                                        <SelectItem value="pajem">Pajem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700">Lado</label>
                                <Select
                                    onValueChange={(val) => form.setValue("side", val as any)}
                                    defaultValue={form.getValues("side")}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="noivo">Do Noivo</SelectItem>
                                        <SelectItem value="noiva">Da Noiva</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Foto <span className="text-stone-400">(opcional)</span></label>
                            <div className="relative h-32 w-full bg-stone-50 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors group cursor-pointer">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-stone-400 group-hover:text-stone-600">
                                        <UploadCloud className="h-8 w-8" />
                                        <span className="text-xs">Clique para selecionar</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddDrawer(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isCreating} className="flex-1 bg-stone-900 hover:bg-stone-800">
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </DrawerContent>
            </Drawer>

            {/* Drawer de Detalhes */}
            <Drawer open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
                <DrawerContent className="max-h-[90vh]">
                    {selectedPerson && (
                        <>
                            <DrawerHeader className="text-left border-b pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-stone-200">
                                        {selectedPerson.photo_url ? (
                                            <img src={selectedPerson.photo_url} alt={selectedPerson.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-8 w-8 text-stone-400" />
                                        )}
                                    </div>
                                    <div>
                                        <DrawerTitle className="text-xl">{selectedPerson.name}</DrawerTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={`${getRoleColor(selectedPerson.role)} border-0 text-xs`}>
                                                {selectedPerson.role}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {selectedPerson.side === "noivo" ? "Time do Noivo" : "Time da Noiva"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="p-4 space-y-4">
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-stone-50 rounded-xl p-4">
                                        <p className="text-xs text-stone-500 mb-1">Função</p>
                                        <p className="font-medium text-stone-800 capitalize">{selectedPerson.role}</p>
                                    </div>
                                    <div className="bg-stone-50 rounded-xl p-4">
                                        <p className="text-xs text-stone-500 mb-1">Lado</p>
                                        <p className="font-medium text-stone-800">{selectedPerson.side === "noivo" ? "Noivo" : "Noiva"}</p>
                                    </div>
                                </div>

                                {/* Photo */}
                                {selectedPerson.photo_url && (
                                    <div className="rounded-xl overflow-hidden aspect-video">
                                        <img src={selectedPerson.photo_url} alt={selectedPerson.name} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* Created Date */}
                                <p className="text-xs text-stone-400">
                                    Adicionado em {selectedPerson.created_at ? new Date(selectedPerson.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'data desconhecida'}
                                </p>
                            </div>

                            <DrawerFooter className="flex-row gap-2 border-t pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => selectedPerson.id && handleDelete(selectedPerson.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </Button>
                                <Button asChild className="flex-1 bg-stone-900 hover:bg-stone-800">
                                    <Link to={`/groomsmen/${selectedPerson.id}`}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Link>
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}

