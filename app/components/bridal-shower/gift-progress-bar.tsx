import { motion } from "framer-motion";

interface GiftProgressBarProps {
    total: number;
    reserved: number;
}

export function GiftProgressBar({ total, reserved }: GiftProgressBarProps) {
    if (total === 0) return null;

    const percentage = Math.round((reserved / total) * 100);

    return (
        <div className="mb-5 py-1">
            <div className="mb-3 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-stone-600">
                    {reserved > 0 ? "Presentes escolhidos com carinho" : "Escolha um presente, se quiser"}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                    {reserved > 0 ? `${reserved} de ${total} escolhas` : `${total} sugestões disponíveis`}
                </p>
            </div>
            <div className="h-1.5 w-full max-w-md mx-auto bg-stone-200/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-stone-800 rounded-full"
                />
            </div>
        </div>
    );
}
