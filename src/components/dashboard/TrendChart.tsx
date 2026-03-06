"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendChartProps {
    data: { name: string; value: number }[];
    title?: string;
    metricLabel?: string;
}

const formatEur = (n: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency", currency: "EUR",
        notation: "compact", maximumFractionDigits: 1,
    }).format(n);

export function TrendChart({
    data,
    title = "Valor Adjudicado por Día",
    metricLabel = "Contratos Formalizados",
}: TrendChartProps) {
    const hasEuros = data.some(d => d.value > 0);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{title}</h3>
                <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    Fuente: BOE Pública
                </span>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={hasEuros ? formatEur : (v) => String(v)}
                            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                            width={70}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const val = payload[0].value as number;
                                    return (
                                        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
                                            <p className="font-medium text-muted-foreground mb-1 text-sm">
                                                {payload[0].payload.name}
                                            </p>
                                            <p className="text-primary font-black text-xl">
                                                {hasEuros
                                                    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val)
                                                    : `${val} anuncios`}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
