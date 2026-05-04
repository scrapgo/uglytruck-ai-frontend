import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Database, Play, Loader2, Bot, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
];

const Dashboard = () => {
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [imageAnalysisRunning, setImageAnalysisRunning] = useState(false);
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [imageAnalysisResponse, setImageAnalysisResponse] = useState<any>(null);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Analytics data
  const [statusData, setStatusData] = useState<any[]>([]);
  const [communicationData, setCommunicationData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [makeData, setMakeData] = useState<any[]>([]);

  // Database metrics
  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    totalFields: 0,
    dataSize: '0.0KB',
    lastSync: 'Not synced',
  });

  const { toast } = useToast();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // -----------------------------
  // Fetch analytics data
  // -----------------------------
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [statusRes, commRes, sourceRes, makeRes] = await Promise.all([
        fetch(`${baseURL}/analytics/status`),
        fetch(`${baseURL}/analytics/communication`),
        fetch(`${baseURL}/analytics/source`),
        fetch(`${baseURL}/analytics/make_distribution`),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatusData(data.items || []);
      }

      if (commRes.ok) {
        const data = await commRes.json();
        setCommunicationData(data.items || []);
      }

      if (sourceRes.ok) {
        const data = await sourceRes.json();
        setSourceData(data.items || []);
      }

      if (makeRes.ok) {
        const data = await makeRes.json();
        setMakeData(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Analytics Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // -----------------------------
  // Fetch database metrics
  // -----------------------------
  const fetchDatabaseMetrics = async () => {
    try {
      const dbRes = await fetch(`${baseURL}/database/paginated_fetch_table`);
      if (!dbRes.ok) throw new Error(`DB fetch failed (${dbRes.status})`);

      const dbData = await dbRes.json();

      if (dbData.data?.length > 0) {
        const headers = Object.keys(dbData.data[0]);

        setMetrics({
          totalRecords: dbData.total_records ?? dbData.data.length,
          totalFields: headers.length,
          dataSize: `${(JSON.stringify(dbData.data).length / 1024).toFixed(1)}KB`,
          lastSync: dbData.last_sync
            ? new Date(dbData.last_sync).toLocaleString()
            : new Date().toLocaleString(),
        });
      }
    } catch (err) {
      console.error('Error fetching DB metrics:', err);
      toast({
        title: 'Database Metrics Error',
        description:
          err instanceof Error ? err.message : 'Failed to load database metrics',
        variant: 'destructive',
      });
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalytics();
    fetchDatabaseMetrics();
  }, []);

  // -----------------------------
  // WORKFLOW SYNC HANDLER
  // -----------------------------
  const handleTriggerWorkflow = async () => {
    setWorkflowRunning(true);

    toast({
      title: 'Starting Fetch',
      description: 'Fetching tables and records from Quickbase...',
    });

    try {
      const fetchRes = await fetch(`${baseURL}/quickbase/fetch_table`);
      if (!fetchRes.ok) throw new Error(`Fetch failed (${fetchRes.status})`);
      await fetchRes.json();

      toast({ title: 'Step 1 Complete', description: 'Quickbase data fetched.' });

      const dumpRes = await fetch(`${baseURL}/quickbase/dump_table`, {
        method: 'PUT',
      });
      if (!dumpRes.ok) throw new Error(`Dump failed (${dumpRes.status})`);
      const dumpData = await dumpRes.json();

      toast({ title: 'Workflow Completed', description: dumpData.message });

      // Refresh analytics + metrics after sync
      fetchAnalytics();
      fetchDatabaseMetrics();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Workflow failed',
        variant: 'destructive',
      });
    } finally {
      setWorkflowRunning(false);
    }
  };

  // -----------------------------
  // IMAGE ANALYZER
  // -----------------------------
  const handleImageAnalysis = async () => {
    setImageAnalysisRunning(true);
    setImageAnalysisResponse(null);

    toast({
      title: 'Starting Image Analysis',
      description: 'Processing data validation...',
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/agent/data-validator`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error(`Image analysis failed (${response.status})`);
      const data = await response.json();

      setImageAnalysisResponse(data);

      toast({ title: 'Analysis Complete', description: 'Image analysis succeeded' });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Image analysis failed',
        variant: 'destructive',
      });
    } finally {
      setImageAnalysisRunning(false);
    }
  };

  // -----------------------------
  // CALL AGENT
  // -----------------------------
  const handleCallAgent = async () => {
    setAgentRunning(true);
    setAgentResponse(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/agent/init`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error(`Agent call failed (${response.status})`);
      const data = await response.json();

      setAgentResponse(data);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Agent call failed',
        variant: 'destructive',
      });
    } finally {
      setAgentRunning(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your truck resale pipeline
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleTriggerWorkflow}
            disabled={workflowRunning}
            className="flex items-center gap-2"
          >
            {workflowRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Fetch & Sync Data
          </Button>

          <Button
            onClick={handleImageAnalysis}
            disabled={imageAnalysisRunning}
            className="flex items-center gap-2"
          >
            {imageAnalysisRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            Run Data Validator
          </Button>

          <Button
            onClick={handleCallAgent}
            disabled={agentRunning}
            className="flex items-center gap-2"
          >
            {agentRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bot className="w-5 h-5" />
            )}
            Call Agent
          </Button>
        </div>

        {/* ---------------------- */}
        {/*      DATABASE METRICS  */}
        {/* ---------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Database Metrics</CardTitle>
            <CardDescription>Summary of Unbounce Leads table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricItem
                label="Total Records"
                value={metrics.totalRecords}
                sub="Synced from Quickbase"
              />
              <MetricItem
                label="Total Fields"
                value={metrics.totalFields}
                sub="Columns in dataset"
              />
              <MetricItem
                label="Data Size"
                value={metrics.dataSize}
                sub="Approx. JSON size"
              />
              <MetricItem
                label="Last Sync"
                value={metrics.lastSync}
                sub="Most recent update"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        {loadingAnalytics ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            {statusData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Count of trucks by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Count', color: 'hsl(var(--primary))' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="status"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[8, 8, 0, 0]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Communication Status */}
            {communicationData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Communication Status
                  </CardTitle>
                  <CardDescription>Email communication tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Count', color: 'hsl(var(--primary))' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={communicationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="label"
                          label={false}   // ⬅ disable labels
                        >
                          {communicationData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconType="circle"
                        />

                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>

                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Source Distribution */}
            {sourceData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Source Distribution
                  </CardTitle>
                  <CardDescription>Inbound vs Outbound leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Count', color: 'hsl(var(--secondary))' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sourceData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="source"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--secondary))"
                          radius={[8, 8, 0, 0]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Make Distribution */}
            {makeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Make Distribution
                  </CardTitle>
                  <CardDescription>Top truck brands in inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: 'Count', color: 'hsl(var(--accent))' },
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={makeData.slice(0, 10)}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="make"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--accent))"
                          radius={[8, 8, 0, 0]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Image Analysis Result */}
        {imageAnalysisResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Image Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs p-4 rounded bg-muted max-h-[400px] overflow-auto">
                {JSON.stringify(imageAnalysisResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Agent Result */}
        {agentResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded bg-muted text-sm text-foreground">
                {agentResponse?.message || 'No message available'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

const MetricItem = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) => (
  <div>
    <p className="font-semibold">{label}</p>
    <p>{value}</p>
    <p className="text-muted-foreground text-sm">{sub}</p>
  </div>
);

export default Dashboard;
