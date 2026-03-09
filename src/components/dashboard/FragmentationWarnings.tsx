"use client";

import { AlertOctagon, AlertCircle, ExternalLink } from "lucide-react";

interface WarningData {
    name: string;
    cif: string;
    count: number;
    totalAmount: number;
    ministries: string[];
    sampleUrl: string;
}

interface FragmentationWarningsProps {
    warnings: WarningData[];
}

const formatEur = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(n);

export function FragmentationWarnings({ warnings }: FragmentationWarningsProps) {
    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-amber-600">
                        <AlertOctagon className="w-5 h-5" />
                        Detector de Troceado
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Empresas que acumulan contratos en los 200 anuncios más recientes.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {warnings.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100 p-6 h-full min-h-[150px]">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-80 text-emerald-500" />
                        No se han detectado acumulaciones de contratos menores en los últimos 60 días.
                    </div>
                ) : (
                    warnings.map((warning, i) => (
                        <a
                            key={`${warning.name}-${i}`}
                            href={warning.sampleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-amber-50 hover:border-amber-400"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-amber-950 line-clamp-2" title={warning.name}>
                                        {warning.name}
                                    </span>
                                    <span className="text-xs text-amber-700/70 font-mono mt-0.5">
                                        {warning.cif}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="font-black text-amber-600 flex items-center text-lg gap-1">
                                        {formatEur(warning.totalAmount)}
                                        <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-700 transition-colors" />
                                    </span>
                                    <span className="text-xs font-semibold text-amber-700/80 uppercase mt-0.5 bg-amber-200/50 px-2 py-0.5 rounded-full inline-block">
                                        {warning.count} contratos
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-amber-200/60 pt-2 mt-1">
                                <span className="text-[10px] uppercase font-bold text-amber-800/60 block mb-1">
                                    Adjudicados por:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {warning.ministries.map((min, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10px] bg-white border border-amber-200 text-amber-900 px-2 py-0.5 rounded-full shadow-sm max-w-[200px] truncate"
                                            title={min}
                                        >
                                            {min.replace("MINISTERIO ", "MIN. ")}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
}
