import { motion } from "framer-motion";

interface GiftProgressBarProps {
    total: number;
    reserved: number;
}

export function GiftProgressBar({ total, reserved }: GiftProgressBarProps) {
    if (total === 0) return null;

    const percentage = Math.round((reserved / total) * 100);

    return (
        <div className="py-2 mb-6">
            <div className="flex flex-col items-center justify-center mb-3">
                <p className="text-sm text-stone-500 font-medium tracking-wide">
                    {reserved} DE {total} PRESENTES RESERVADOS
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
