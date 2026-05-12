import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface VideoHeroProps {
    videoUrl: string;
    posterUrl?: string;
    children: React.ReactNode;
}

export function VideoHero({ videoUrl, posterUrl, children }: VideoHeroProps) {
    const [isEnded, setIsEnded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        }
    }, []);

    return (
        <section className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center bg-black">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out ${isEnded ? "blur-md scale-105 opacity-60" : "opacity-100 scale-100"}`}
                    poster={posterUrl}
                    onEnded={() => setIsEnded(true)}
                >
                    <source src={videoUrl} type="video/mp4" />
                </video>
                <div className={`absolute inset-0 bg-black transition-opacity duration-[1200ms] ${isEnded ? "opacity-55" : "opacity-45"}`} />
            </div>

            <div className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center py-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="flex min-h-[100svh] w-full flex-col items-center justify-center py-16"
                >
                    {children}
                </motion.div>
            </div>
        </section>
    );
}
