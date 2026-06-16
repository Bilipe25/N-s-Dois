import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import type { Config } from "@/schemas/bridal-shower";

interface ContactSectionProps {
    config?: Config;
}

export function ContactSection({ config }: ContactSectionProps) {
    if (!config?.contact_phone_gabriel && !config?.contact_phone_raabe) {
        return null;
    }

    return (
        <section className="py-12 border-t border-stone-200">
            <div className="text-center space-y-8">
                <h2 className="text-2xl font-serif text-stone-800">Ficou com alguma dúvida?</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {config?.contact_phone_gabriel && (
                        <Button variant="outline" className="h-12 rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" asChild>
                            <a href={`https://wa.me/${config.contact_phone_gabriel}`} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-5 w-5" /> Falar com Gabriel
                            </a>
                        </Button>
                    )}
                    {config?.contact_phone_raabe && (
                        <Button variant="outline" className="h-12 rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" asChild>
                            <a href={`https://wa.me/${config.contact_phone_raabe}`} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-5 w-5" /> Falar com Raabe
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
