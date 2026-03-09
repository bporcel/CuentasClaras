/**
 * Production API Interface for Cuentas Claras
 *
 * Data source: BOE (Boletín Oficial del Estado) Open Data API
 *   - Summary endpoint:  GET /datosabiertos/api/boe/sumario/{YYYYMMDD}
 *     → lists all section 5A items (Contratación del Sector Público)
 *   - Item XML endpoint: GET /diario_boe/xml.php?id={BOE-B-XXXX}
 *     → formalización items contain: awarded company, CIF, amount, procedure type
 */

import { fetchPlacspLicitaciones } from "./placsp";

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
    /** Type of procedure used (e.g. "Abierto", "Negociado sin publicidad") */
    procedure?: string;
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
    /** Breakdown of contract volume by procedure type */
    procedureDistribution: { name: string; value: number }[];
    /** Organisms that use "Negociado sin publicidad" or "Emergencia" the most */
    topMinistriesWithoutPublicity: { name: string; value: number; sampleUrl: string }[];
    /** Warnings for companies receiving multiple minor contracts ("troceado") */
    minorContractWarnings: { name: string; cif: string; count: number; totalAmount: number; ministries: string[]; sampleUrl: string }[];
    latestRealOperations: RealBOEItem[];
    // --- PLACSP INTEGRATION ---
    placspOvercostsValue: number;
    placspOvercostsCount: number;
    topPlacspOvercosts: { title: string; party: string; expected: number; awarded: number; delta: number; link: string }[];
}

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes – historical BOE docs change rarely
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

interface BOEDepartamento {
    nombre?: string;
    item?: unknown | unknown[]; // keeping item as unknown to avoid over-typing the whole BOE spec
}

interface BOESeccion {
    codigo?: string;
    departamento?: BOEDepartamento | BOEDepartamento[];
}

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

        const secciones: BOESeccion[] = Array.isArray(diarioArr[0].seccion)
            ? diarioArr[0].seccion
            : diarioArr[0].seccion ? [diarioArr[0].seccion] : [];

        const sec5a = secciones.find((s) => s.codigo === "5A");
        if (!sec5a) return [];

        const departments: BOEDepartamento[] = Array.isArray(sec5a.departamento)
            ? sec5a.departamento
            : sec5a.departamento ? [sec5a.departamento] : [];

        const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const results: Omit<RealBOEItem, "recipient" | "recipientCif" | "amount">[] = [];

        for (const dept of departments) {
            const rawItems = dept.item;
            const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
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
        // Field 7 = Tipo de procedimiento de adjudicación
        const procedureMatch = xml.match(/<dt>[^<]*procedimiento[^<]*<\/dt>\s*<dd>([^<]+)<\/dd>/i);

        let procedure = procedureMatch ? procedureMatch[1].trim() : undefined;
        // Clean up procedure strings (e.g. "Abierto." -> "Abierto")
        if (procedure && procedure.endsWith(".")) {
            procedure = procedure.slice(0, -1);
        }

        return {
            ...item,
            recipient: recipientMatch ? recipientMatch[1].trim().replace(/\.$/, "") : undefined,
            recipientCif: cifMatch ? cifMatch[1].trim().replace(/\.$/, "") : undefined,
            amount: amountMatch ? parseSpanishAmount(amountMatch[1]) : undefined,
            procedure,
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

    console.log("[Production API] Refreshing BOE data (last 60 days)…");

    // 1. Fetch summaries for last 60 calendar days in parallel
    const rawItems = (
        await Promise.all(Array.from({ length: 60 }, (_, i) => fetchSumarioItems(toDateStr(i))))
    ).flat();

    // 2. Enrich formalización items (up to 200) in batches of 20 to avoid saturating BOE
    const ENRICH_CAP = 200;
    const BATCH_SIZE = 20;
    const formalizaciones = rawItems.filter(i => i.kind === "formalizacion").slice(0, ENRICH_CAP);
    const others = rawItems.filter(i => i.kind !== "formalizacion");

    const enriched: RealBOEItem[] = [];
    for (let i = 0; i < formalizaciones.length; i += BATCH_SIZE) {
        const batch = formalizaciones.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(enrichFormalizacion));
        enriched.push(...results);
    }
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

    // Daily trend – euros awarded per day (strictly EUR, no mixed metrics)
    const dailyEuros: Record<string, number> = {};
    for (const item of enriched) {
        if (item.amount) dailyEuros[item.date] = (dailyEuros[item.date] ?? 0) + item.amount;
    }

    // Generate strict contiguous calendar days
    // We only show from the oldest date we actually have enriched data for (to avoid a long flat zero-line at the start)
    const oldestDate = enriched.length > 0
        ? enriched.reduce((min, p) => p.date < min ? p.date : min, enriched[0].date)
        : toDateStr(59); // Fallback to 60 days if empty

    const monthlyTrend = Array.from({ length: 60 }, (_, i) => {
        const dateStr = toDateStr(59 - i); // oldest to newest
        const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        return {
            fullDate: isoDate,
            name: `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}`,
            value: dailyEuros[isoDate] ?? 0,
        };
    }).filter(d => d.fullDate >= oldestDate);

    // Track minor contracts and potential fragmentation
    let minorContracts = 0;
    const minorContractMap: Record<string, { name: string; cif: string; count: number; totalAmount: number; ministries: Set<string>; sampleUrl: string }> = {};

    for (const item of enriched) {
        const proc = item.procedure?.toLowerCase() || "";
        const title = item.title.toLowerCase();
        const amt = item.amount || 0;

        const isMenor = proc.includes("menor") || title.includes("menor") || (amt > 0 && amt <= 15000);

        if (isMenor) {
            minorContracts++;
            if (item.recipient) {
                if (!minorContractMap[item.recipient]) {
                    minorContractMap[item.recipient] = { name: item.recipient, cif: item.recipientCif || "---", count: 0, totalAmount: 0, ministries: new Set(), sampleUrl: item.url };
                }
                minorContractMap[item.recipient].count++;
                minorContractMap[item.recipient].totalAmount += amt;
                minorContractMap[item.recipient].ministries.add(item.department);
            }
        }
    }

    // Convert to array and filter for multiple minor contracts
    const minorContractWarnings = Object.values(minorContractMap)
        .filter(c => c.count > 1)
        .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount)
        .map(c => ({ ...c, ministries: Array.from(c.ministries) }))
        .slice(0, 10);

    // Track Procedure distribution
    const procedureCount: Record<string, number> = {};
    const noPublicityByDept: Record<string, { count: number; sampleUrl: string }> = {};

    for (const item of enriched) {
        if (!item.procedure) continue;
        const procName = item.procedure;

        // Group similar procedures
        let groupName = "Otros";
        const lowerProc = procName.toLowerCase();

        if (lowerProc.includes("abierto simplificado")) groupName = "Abierto Simplificado";
        else if (lowerProc.includes("abierto")) groupName = "Abierto";
        else if (lowerProc.includes("negociado sin publicidad")) groupName = "Negociado Sin Publicidad";
        else if (lowerProc.includes("negociado con publicidad")) groupName = "Negociado Con Publicidad";
        else if (lowerProc.includes("emergencia")) groupName = "Emergencia";
        else if (lowerProc.includes("basado en un acuerdo marco")) groupName = "Acuerdo Marco";
        else if (lowerProc.includes("restringido")) groupName = "Restringido";
        else groupName = "Otros";

        procedureCount[groupName] = (procedureCount[groupName] ?? 0) + 1;

        if (groupName === "Negociado Sin Publicidad" || groupName === "Emergencia") {
            if (!noPublicityByDept[item.department]) {
                noPublicityByDept[item.department] = { count: 0, sampleUrl: item.url };
            }
            noPublicityByDept[item.department].count++;
        }
    }

    const procedureDistribution = Object.entries(procedureCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const topMinistriesWithoutPublicity = Object.entries(noPublicityByDept)
        .map(([name, entry]) => ({
            name,
            value: entry.count,
            sampleUrl: entry.sampleUrl,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // --- PLACSP INGESTION (Sobrecostes) ---
    const placspData = await fetchPlacspLicitaciones();
    let placspOvercostsValue = 0;
    let placspOvercostsCount = 0;
    const overcostItems: { title: string; party: string; expected: number; awarded: number; delta: number; link: string }[] = [];

    for (const tender of placspData) {
        if (tender.amountAwarded > 0 && tender.amountTendered > 0 && tender.amountAwarded > tender.amountTendered) {
            const delta = tender.amountAwarded - tender.amountTendered;
            placspOvercostsValue += delta;
            placspOvercostsCount++;
            overcostItems.push({
                title: tender.title,
                party: tender.contractingParty,
                expected: tender.amountTendered,
                awarded: tender.amountAwarded,
                delta,
                link: tender.link
            });
        }
    }

    // Sort by largest absolute overcost
    overcostItems.sort((a, b) => b.delta - a.delta);
    const topPlacspOvercosts = overcostItems.slice(0, 5);

    const data: AggregatedData = {
        totalAmount: allItems.length,
        totalEuros,
        activeContracts: allItems.length,
        minorContracts,
        byRegion,
        topCompanies,
        monthlyTrend,
        procedureDistribution,
        topMinistriesWithoutPublicity,
        minorContractWarnings,
        latestRealOperations: allItems.slice(0, 30),
        placspOvercostsValue,
        placspOvercostsCount,
        topPlacspOvercosts
    };

    cachedResult = { data, timestamp: now };
    return data;
}
