import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from "lucide-react";
import type { Route } from "./+types/groomsmen.new";
import { CreateGroomsmanSchema, type CreateGroomsmanInput } from "@/schemas/groomsmen";
import { useCreateGroomsman } from "@/hooks/useGroomsmen";

export const meta: Route.MetaFunction = () => {
    return [{ title: "Novo Padrinho - Nós Dois" }];
};

export default function NewGroomsman() {
    const navigate = useNavigate();
    const { mutate: createGroomsman, isPending } = useCreateGroomsman("Gabriel"); // Hardcoded user for now, or get from context
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateGroomsmanInput>({
        resolver: zodResolver(CreateGroomsmanSchema),
        defaultValues: {
            role: "padrinho",
            side: "noivo"
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setValue("photo", file);
        } else {
            setPreviewUrl(null);
            setValue("photo", undefined);
        }
    };

    const onSubmit = (data: CreateGroomsmanInput) => {
        createGroomsman(data, {
            onSuccess: () => {
                navigate("/groomsmen");
            }
        });
    };

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                placeholder="Ex: João Silva"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Função</Label>
                                <Select
                                    onValueChange={(val) => setValue("role", val as any)}
                                    defaultValue={watch("role")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="padrinho">Padrinho</SelectItem>
                                        <SelectItem value="madrinha">Madrinha</SelectItem>
                                        <SelectItem value="daminha">Daminha</SelectItem>
                                        <SelectItem value="pajem">Pajem</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-xs text-destructive">{errors.role.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="side">Lado</Label>
                                <Select
                                    onValueChange={(val) => setValue("side", val as any)}
                                    defaultValue={watch("side")}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="noivo">Do Noivo</SelectItem>
                                        <SelectItem value="noiva">Da Noiva</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.side && (
                                    <p className="text-xs text-destructive">{errors.side.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="photo">Foto (Opcional)</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden min-h-[150px] flex items-center justify-center">
                                <Input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <UploadCloud className="h-8 w-8" />
                                        <span className="text-xs">Toque para selecionar uma foto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Salvando..." : "Adicionar Padrinho"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
