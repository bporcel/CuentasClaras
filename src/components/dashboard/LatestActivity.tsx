"use client";

import { ExternalLink, Clock, Euro, FileText, CheckCircle2 } from "lucide-react";

interface Operation {
    id: string;
    title: string;
    url: string;
    date: string;
    department: string;
    kind: string;
    recipient?: string;
    amount?: number;
}

interface LatestActivityProps {
    operations: Operation[];
}

const formatEur = (n: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(n);

const kindConfig: Record<string, { label: string; color: string; icon: typeof FileText }> = {
    formalizacion: { label: "Adjudicado", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    licitacion: { label: "Licitación", color: "text-blue-700 bg-blue-50 border-blue-200", icon: FileText },
    other: { label: "Anuncio", color: "text-slate-600 bg-slate-50 border-slate-200", icon: FileText },
};

export function LatestActivity({ operations }: LatestActivityProps) {
    if (operations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mb-3 opacity-30" />
                <p>No hay anuncios recientes en el BOE.</p>
                <p className="text-xs mt-1">Puede ser festivo o fin de semana.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Últimas Publicaciones BOE
                </h3>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {operations.slice(0, 15).map((op) => {
                    const cfg = kindConfig[op.kind] ?? kindConfig.other;
                    const Icon = cfg.icon;
                    return (
                        <a
                            key={op.id}
                            href={op.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-1.5 p-3 border border-border rounded-xl bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                            {/* Top row: badge + id + link icon */}
                            <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {cfg.label}
                                </span>
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-[10px] font-mono text-muted-foreground">{op.date}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </div>
                            </div>

                            {/* Title */}
                            <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                {op.title}
                            </p>

                            {/* Bottom row: department + amount */}
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                    {op.department}
                                </span>
                                {op.amount != null && (
                                    <span className="flex items-center gap-1 text-xs font-black text-emerald-700 shrink-0">
                                        <Euro className="w-3 h-3" />
                                        {formatEur(op.amount)}
                                    </span>
                                )}
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
