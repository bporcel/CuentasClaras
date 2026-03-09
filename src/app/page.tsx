import { Tooltip } from "@/components/ui/tooltip";
import { getAggregatedData } from "@/lib/api";
import { MoneyMap } from "@/components/dashboard/MoneyMap";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { TopRecipients } from "@/components/dashboard/TopRecipients";
import { LatestActivity } from "@/components/dashboard/LatestActivity";
import { ProcedureRanking } from "@/components/dashboard/ProcedureRanking";
import { FragmentationWarnings } from "@/components/dashboard/FragmentationWarnings";
import { Activity, Landmark, Euro } from "lucide-react";

export const revalidate = 60;

const formatEur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(n);

export default async function Home() {
  const {
    totalAmount,
    totalEuros,
    byRegion,
    topCompanies,
    monthlyTrend,
    latestRealOperations,
    minorContracts,
    procedureDistribution,
    topMinistriesWithoutPublicity,
    minorContractWarnings,
  } = await getAggregatedData();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Movimientos de Dinero Público</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Supervisa adónde van tus impuestos. Todos los datos provienen directamente de la API oficial del{" "}
          <Tooltip
            content="Boletín Oficial del Estado: el diario donde el Gobierno publica todas sus leyes, contratos y ayudas públicas."
            className="text-primary font-medium border-b border-primary/30 hover:border-primary border-dashed cursor-help transition-colors"
          >
            BOE
          </Tooltip>{" "}
          — sin intermediarios ni datos simulados.
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 mb-1">
              Dinero Rastreado (Top 200)
            </span>
          </div>
          <span className="text-4xl font-black tracking-tight">
            {totalEuros > 0 ? formatEur(totalEuros) : "–"}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            Suma del valor adjudicado en los 200 anuncios analizados
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 mb-1">
              Volumen de Publicaciones
            </span>
          </div>
          <span className="text-4xl font-black tracking-tight">{totalAmount}</span>
          <span className="text-sm text-muted-foreground mt-1">
            Total de publicaciones detectadas en los últimos 60 días
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100 mb-1 leading-none inline-flex items-center gap-1">
              Troceado / Menores (Top 200)
            </span>
            <Tooltip icon content="Adjudicaciones directas sin concurso público, normalmente por importe inferior a 15.000 €.">
              {""}
            </Tooltip>
          </div>
          <span className="text-4xl font-black tracking-tight">{minorContracts}</span>
          <span className="text-sm text-muted-foreground mt-1">
            Adjudicaciones directas detectadas en los últimos analizados
          </span>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 h-[400px] rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <TrendChart
            data={monthlyTrend}
            title="Valor Adjudicado por Día (€)"
            metricLabel="Contratos Formalizados"
          />
        </div>
        <div className="col-span-1 h-[400px] rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <LatestActivity operations={latestRealOperations} />
        </div>
      </section>

      {/* Transparency / Procedure Focus */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-border shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow">
          <ProcedureRanking
            data={procedureDistribution}
            topNoPublicity={topMinistriesWithoutPublicity}
          />
        </div>
        <div className="lg:col-span-1 h-[450px] bg-card border border-border shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow">
          <FragmentationWarnings warnings={minorContractWarnings} />
        </div>
      </section>

      {/* Secondary charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[450px] rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <MoneyMap
            data={byRegion}
            title="Actividad por Organismo"
            label="Nº Licitaciones"
          />
        </div>
        <div className="h-[450px] rounded-2xl bg-card border border-border shadow-sm p-6 overflow-hidden hover:shadow-md transition-shadow">
          <TopRecipients
            data={topCompanies}
            title="Mayores Adjudicatarios (€)"
            unitLabel="Contratos"
          />
        </div>
      </section>

      {/* Live data badge */}
      <section className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-900">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">📡</span>
          <div>
            <h3 className="font-bold mb-1">Datos 100 % en tiempo real</h3>
            <p className="text-sm leading-relaxed opacity-90">
              Los valores monetarios se extraen directamente del XML oficial de cada anuncio de formalización publicado en el BOE.
              El importe adjudicado, el nombre de la empresa y su CIF proceden del campo 13.1/{" "}
              12.1 / 12.2 del estándar europeo de contratación.
              <strong> No hay bases de datos intermedias ni cifras estimadas.</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
