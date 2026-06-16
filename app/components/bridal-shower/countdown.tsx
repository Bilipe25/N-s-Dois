import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownProps {
    targetDate?: string | null;
}

function calculateTimeLeft(targetDate: string) {
    // Parse date-only strings as local time to avoid timezone issues
    let target: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        const [year, month, day] = targetDate.split('-').map(Number);
        target = new Date(year, month - 1, day);
    } else {
        target = new Date(targetDate);
    }

    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return null;

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
}

export function Countdown({ targetDate }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<ReturnType<typeof calculateTimeLeft>>(null);

    useEffect(() => {
        if (!targetDate) return;

        const tick = () => {
            const tl = calculateTimeLeft(targetDate);
            setTimeLeft(tl);
            if (!tl) clearInterval(timer);
        };

        tick();
        const timer = setInterval(tick, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!targetDate || !timeLeft) return null;

    const units = [
        { value: timeLeft.days, label: "dias" },
        { value: timeLeft.hours, label: "horas" },
        { value: timeLeft.minutes, label: "min" },
        { value: timeLeft.seconds, label: "seg" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 shadow-xl shadow-stone-200/50 border border-stone-100 text-center"
        >
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                Contagem Regressiva
            </p>
            <div className="flex justify-center gap-4 sm:gap-8">
                {units.map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                        <span className="text-3xl sm:text-4xl font-serif font-bold text-stone-800 tabular-nums">
                            {String(value).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-1">
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
