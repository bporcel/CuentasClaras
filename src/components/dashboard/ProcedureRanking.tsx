"use client";

import { AlertTriangle, ShieldCheck, ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface ProcedureRankingProps {
    data: { name: string; value: number }[];
    topNoPublicity: { name: string; value: number; sampleUrl: string }[];
}

const getProcedureColor = (name: string) => {
    const norm = name.toLowerCase();

    if (norm.includes("abierto")) return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
    if (norm.includes("restringido")) return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    if (norm.includes("negociado con publicidad") || norm.includes("acuerdo marco")) return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    if (norm.includes("negociado sin publicidad") || norm.includes("emergencia")) return "bg-rose-500/20 text-rose-700 border-rose-500/30";

    return "bg-slate-500/20 text-slate-700 border-slate-500/30";
};

const getProcedureIcon = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes("negociado sin publicidad") || norm.includes("emergencia")) {
        return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    return <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
};

const getProcedureExplanation = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes("abierto simplificado")) return "Modalidad ágil del procedimiento abierto para contratos de menor cuantía. Se exige publicidad pero los plazos son más cortos.";
    if (norm.includes("abierto")) return "El procedimiento más transparente. Cualquier empresa puede presentar una oferta. Se valora según criterios objetivos publicados previamente.";
    if (norm.includes("restringido")) return "Solo pueden presentar ofertas las empresas que hayan sido expresamente invitadas por la Administración tras superar una fase previa de solvencia.";
    if (norm.includes("negociado con publicidad")) return "La Administración consulta con varios candidatos y negocia las condiciones del contrato con uno o varios de ellos.";
    if (norm.includes("negociado sin publicidad")) return "Adjudicación directa (A Dedo). La Administración elige a la empresa sin publicar un anuncio previo. Solo es legal en casos muy excepcionales tasados por la ley.";
    if (norm.includes("emergencia")) return "Contratación inmediata sin plazos ni publicidad para atender situaciones de catástrofe, grave peligro o necesidades relativas a la defensa nacional.";
    if (norm.includes("acuerdo marco")) return "No es un contrato en sí, sino un 'contrato paraguas' pre-adjudicado que fija las condiciones para futuros contratos específicos (basados).";
    return "Procedimiento de contratación contemplado en la Ley de Contratos del Sector Público.";
};

export function ProcedureRanking({ data, topNoPublicity }: ProcedureRankingProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="w-full h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Tipos de Procedimiento
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Análisis de los 200 contratos más recientes.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* Left Column: Overall Procedure Distribution */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Distribución Global
                    </h4>

                    {data.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border p-4">
                            Esperando datos de formalización...
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {data.map((proc) => {
                                const percentage = Math.round((proc.value / total) * 100);
                                return (
                                    <div key={proc.name} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-1.5 font-medium text-sm">
                                                {getProcedureIcon(proc.name)}
                                                <Tooltip
                                                    content={getProcedureExplanation(proc.name)}
                                                    className="max-w-xs text-sm"
                                                >
                                                    <span className="truncate max-w-[200px] border-b border-dashed border-muted-foreground/40 cursor-help hover:border-foreground transition-colors overflow-hidden inline-block">{proc.name}</span>
                                                </Tooltip>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{percentage}%</span>
                                                <span className="text-xs text-muted-foreground">({proc.value})</span>
                                            </div>
                                        </div>
                                        {/* Progress bar background */}
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            {/* Progress bar fill */}
                                            <div
                                                className={`h-full rounded-full border ${getProcedureColor(proc.name)} !bg-opacity-100 ${getProcedureColor(proc.name).split(' ')[1]}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: "A Dedo" Ranking */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Top Adjudicaciones Directas
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 leading-tight">
                        Ministerios con más contratos por vía de Urgencia / Emergencia o Negociado Sin Publicidad.
                    </p>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {topNoPublicity.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100 p-6 h-full">
                                <ShieldCheck className="w-8 h-8 mb-2 opacity-80" />
                                No se han detectado contratos sin publicidad en los últimos 60 días.
                            </div>
                        ) : (
                            topNoPublicity.map((ministry, i) => (
                                <a
                                    key={ministry.name}
                                    href={ministry.sampleUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 hover:border-rose-400 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                            {i + 1}
                                        </div>
                                        <span className="font-semibold text-xs text-rose-950 truncate max-w-[180px]" title={ministry.name}>
                                            {ministry.name.replace("MINISTERIO ", "MIN. ")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-black text-rose-700 text-sm">
                                            {ministry.value} <span className="text-[10px] font-normal uppercase">contratos</span>
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-rose-400 group-hover:text-rose-700 transition-colors" />
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
