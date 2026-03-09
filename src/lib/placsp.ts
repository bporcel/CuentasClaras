import { XMLParser } from "fast-xml-parser";
import { cache } from "react";

const PLACSP_BASE = "https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom";

export interface PlacspContract {
    id: string;
    title: string;
    status: string;
    amountAwarded: number;
    amountTendered: number;
    currency: string;
    contractingParty: string;
    cif: string;
    procedureType: string;
    updated: string;
    link: string;
}

function parseProcedure(code: string | number): string {
    const c = String(code);
    switch (c) {
        case "1": return "Abierto";
        case "2": return "Restringido";
        case "3": return "Negociado sin publicidad";
        case "4": return "Negociado con publicidad";
        case "5": return "Diálogo competitivo";
        case "6": return "Contrato menor";
        case "9": return "Derivado de acuerdo marco";
        case "100": return "Emergencia";
        default: return "Otro";
    }
}

export const fetchPlacspLicitaciones = cache(async (): Promise<PlacspContract[]> => {
    try {
        console.log("[PLACSP] Fetching recent contracts from Atom feed...");
        const response = await fetch(PLACSP_BASE, {
            next: { revalidate: 3600 } // Cache per hour
        });

        if (!response.ok) {
            throw new Error(`PLACSP API HTTP error! status: ${response.status}`);
        }

        const xmlData = await response.text();

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            parseTagValue: true,
            removeNSPrefix: true, // Crucial for cleaning urn:cac/cbc prefixes
        });

        const jsonObj = parser.parse(xmlData);

        if (!jsonObj.feed || !jsonObj.feed.entry) {
            console.warn("[PLACSP] No entries found in the feed.");
            return [];
        }

        const entries = Array.isArray(jsonObj.feed.entry) ? jsonObj.feed.entry : [jsonObj.feed.entry];

        return entries.map((entry: any) => {
            const folder = entry.ContractFolderStatus;
            const party = folder?.LocatedContractingParty?.Party?.PartyName?.Name || "Órgano Desconocido";
            const cif = folder?.LocatedContractingParty?.Party?.PartyIdentification?.ID?.["#text"] || "N/A";

            // Financials: Extract base budget vs awarded amount
            let amountAwarded = 0;
            let amountTendered = 0;
            let currency = "EUR";

            // 1. Base Budget (Amount Tendered)
            const estimatedAmount = folder?.ProcurementProject?.BudgetAmount?.EstimatedOverallContractAmount || folder?.BudgetAmount?.EstimatedOverallContractAmount;
            if (estimatedAmount) {
                if (typeof estimatedAmount === "object" && estimatedAmount["#text"]) {
                    amountTendered = parseFloat(estimatedAmount["#text"]);
                    currency = estimatedAmount["@_currencyID"] || "EUR";
                } else {
                    amountTendered = parseFloat(estimatedAmount);
                }
            }

            // 2. Awarded Amount (Can be a single object or an array of lots)
            const tenderResults = folder?.TenderResult;
            if (tenderResults) {
                const resultsArray = Array.isArray(tenderResults) ? tenderResults : [tenderResults];

                amountAwarded = resultsArray.reduce((acc: number, result: any) => {
                    const taxExclusiveAmount = result?.AwardedTenderedProject?.LegalMonetaryTotal?.TaxExclusiveAmount;
                    if (taxExclusiveAmount) {
                        return acc + (typeof taxExclusiveAmount === "object" ? parseFloat(taxExclusiveAmount["#text"]) : parseFloat(taxExclusiveAmount));
                    }
                    return acc;
                }, 0);
            }

            return {
                id: entry.id || "",
                title: entry.title || "",
                status: folder?.ContractFolderStatusCode?.["#text"] || folder?.ContractFolderStatusCode || "UNK",
                amountAwarded,
                amountTendered,
                currency,
                contractingParty: party,
                cif,
                procedureType: parseProcedure(folder?.TenderingProcess?.ProcedureCode?.["#text"] || folder?.TenderingProcess?.ProcedureCode || "Unknown"),
                updated: entry.updated || "",
                link: entry.link?.["@_href"] || entry.link?.href || "",
            };
        });

    } catch (error) {
        console.error("[PLACSP] Error fetching data:", error);
        return [];
    }
});
