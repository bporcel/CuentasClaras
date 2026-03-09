import { Tooltip } from "@/components/ui/tooltip";
import { getAggregatedData } from "@/lib/api";
import { MoneyMap } from "@/components/dashboard/MoneyMap";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { TopRecipients } from "@/components/dashboard/TopRecipients";
import { LatestActivity } from "@/components/dashboard/LatestActivity";
import { ProcedureRanking } from "@/components/dashboard/ProcedureRanking";
import { FragmentationWarnings } from "@/components/dashboard/FragmentationWarnings";
import { PlacspOvercosts } from "@/components/dashboard/PlacspOvercosts";
import { Activity, Euro, TrendingUp } from "lucide-react";

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
    procedureDistribution,
    topMinistriesWithoutPublicity,
    minorContractWarnings,
    topPlacspOvercosts,
    placspOvercostsValue,
    placspOvercostsCount,
  } = await getAggregatedData();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Movimientos de Dinero Público</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Supervisa adónde van tus impuestos. Datos directos del{" "}
          <Tooltip
            content="Boletín Oficial del Estado: el diario oficial donde el Gobierno publica todos sus contratos y adjudicaciones."
            className="text-primary font-medium border-b border-primary/30 hover:border-primary border-dashed cursor-help transition-colors"
          >
            BOE
          </Tooltip>{" "}
          y de la{" "}
          <Tooltip
            content="Plataforma de Contratación del Sector Público: el registro oficial de licitaciones y presupuestos estimados de cada contrato."
            className="text-primary font-medium border-b border-primary/30 hover:border-primary border-dashed cursor-help transition-colors"
          >
            PLACSP
          </Tooltip>
          {" "}— sin intermediarios ni datos estimados.
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total rastreado (BOE) */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">
              Dinero Rastreado · BOE
            </span>
          </div>
          <span className="text-4xl font-black tracking-tight">
            {totalEuros > 0 ? formatEur(totalEuros) : "–"}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            Valor total adjudicado en los últimos 200 contratos formalizados en el BOE
          </span>
        </div>

        {/* Publicaciones */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
              Publicaciones · 60 días
            </span>
          </div>
          <span className="text-4xl font-black tracking-tight">{totalAmount}</span>
          <span className="text-sm text-muted-foreground mt-1">
            Anuncios de contratación publicados en el BOE en los últimos 60 días
          </span>
        </div>

        {/* Sobrecostes PLACSP */}
        <div className="p-6 rounded-2xl bg-card border border-rose-200 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100">
              Pagado de Más · PLACSP
            </span>
            <Tooltip icon content="Diferencia entre el precio estimado al licitar y el precio final pagado. Suma de los contratos recientes de la Plataforma de Contratación del Estado donde el coste final superó el presupuesto base.">
              {""}
            </Tooltip>
          </div>
          <span className="text-4xl font-black tracking-tight text-rose-600">
            {placspOvercostsValue > 0 ? formatEur(placspOvercostsValue) : "–"}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            Extra pagado sobre el presupuesto inicial en {placspOvercostsCount} contratos recientes
          </span>
        </div>

      </section>

      {/* Charts: tendencia + actividad reciente */}
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

      {/* Sobrecostes PLACSP – sección con contexto claro */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🔍 ¿Se ha pagado de más en algún contrato?
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Cuando el Estado saca un contrato a concurso, publica un <strong>presupuesto estimado</strong>. Aquí mostramos los contratos donde el precio final adjudicado superó esa estimación inicial. Datos de la Plataforma de Contratación del Sector Público (PLACSP).
          </p>
        </div>
        <PlacspOvercosts data={topPlacspOvercosts} />
      </section>

      {/* Tipo de procedimiento + alertas de fragmentación */}
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

      {/* Mapa de organismos + mayores adjudicatarios */}
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

      {/* Fuentes de datos */}
      <section className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-900">
        <div className="flex items-start gap-4">
          <span className="text-2xl mt-0.5">📡</span>
          <div>
            <h3 className="font-bold mb-1">Datos 100% de fuentes oficiales del Estado</h3>
            <p className="text-sm leading-relaxed opacity-90">
              Los contratos y adjudicaciones se obtienen del <strong>BOE (Boletín Oficial del Estado)</strong>.
              Los presupuestos estimados y el cálculo de sobrecostes se obtienen de la <strong>PLACSP (Plataforma de Contratación del Sector Público)</strong>.
              Ambas son fuentes oficiales del Gobierno de España. No hay bases de datos intermedias ni cifras estimadas por nosotros.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
