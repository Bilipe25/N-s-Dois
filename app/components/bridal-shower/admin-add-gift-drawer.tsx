import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Loader2, Gift as GiftIcon } from "lucide-react";
import { CreateGiftSchema, type CreateGiftInput, GIFT_CATEGORIES } from "@/schemas/bridal-shower";

interface AdminAddGiftDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    createGift: any;
}

export function AdminAddGiftDrawer({ open, onOpenChange, createGift }: AdminAddGiftDrawerProps) {
    const form = useForm<CreateGiftInput>({
        resolver: zodResolver(CreateGiftSchema),
        defaultValues: {
            item_name: "",
            category: "Outros",
            suggested_store: "",
            price_range: "",
            link: "",
            image_url: ""
        }
    });

    const onSubmit = (data: CreateGiftInput) => {
        createGift.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-stone-100">
                            <GiftIcon className="h-6 w-6 text-stone-600" />
                        </div>
                        <div>
                            <DrawerTitle className="text-xl">Adicionar Presente</DrawerTitle>
                            <DrawerDescription>Adicione um novo item à lista</DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-4 space-y-4 overflow-y-auto">
                        <FormField
                            control={form.control}
                            name="item_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Item</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Liquidificador" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {GIFT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="suggested_store"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loja</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opcional" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_range"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: R$ 100" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Link do Produto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL da Imagem</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Opcional" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createGift.isPending} className="flex-1 bg-stone-900 hover:bg-stone-800">
                                {createGift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </Form>
            </DrawerContent>
        </Drawer>
    );
}
