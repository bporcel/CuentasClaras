import { Trophy, ExternalLink, Euro } from "lucide-react";

interface TopRecipientsProps {
    data: { name: string; cif: string; amount: number; count: number; sampleUrl?: string }[];
    title?: string;
    unitLabel?: string;
}

const formatEur = (n: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(n);

const rankColor = (i: number) => {
    if (i === 0) return "bg-yellow-400/20 text-yellow-700 border-yellow-300";
    if (i === 1) return "bg-slate-300/30 text-slate-600 border-slate-300";
    if (i === 2) return "bg-orange-300/20 text-orange-700 border-orange-300";
    return "bg-primary/10 text-primary border-primary/20";
};

export function TopRecipients({
    data,
    title = "Mayores Adjudicatarios",
    unitLabel = "contratos",
}: TopRecipientsProps) {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {title}
                </h3>
                <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    Últimos 14 días
                </span>
            </div>

            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm p-4">
                    <p>Los adjudicatarios aparecerán aquí a medida que el BOE publique nuevas formalizaciones.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {data.map((company, i) => {
                        // Link directly to the actual BOE document for this company.
                        // sampleUrl is the html URL of the first formalización that matched.
                        const href = company.sampleUrl ?? `https://www.boe.es/buscar/boe.php?campo%5B0%5D=ORIS&dato%5B0%5D%5B5%5D=5&operador%5B0%5D=and&campo%5B1%5D=TITULOS&dato%5B1%5D=${encodeURIComponent(company.name)}&accion=Buscar`;
                        return (
                            <a
                                key={`${company.name}-${i}`}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all bg-card"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Rank badge */}
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${rankColor(i)}`}>
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {company.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                            {company.cif !== "---" ? `CIF: ${company.cif}` : "Ver en BOE"}
                                            {" · "}
                                            {company.count} {unitLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <div className="flex flex-col items-end">
                                        <span className="font-black text-sm text-emerald-700 flex items-center gap-0.5">
                                            <Euro className="w-3.5 h-3.5" />
                                            {formatEur(company.amount).replace("€", "").trim()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">adjudicado</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
