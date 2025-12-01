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
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    className={`w-full h-full object-cover transition-all duration-[2000ms] ease-out ${isEnded ? "blur-md scale-105 opacity-60" : "opacity-100 scale-100"}`}
                    poster={posterUrl}
                    onEnded={() => setIsEnded(true)}
                >
                    <source src={videoUrl} type="video/mp4" />
                </video>
                {/* Overlay for better text contrast after video ends */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-[2000ms] ${isEnded ? "opacity-100" : "opacity-0"}`} />
            </div>

            {/* Content - Revealed after video ends */}
            <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center`}>
                {isEnded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="w-full h-full flex flex-col items-center justify-center"
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
