import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Loader2, User } from "lucide-react";
import { CreateGuestSchema, type CreateGuestInput } from "@/schemas/bridal-shower";

interface AdminAddGuestDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    createGuest: any;
}

export function AdminAddGuestDrawer({ open, onOpenChange, createGuest }: AdminAddGuestDrawerProps) {
    const form = useForm<CreateGuestInput>({
        resolver: zodResolver(CreateGuestSchema),
        defaultValues: {
            name: "",
            phone: ""
        }
    });

    const onSubmit = (data: CreateGuestInput) => {
        createGuest.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-rose-100">
                            <User className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <DrawerTitle className="text-xl">Adicionar Convidado</DrawerTitle>
                            <DrawerDescription>Adicione um novo convidado à lista</DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome completo" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Opcional" className="h-11" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DrawerFooter className="flex-row gap-2 px-0 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createGuest.isPending} className="flex-1 bg-rose-500 hover:bg-rose-600">
                                {createGuest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                            </Button>
                        </DrawerFooter>
                    </form>
                </Form>
            </DrawerContent>
        </Drawer>
    );
}
