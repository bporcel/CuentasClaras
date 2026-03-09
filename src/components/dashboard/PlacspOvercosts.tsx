import React from "react";
import { AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface OvercostItem {
    title: string;
    party: string;
    expected: number;
    awarded: number;
    delta: number;
    link: string;
}

interface PlacspOvercostsProps {
    data: OvercostItem[];
}

export function PlacspOvercosts({ data }: PlacspOvercostsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-full rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold text-foreground">Monitor de Sobrecostes</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 opacity-50">
                    <TrendingUp className="w-12 h-12 mb-3 text-emerald-500" />
                    <p className="text-sm text-foreground font-medium">No se detectaron desviaciones</p>
                    <p className="text-xs text-muted-foreground mt-1">Los últimos contratos analizados en PLACSP no superaron el presupuesto base de licitación.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="h-full rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h3 className="font-semibold text-foreground">Sobrecostes Detectados</h3>
                    <Tooltip icon content="Contratos donde el Adjudicatario ha facturado más dinero del presupuestado inicialmente (Base de Licitación). Datos procedentes de la PLACSP.">
                        {""}
                    </Tooltip>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100">
                    Alerta PLACSP
                </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Contratos recientes cuyo importe final supera el presupuesto estimado.
            </p>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {data.map((item, i) => {
                    const pct = ((item.delta / item.expected) * 100).toFixed(1);

                    return (
                        <div key={i} className="group p-4 rounded-xl bg-background border border-border/60 hover:border-border transition-colors relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/20 group-hover:bg-rose-500/40 transition-colors" />

                            <div className="flex justify-between items-start gap-3 mb-2">
                                <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                                    {item.title}
                                </h4>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    title="Ver contrato original"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{item.party}</p>

                            <div className="grid grid-cols-2 gap-3 mt-auto pt-3 border-t border-border/40">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Presupuesto</p>
                                    <p className="text-sm font-medium text-foreground">{formatCurrency(item.expected)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-wider text-rose-600 mb-1 font-semibold flex items-center justify-end gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +{pct}%
                                    </p>
                                    <p className="text-sm font-bold text-rose-600">
                                        {formatCurrency(item.awarded)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
