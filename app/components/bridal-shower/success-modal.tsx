import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isMobile: boolean;
    icon: React.ReactNode;
    iconBgClass?: string;
    title: string;
    description: React.ReactNode;
    buttonClassName?: string;
}

/**
 * Modal de sucesso responsivo: usa Drawer no mobile e Dialog no desktop.
 * Resolve o problema de inconsistência onde modais de sucesso eram sempre Dialog.
 */
export function SuccessModal({
    open,
    onOpenChange,
    isMobile,
    icon,
    iconBgClass = "bg-green-100",
    title,
    description,
    buttonClassName = "bg-stone-900 hover:bg-stone-800",
}: SuccessModalProps) {
    const content = (
        <div className="text-center px-4 py-6">
            <div className="flex justify-center mb-4">
                <div className={`h-20 w-20 ${iconBgClass} rounded-full flex items-center justify-center animate-in zoom-in duration-300`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-2xl font-serif text-stone-800 mb-2">{title}</h3>
            <div className="text-base text-stone-600 mb-6">{description}</div>
            <Button
                onClick={() => onOpenChange(false)}
                className={`w-full sm:w-auto ${buttonClassName} text-white`}
            >
                Fechar
            </Button>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {content}
            </DialogContent>
        </Dialog>
    );
}
