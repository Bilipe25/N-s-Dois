import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { formatEventDate } from "./types";
import type { Config } from "@/schemas/bridal-shower";

interface LocationsSectionProps {
    config?: Config;
}

export function LocationsSection({ config }: LocationsSectionProps) {
    if (!config?.bridal_shower_location && !config?.bridal_shower_location_2) {
        return null;
    }

    const hasOneLocation = (config?.bridal_shower_location && !config?.bridal_shower_location_2) ||
        (!config?.bridal_shower_location && config?.bridal_shower_location_2);

    return (
        <section id="locais" className="scroll-mt-24">
            <div className={`grid gap-6 ${hasOneLocation ? 'place-items-center' : 'md:grid-cols-2'}`}>
                {/* Location 1 */}
                {config?.bridal_shower_location && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`bg-white rounded-3xl p-8 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center text-center space-y-4 hover:border-rose-100 transition-colors ${hasOneLocation ? 'max-w-lg w-full' : ''}`}
                    >
                        <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-stone-800">{config.bridal_shower_location}</h3>
                        <div className="space-y-1 text-stone-600">
                            <p className="font-medium flex items-center justify-center gap-2">
                                <Calendar className="h-4 w-4 text-rose-400" />
                                {formatEventDate(config.bridal_shower_date)}
                            </p>
                            <p className="text-sm opacity-80 max-w-[250px] mx-auto">{config.bridal_shower_address_1}</p>
                        </div>
                        {config.bridal_shower_map_link_1 && (
                            <Button variant="outline" className="rounded-full mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" asChild>
                                <a href={config.bridal_shower_map_link_1} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="mr-2 h-4 w-4" /> Ver no Mapa
                                </a>
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Location 2 */}
                {config?.bridal_shower_location_2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className={`bg-white rounded-3xl p-8 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center text-center space-y-4 hover:border-rose-100 transition-colors ${hasOneLocation ? 'max-w-lg w-full' : ''}`}
                    >
                        <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-stone-800">{config.bridal_shower_location_2}</h3>
                        <div className="space-y-1 text-stone-600">
                            <p className="font-medium flex items-center justify-center gap-2">
                                <Calendar className="h-4 w-4 text-rose-400" />
                                {formatEventDate(config.bridal_shower_date_2)}
                            </p>
                            <p className="text-sm opacity-80 max-w-[250px] mx-auto">{config.bridal_shower_address_2}</p>
                        </div>
                        {config.bridal_shower_map_link_2 && (
                            <Button variant="outline" className="rounded-full mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" asChild>
                                <a href={config.bridal_shower_map_link_2} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="mr-2 h-4 w-4" /> Ver no Mapa
                                </a>
                            </Button>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
