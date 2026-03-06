"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { ExternalLink, X } from "lucide-react";

interface MoneyMapProps {
    data: { name: string; value: number }[];
    title?: string;
    label?: string;
}

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb923c", "#facc15"];

export function MoneyMap({ data, title = "Actividad por Organismo", label = "Licitaciones" }: MoneyMapProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);
    const selectedEntry = sortedData.find(d => d.name === selected);

    // Correct BOE search: section 5 (Anuncios) + DEM field matches exact department/ministry name
    const boeSearchUrl = (name: string) =>
        `https://www.boe.es/buscar/boe.php`
        + `?campo%5B0%5D=ORIS&dato%5B0%5D%5B5%5D=5&operador%5B0%5D=and`
        + `&campo%5B1%5D=TITULOS&dato%5B1%5D=`
        + `&campo%5B2%5D=DEM&dato%5B2%5D=${encodeURIComponent(name)}`
        + `&accion=Buscar`;

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{title}</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {label}
                </span>
            </div>

            {/* Detail panel shown when a bar is selected */}
            {selected && selectedEntry && (
                <div className="absolute inset-x-0 top-12 z-10 bg-card border border-primary/30 rounded-xl shadow-2xl p-4 mx-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-sm leading-tight">{selectedEntry.name}</p>
                        <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-3xl font-black text-primary mb-3">{selectedEntry.value} <span className="text-sm font-normal text-muted-foreground">publicaciones</span></p>
                    <a
                        href={boeSearchUrl(selectedEntry.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver contratos en BOE
                    </a>
                </div>
            )}

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                            width={150}
                            tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + "…" : v}
                        />

                        <Bar
                            dataKey="value"
                            radius={[0, 6, 6, 0]}
                            barSize={26}
                            style={{ cursor: "pointer" }}
                            onClick={(data: any) => {
                                const name = data?.name;
                                if (name) setSelected((prev: string | null) => prev === name ? null : name);
                            }}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    opacity={selected && selected !== entry.name ? 0.35 : 1}
                                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {sortedData.length > 0 && !selected && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Clic en una barra para ver detalles y enlace al BOE
                </p>
            )}
        </div>
    );
}
