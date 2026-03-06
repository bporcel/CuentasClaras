"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export function NavBar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                            €
                        </div>
                        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                            Cuentas Claras
                        </Link>
                    </div>

                    <nav className="flex items-center gap-2">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-muted"
                        >
                            <Home className="w-4 h-4" />
                            Dashboard
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
