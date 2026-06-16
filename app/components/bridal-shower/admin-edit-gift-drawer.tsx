import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Loader2, Edit } from "lucide-react";
import { UpdateGiftSchema, type UpdateGiftInput, GIFT_CATEGORIES, type Gift } from "@/schemas/bridal-shower";
import { useEffect } from "react";

interface AdminEditGiftDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gift: Gift | null;
    updateGift: any;
}

export function AdminEditGiftDrawer({ open, onOpenChange, gift, updateGift }: AdminEditGiftDrawerProps) {
    const form = useForm<UpdateGiftInput>({
        resolver: zodResolver(UpdateGiftSchema),
        defaultValues: {
            id: gift?.id || "",
            item_name: gift?.item_name || "",
            category: (gift?.category as any) || "Outros",
            suggested_store: gift?.suggested_store || "",
            price_range: gift?.price_range || "",
            link: gift?.link || "",
            image_url: gift?.image_url || ""
        }
    });

    useEffect(() => {
        if (gift && form.getValues("id") !== gift.id) {
            form.reset({
                id: gift.id,
                item_name: gift.item_name,
                category: (gift.category as any) || "Outros",
                suggested_store: gift.suggested_store || "",
                price_range: gift.price_range || "",
                link: gift.link || "",
                image_url: gift.image_url || ""
            });
        }
    }, [gift, form]);

    const onSubmit = (data: UpdateGiftInput) => {
        updateGift.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100">
                            <Edit className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <DrawerTitle className="text-xl">Editar Presente</DrawerTitle>
                            <DrawerDescription>{gift?.item_name}</DrawerDescription>
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
                                        <Input className="h-11" {...field} />
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue />
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
                                            <Input className="h-11" {...field} />
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
                                            <Input className="h-11" {...field} />
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
                                        <Input className="h-11" {...field} />
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
                                        <Input className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateGift.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {updateGift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </Form>
            </DrawerContent>
        </Drawer>
    );
}
