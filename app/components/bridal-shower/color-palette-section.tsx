import { motion } from "framer-motion";

const COLORS = [
    { hex: "bg-stone-900", name: "Preto" },
    { hex: "bg-white border border-stone-200", name: "Branco" },
    { hex: "bg-stone-400", name: "Cinza" },
    { hex: "bg-[#d4c4b7]", name: "Bege" },
] as const;

export function ColorPaletteSection() {
    return (
        <section id="paleta-cores" className="scroll-mt-24">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 text-center space-y-6 mx-auto max-w-3xl"
            >
                <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Paleta de Cores Sugerida</h2>
                <div className="flex justify-center items-center gap-8">
                    {COLORS.map(({ hex, name }) => (
                        <div key={name} className="group flex flex-col items-center gap-3">
                            <div
                                className={`w-12 h-12 rounded-full ${hex} shadow-md ring-4 ring-stone-50 transition-transform group-hover:scale-110`}
                                role="img"
                                aria-label={`Cor ${name}`}
                            />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{name}</span>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                    Para mantermos a harmonia visual, adoraríamos que os presentes seguissem esta paleta de cores neutras.
                </p>
            </motion.div>
        </section>
    );
}
