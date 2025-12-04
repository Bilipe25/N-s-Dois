import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { ASSET_CATEGORIES } from "@/schemas/assets";
import { useCreateAsset } from "@/hooks/useAssets";

interface AddAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
    const { mutate: createAsset, isPending } = useCreateAsset();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "Outros" as typeof ASSET_CATEGORIES[number],
        value: "",
        notes: ""
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleClearImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) return;

        const data = new FormData();
        data.append("name", formData.name);
        data.append("category", formData.category);
        data.append("value", formData.value || "0");
        data.append("notes", formData.notes);
        if (selectedFile) {
            data.append("photo", selectedFile);
        }

        createAsset(data, {
            onSuccess: () => {
                // Reset form
                setFormData({ name: "", category: "Outros", value: "", notes: "" });
                handleClearImage();
                onOpenChange(false);
            }
        });
    };

    const handleClose = () => {
        if (!isPending) {
            setFormData({ name: "", category: "Outros", value: "", notes: "" });
            handleClearImage();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Bem</DialogTitle>
                    <DialogDescription>
                        Cadastre um item do seu patrimônio
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Foto */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div
                                className="h-24 w-24 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                )}
                            </div>
                            {previewUrl && (
                                <button
                                    type="button"
                                    onClick={handleClearImage}
                                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Item *</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Geladeira Brastemp"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Categoria e Valor */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as typeof ASSET_CATEGORIES[number] }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASSET_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor (R$)</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={formData.value}
                                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            placeholder="Notas adicionais (opcional)"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || !formData.name.trim()}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Adicionar"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
