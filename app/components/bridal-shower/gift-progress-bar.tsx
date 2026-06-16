import { motion } from "framer-motion";
import { Gift } from "lucide-react";

interface GiftProgressBarProps {
    total: number;
    reserved: number;
}

export function GiftProgressBar({ total, reserved }: GiftProgressBarProps) {
    if (total === 0) return null;

    const percentage = Math.round((reserved / total) * 100);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Gift className="h-4 w-4 text-rose-400" />
                    <span><strong>{reserved}</strong> de <strong>{total}</strong> presentes reservados</span>
                </div>
                <span className="text-sm font-bold text-rose-500">{percentage}%</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                />
            </div>
        </div>
    );
}
