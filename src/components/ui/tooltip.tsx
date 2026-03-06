"use client";

import { useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import clsx from "clsx";

interface TooltipProps {
    children: ReactNode;
    content: string;
    className?: string;
    icon?: boolean;
}

export function Tooltip({ children, content, className, icon = false }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 150);
    };

    return (
        <div
            className={clsx("relative inline-flex items-center gap-1", className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {icon && (
                <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
            )}

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 text-sm text-primary-foreground bg-primary rounded-lg shadow-lg pointer-events-none"
                    >
                        <div className="relative">
                            {content}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
