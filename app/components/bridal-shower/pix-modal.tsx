import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";

interface PixModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pixKey?: string | null;
    isMobile?: boolean;
}

export function PixModal({ open, onOpenChange, pixKey, isMobile = false }: PixModalProps) {
    const [copied, setCopied] = useState(false);
    const hasPixKey = Boolean(pixKey && pixKey.trim().length > 0);

    const handleCopy = () => {
        if (!hasPixKey || !pixKey) return;
        navigator.clipboard.writeText(pixKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            // Fallback for insecure contexts / older browsers
            try {
                const textArea = document.createElement("textarea");
                textArea.value = pixKey;
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                prompt("Copie a chave Pix:", pixKey);
            }
        });
    };

    const content = (
        <div className="flex flex-col items-center gap-6 py-4">
            {hasPixKey && pixKey ? (
                <>
                    <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                        <QRCode
                            value={pixKey}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#1c1917"
                            level="M"
                        />
                    </div>

                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 w-full text-center space-y-2">
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Chave Pix</p>
                        <p className="text-lg font-mono font-medium text-stone-900 break-all select-all">
                            {pixKey}
                        </p>
                    </div>

                    <Button
                        onClick={handleCopy}
                        className={`w-full h-12 text-base transition-all ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-stone-900 hover:bg-stone-800'}`}
                    >
                        {copied ? (
                            <><Check className="mr-2 h-5 w-5" /> Copiado!</>
                        ) : (
                            <><Copy className="mr-2 h-5 w-5" /> Copiar Chave Pix</>
                        )}
                    </Button>
                </>
            ) : (
                <div className="text-center py-4 space-y-3">
                    <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-stone-400" />
                    </div>
                    <p className="text-stone-500 text-sm">
                        A chave Pix ainda não foi configurada. Entre em contato com os noivos.
                    </p>
                </div>
            )}
        </div>
    );

    const title = "Presente Virtual (Pix)";
    const description = "Se preferir, você pode contribuir com qualquer valor para nos ajudar a montar nossa casinha! ❤️";

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-center font-serif text-2xl text-stone-800">{title}</DrawerTitle>
                        <DrawerDescription className="text-center">{description}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-6">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-serif text-2xl text-stone-800">{title}</DialogTitle>
                    <DialogDescription className="text-center pt-2">{description}</DialogDescription>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}
