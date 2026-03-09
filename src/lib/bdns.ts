import { chromium } from "playwright";
import { cache } from "react";

export interface BDNSConcesion {
    id: string;          // Elemento 0
    organo: string;      // Elemento 1 (e.g. "MINISTERIO DE CULTURA")
    convocatoria: string;// Elemento 2 (e.g. "Ayudas para la promoción del sector del videojuego")
    beneficiario: string;// Elemento 3 (e.g. "ESTUDIO CREATIVO SL")
    fecha: string;       // Elemento 4 (e.g. "01/03/2026")
    importe: number;     // Elemento 5 (e.g. "120.000,00" -> 120000)
    instrumento: string; // Elemento 6 (e.g. "Subvención y entrega dineraria")
}

function formatBDNSDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function parseSpanishAmount(amountStr: string): number {
    if (!amountStr) return 0;
    const cleanStr = amountStr.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanStr) || 0;
}

/**
 * Fetches recent subsidies using a Chromium headless shell to bypass the strict WAF.
 * Instead of making a manual fetch() which gets flagged by the WAF as a bot,
 * we literally type into the search form like a real user and intercept the XHR response.
 */
export const fetchSubvenciones = cache(async (daysBack: number = 30): Promise<BDNSConcesion[]> => {
    let browser = null;
    let interceptedData: any = null;

    try {
        const hasta = new Date();
        const desde = new Date();
        desde.setDate(hasta.getDate() - daysBack);

        const strDesde = formatBDNSDate(desde);
        const strHasta = formatBDNSDate(hasta);

        console.log(`[BDNS] Headless scraping ayudas from ${strDesde} to ${strHasta}...`);

        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale: "es-ES",
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        // 1. Listen for the specific datatables JSON response the Angular app receives
        page.on('response', async (response) => {
            if (response.url().includes('/GE/es/concesiones') && response.request().method() === 'POST') {
                try {
                    const json = await response.json();
                    if (json && json.data) {
                        interceptedData = json.data;
                    }
                } catch {
                    // Ignore non-json responses like the HTML frame itself
                }
            }
        });

        // 2. Load the form
        await page.goto("https://www.pap.hacienda.gob.es/bdnstrans/GE/es/concesiones", { waitUntil: "networkidle" });

        // 3. Fill the dates and click search like a real human.
        // Angular Material datepickers often ignore .fill(), we need to focus, clear, and type.
        await page.click('#desde');
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.type('#desde', strDesde, { delay: 50 });

        await page.click('#hasta');
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.type('#hasta', strHasta, { delay: 50 });

        // Check "No mostrar pequeñas minimis" to avoid noise
        const isChecked = await page.isChecked('#chkMinimis');
        if (!isChecked) {
            await page.check('#chkMinimis');
        }

        // 4. Trigger search
        // Click the search button explicitly and wait for the precise XHR
        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/GE/es/concesiones') && res.request().method() === 'POST'),
            page.locator('#busqueda').click({ force: true })
        ]);

        // Wait a tiny bit for the `page.on` to digest the JSON
        await page.waitForTimeout(500);

        if (!interceptedData || !Array.isArray(interceptedData)) {
            console.warn("[BDNS] No JSON data intercepted from XHR.");
            return [];
        }

        return interceptedData.map((row: string[]) => {
            return {
                id: row[0] || "",
                organo: row[1] || "Órgano desconocido",
                convocatoria: row[2] || "",
                beneficiario: row[3] || "Oculto",
                fecha: row[4] || "",
                importe: parseSpanishAmount(row[5] || "0"),
                instrumento: row[6] || ""
            };
        });

    } catch (error) {
        console.error("[BDNS] High-level Playwright failure:", error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
});
