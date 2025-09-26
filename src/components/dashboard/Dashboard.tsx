import { useMemo } from "react"; // Import useMemo
import { StatsCard } from "./StatsCard";
import { RecentIncidents } from "./RecentIncidents";
import { RiskChart } from "./RiskChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Users, 
  Plus,
  Activity,
  Shield,
  Truck,
  CheckCircle, // New import
  XCircle,     // New import
  UserCheck,   // New import
  UserX,       // New import
  Loader2,     // Added Loader2 import
} from "lucide-react";
import { WelcomeCard } from "./WelcomeCard";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { Tables } from "@/integrations/supabase/types"; // Import Tables type
import { DriverIndicacaoChart } from "./DriverIndicacaoChart"; // New chart component

type Driver = Tables<'drivers'>;

export const Dashboard = ({ onNewIncident }: { onNewIncident: () => void }) => {
  // Fetch drivers data
  const { data: drivers, isLoading: isLoadingDrivers, error: driversError } = useQuery<Driver[], Error>({
    queryKey: ['dashboardDrivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    if (!drivers) {
      return {
        omnilinkEmDia: 0,
        omnilinkInapto: 0,
        indicados: 0,
        naoIndicados: 0,
      };
    }

    const omnilinkEmDia = drivers.filter(d => d.omnilink_score_status === 'em_dia').length;
    const omnilinkInapto = drivers.filter(d => d.omnilink_score_status === 'inapto').length;
    const indicados = drivers.filter(d => d.status_indicacao === 'indicado' || d.status_indicacao === 'retificado').length;
    const naoIndicados = drivers.filter(d => d.status_indicacao === 'nao_indicado').length;

    return {
      omnilinkEmDia,
      omnilinkInapto,
      indicados,
      naoIndicados,
    };
  }, [drivers]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard />

      {/* Header Actions (simplified as welcome is now in WelcomeCard) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-muted-foreground">
            Indicadores e ocorrências recentes
          </p>
        </div>
        <Button 
          onClick={onNewIncident}
          className="bg-gradient-corporate shadow-corporate hover:shadow-elevated w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"> {/* Adjusted grid-cols for more cards */}
        <StatsCard
          title="Total de Ocorrências"
          value={124}
          icon={FileText}
          trend={{ value: 12, label: "este mês" }}
        />
        <StatsCard
          title="Ocorrências Graves"
          value={8}
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: -5, label: "vs mês anterior" }}
        />
        <StatsCard
          title="Motoristas Ativos"
          value={45}
          icon={Users}
          variant="success"
        />
        <StatsCard
          title="Valor em Risco"
          value="R$ 2.4M"
          icon={TrendingUp}
          variant="destructive"
          trend={{ value: 8, label: "este mês" }}
        />
        {/* New Driver Stats Cards */}
        <StatsCard
          title="Omnilink Em Dia"
          value={isLoadingDrivers ? "..." : driverStats.omnilinkEmDia}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title="Omnilink Inapto"
          value={isLoadingDrivers ? "..." : driverStats.omnilinkInapto}
          icon={XCircle}
          variant="destructive"
        />
        <StatsCard
          title="Motoristas Indicados"
          value={isLoadingDrivers ? "..." : driverStats.indicados}
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Motoristas Não Indicados"
          value={isLoadingDrivers ? "..." : driverStats.naoIndicados}
          icon={UserX}
          variant="destructive"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-4"> {/* Adjusted to 4 columns */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Distribuição de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskChart />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Indicadores Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">CNH Vencidas</span>
              </div>
              <span className="text-sm font-bold text-destructive">3</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Falhas Omnilink</span>
              </div>
              <span className="text-sm font-bold text-warning">2</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <span className="text-sm font-bold text-accent">7</span>
            </div>
          </CardContent>
        </Card>

        {/* New Driver Indication Status Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Status de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDrivers ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DriverIndicacaoChart
                indicados={driverStats.indicados}
                naoIndicados={driverStats.naoIndicados}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <RecentIncidents />
    </div>
  );
};