import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface PixModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pixKey?: string;
}

export function PixModal({ open, onOpenChange, pixKey }: PixModalProps) {
    const [copied, setCopied] = useState(false);

    // Default Pix key if none provided (fallback)
    const finalPixKey = pixKey || "000.000.000-00"; // Placeholder

    const handleCopy = () => {
        navigator.clipboard.writeText(finalPixKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-serif text-2xl text-stone-800">Presente Virtual (Pix)</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Se preferir, você pode contribuir com qualquer valor para nos ajudar a montar nossa casinha! ❤️
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 w-full text-center space-y-2">
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Chave Pix</p>
                        <p className="text-lg font-mono font-medium text-stone-900 break-all select-all">
                            {finalPixKey}
                        </p>
                    </div>

                    <Button
                        onClick={handleCopy}
                        className={`w-full h-12 text-base transition-all ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-900 hover:bg-stone-800'}`}
                    >
                        {copied ? (
                            <>
                                <Check className="mr-2 h-5 w-5" /> Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-5 w-5" /> Copiar Chave Pix
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
