/**
 * Production API Interface for Cuentas Claras
 *
 * Data source: BOE (Boletín Oficial del Estado) Open Data API
 *   - Summary endpoint:  GET /datosabiertos/api/boe/sumario/{YYYYMMDD}
 *     → lists all section 5A items (Contratación del Sector Público)
 *   - Item XML endpoint: GET /diario_boe/xml.php?id={BOE-B-XXXX}
 *     → formalización items contain: awarded company, CIF, amount, procedure type
 */

export interface RealBOEItem {
    id: string;
    title: string;
    url: string;
    date: string;
    department: string;
    /** "licitacion" | "formalizacion" | "other" */
    kind: string;
    /** Awarded company name – only present on formalización items */
    recipient?: string;
    /** Awarded company NIF/CIF */
    recipientCif?: string;
    /** Contract value in EUR – only present on formalización items */
    amount?: number;
}

export interface AggregatedData {
    /** Total number of procurement announcements fetched */
    totalAmount: number;
    /** Total monetary value of awarded contracts (€) */
    totalEuros: number;
    activeContracts: number;
    minorContracts: number;
    byRegion: { name: string; value: number }[];
    /** Top companies by total awarded value */
    topCompanies: { name: string; cif: string; amount: number; count: number; sampleUrl: string }[];
    /** Daily trend – value = total euros awarded that day */
    monthlyTrend: { name: string; value: number; fullDate: string }[];
    latestRealOperations: RealBOEItem[];
}

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let cachedResult: { data: AggregatedData; timestamp: number } | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns YYYYMMDD for today minus `daysAgo` */
function toDateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0].replace(/-/g, "");
}

/** Parses "109.680,00 euros" → 109680 */
function parseSpanishAmount(raw: string): number | undefined {
    const cleaned = raw
        .replace(/\./g, "")   // thousands separator
        .replace(",", ".")     // decimal separator
        .replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? undefined : n;
}

// ── Summary fetcher ───────────────────────────────────────────────────────────

async function fetchSumarioItems(dateStr: string): Promise<Omit<RealBOEItem, "recipient" | "recipientCif" | "amount">[]> {
    try {
        const res = await fetch(
            `https://www.boe.es/datosabiertos/api/boe/sumario/${dateStr}`,
            { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];

        const json = await res.json();
        // Real response shape: { status, data: { sumario: { diario: [...] } } }
        const diarioArr = json?.data?.sumario?.diario;
        if (!diarioArr || !diarioArr.length) return [];

        const secciones: any[] = Array.isArray(diarioArr[0].seccion)
            ? diarioArr[0].seccion
            : diarioArr[0].seccion ? [diarioArr[0].seccion] : [];

        const sec5a = secciones.find((s: any) => s.codigo === "5A");
        if (!sec5a) return [];

        const departments: any[] = Array.isArray(sec5a.departamento)
            ? sec5a.departamento
            : sec5a.departamento ? [sec5a.departamento] : [];

        const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const results: Omit<RealBOEItem, "recipient" | "recipientCif" | "amount">[] = [];

        for (const dept of departments) {
            const rawItems = dept.item;
            const items: any[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
            for (const item of items) {
                const title: string = item.titulo ?? "";
                const lowerTitle = title.toLowerCase();
                const kind = lowerTitle.includes("formalización")
                    ? "formalizacion"
                    : lowerTitle.includes("licitación") || lowerTitle.includes("licitacion")
                        ? "licitacion"
                        : "other";

                results.push({
                    id: item.identificador,
                    title,
                    url: item.url_html,
                    date: isoDate,
                    department: dept.nombre ?? "Desconocido",
                    kind,
                });
            }
        }
        return results;
    } catch (err) {
        console.error(`[BOE] Error fetching sumario ${dateStr}:`, err);
        return [];
    }
}

// ── XML enricher ──────────────────────────────────────────────────────────────

/** Fetch XML for a formalización item and extract monetary + company data */
async function enrichFormalizacion(item: Omit<RealBOEItem, "recipient" | "recipientCif" | "amount">): Promise<RealBOEItem> {
    try {
        const res = await fetch(
            `https://www.boe.es/diario_boe/xml.php?id=${item.id}`,
            { next: { revalidate: 86400 } }   // cache for 24h – published docs don't change
        );
        if (!res.ok) return item;

        const xml = await res.text();

        // Field 12.1 = awarded company name
        const recipientMatch = xml.match(/<dt>12\.1\)[^<]*<\/dt>\s*<dd>([^<]+)<\/dd>/);
        // Field 12.2 = NIF/CIF
        const cifMatch = xml.match(/<dt>12\.2\)[^<]*<\/dt>\s*<dd>([^<]+)<\/dd>/);
        // Field 13.1 = awarded value
        const amountMatch = xml.match(/<dt>13\.1\)[^<]*<\/dt>\s*<dd>([^<]+)<\/dd>/);

        return {
            ...item,
            recipient: recipientMatch ? recipientMatch[1].trim().replace(/\.$/, "") : undefined,
            recipientCif: cifMatch ? cifMatch[1].trim().replace(/\.$/, "") : undefined,
            amount: amountMatch ? parseSpanishAmount(amountMatch[1]) : undefined,
        };
    } catch {
        return item;
    }
}

// ── Main aggregator ───────────────────────────────────────────────────────────

export async function getAggregatedData(): Promise<AggregatedData> {
    const now = Date.now();
    if (cachedResult && now - cachedResult.timestamp < CACHE_TTL_MS) {
        return cachedResult.data;
    }

    console.log("[Production API] Refreshing BOE data (last 14 days)…");

    // 1. Fetch summaries for last 14 calendar days in parallel
    const rawItems = (
        await Promise.all(Array.from({ length: 14 }, (_, i) => fetchSumarioItems(toDateStr(i))))
    ).flat();

    // 2. Enrich formalización items with real amounts (limit to 60 to stay fast)
    const formalizaciones = rawItems.filter(i => i.kind === "formalizacion").slice(0, 60);
    const others = rawItems.filter(i => i.kind !== "formalizacion");

    const enriched = await Promise.all(formalizaciones.map(enrichFormalizacion));
    const allItems: RealBOEItem[] = [...enriched, ...others];

    // ── Aggregate stats ────────────────────────────────────────────────────────

    const totalEuros = enriched.reduce((s, i) => s + (i.amount ?? 0), 0);

    // Top companies (by total € awarded; only formalización items have amounts)
    const companyMap: Record<string, { name: string; cif: string; amount: number; count: number; sampleUrl: string }> = {};
    for (const item of enriched) {
        if (!item.recipient) continue;
        if (!companyMap[item.recipient]) {
            companyMap[item.recipient] = { name: item.recipient, cif: item.recipientCif ?? "---", amount: 0, count: 0, sampleUrl: item.url };
        }
        companyMap[item.recipient].amount += item.amount ?? 0;
        companyMap[item.recipient].count += 1;
    }
    const topCompanies = Object.values(companyMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    // By department (count of all announcements)
    const deptCount: Record<string, number> = {};
    for (const item of allItems) {
        deptCount[item.department] = (deptCount[item.department] ?? 0) + 1;
    }
    const byRegion = Object.entries(deptCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Daily trend – euros awarded per day (fallback: count if no euros that day)
    const dailyEuros: Record<string, number> = {};
    for (const item of enriched) {
        if (item.amount) dailyEuros[item.date] = (dailyEuros[item.date] ?? 0) + (item.amount ?? 0);
    }
    // Fill days that have announcements but no award amounts with announcement count
    const dailyCount: Record<string, number> = {};
    for (const item of allItems) dailyCount[item.date] = (dailyCount[item.date] ?? 0) + 1;

    const trendDates = Array.from(new Set([...Object.keys(dailyEuros), ...Object.keys(dailyCount)])).sort();
    const monthlyTrend = trendDates.map(date => ({
        fullDate: date,
        name: date.split("-").slice(1).reverse().join("/"),
        value: dailyEuros[date] ?? 0,
    }));

    const minorContracts = allItems.filter(i =>
        i.title.toLowerCase().includes("menor")
    ).length;

    const data: AggregatedData = {
        totalAmount: allItems.length,
        totalEuros,
        activeContracts: allItems.length,
        minorContracts,
        byRegion,
        topCompanies,
        monthlyTrend,
        latestRealOperations: allItems.slice(0, 30),
    };

    cachedResult = { data, timestamp: now };
    return data;
}
