import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import {
  performanceMonitor,
  PerformanceMetric,
} from '@/lib/performance-metrics';
import { initializePerformanceMonitoring } from '@/hooks/use-performance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  AlertCircle,
  BarChart2,
  Clock,
  Download,
  Play,
  RefreshCw,
  Save,
  StopCircle,
  Trash2,
} from 'lucide-react';

// Initialize performance monitoring
const performanceControls = initializePerformanceMonitoring();

const PerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [groupBy, setGroupBy] = useState<'name' | 'unit'>('name');

  // Fetch metrics
  const fetchMetrics = useCallback(() => {
    const allMetrics = performanceMonitor.getMetrics();
    setMetrics(allMetrics);
  }, []);

  // Filter metrics
  const filteredMetrics = useCallback(() => {
    if (!filterValue && filterType === 'all') {
      return metrics;
    }

    return metrics.filter((metric) => {
      if (filterType === 'name') {
        return metric.name.toLowerCase().includes(filterValue.toLowerCase());
      } else if (filterType === 'unit') {
        return metric.unit.toLowerCase() === filterValue.toLowerCase();
      } else if (filterType === 'value') {
        const numValue = parseFloat(filterValue);
        return !isNaN(numValue) && metric.value >= numValue;
      }
      return true;
    });
  }, [metrics, filterType, filterValue]);

  // Group metrics by name or unit
  const groupedMetrics = useCallback(() => {
    const grouped: Record<string, PerformanceMetric[]> = {};

    filteredMetrics().forEach((metric) => {
      const key = groupBy === 'name' ? metric.name : metric.unit;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });

    return grouped;
  }, [filteredMetrics, groupBy]);

  // Format metrics for charts
  const formatMetricsForChart = useCallback(
    (metricName: string) => {
      const metricsForName = metrics.filter((m) => m.name === metricName);

      return metricsForName.map((metric) => ({
        timestamp: new Date(metric.timestamp).toLocaleTimeString(),
        value: metric.value,
        name: metric.name,
        unit: metric.unit,
      }));
    },
    [metrics],
  );

  // Get unique metric names
  const uniqueMetricNames = useCallback(() => {
    const names = new Set<string>();
    metrics.forEach((metric) => names.add(metric.name));
    return Array.from(names);
  }, [metrics]);

  // Get average values by metric name
  const averageValuesByName = useCallback(() => {
    const sums: Record<string, { total: number; count: number }> = {};

    metrics.forEach((metric) => {
      if (!sums[metric.name]) {
        sums[metric.name] = { total: 0, count: 0 };
      }
      sums[metric.name].total += metric.value;
      sums[metric.name].count += 1;
    });

    return Object.entries(sums).map(([name, { total, count }]) => ({
      name,
      value: total / count,
      count,
    }));
  }, [metrics]);

  // Start monitoring
  const startMonitoring = () => {
    performanceControls.stopMonitoring();
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    performanceControls.stopMonitoring();
    setIsMonitoring(false);
  };

  // Clear metrics
  const clearMetrics = () => {
    performanceControls.clearMetrics();
    setMetrics([]);
  };

  // Export metrics as JSON
  const exportMetrics = () => {
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `performance-metrics-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();

    // Set up listener for new metrics
    const removeListener = performanceMonitor.addListener(() => {
      if (autoRefresh) {
        fetchMetrics();
      }
    });

    return () => {
      removeListener();
    };
  }, [fetchMetrics, autoRefresh]);

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor and analyze application performance metrics
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isMonitoring ? (
                <Button
                  variant="outline"
                  onClick={stopMonitoring}
                  className="flex items-center gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop Monitoring
                </Button>
              ) : (
                <Button
                  onClick={startMonitoring}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Monitoring
                </Button>
              )}

              <Button
                variant="outline"
                onClick={clearMetrics}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Metrics
              </Button>

              <Button
                variant="outline"
                onClick={exportMetrics}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.length}</div>
                <p className="text-xs text-muted-foreground">
                  {isMonitoring ? 'Actively monitoring' : 'Monitoring paused'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {uniqueMetricNames().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Distinct metric types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Average FPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.filter((m) => m.name === 'fps').length > 0
                    ? Math.round(
                        metrics
                          .filter((m) => m.name === 'fps')
                          .reduce((sum, m) => sum + m.value, 0) /
                          Math.max(
                            1,
                            metrics.filter((m) => m.name === 'fps').length,
                          ),
                      )
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Frames per second
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monitoring Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.length > 0
                    ? `${Math.round((Date.now() - metrics[0].timestamp) / 1000)}s`
                    : '0s'}
                </div>
                <p className="text-xs text-muted-foreground">Time elapsed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>
                  Filter and manage performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filterType">Filter Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger id="filterType">
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Metrics</SelectItem>
                        <SelectItem value="name">By Name</SelectItem>
                        <SelectItem value="unit">By Unit</SelectItem>
                        <SelectItem value="value">By Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filterValue">Filter Value</Label>
                    <Input
                      id="filterValue"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder={
                        filterType === 'name'
                          ? 'Enter metric name...'
                          : filterType === 'unit'
                            ? 'Enter unit (ms, fps, MB)...'
                            : filterType === 'value'
                              ? 'Enter minimum value...'
                              : 'Enter filter value...'
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupBy">Group By</Label>
                    <Select
                      value={groupBy}
                      onValueChange={(value) =>
                        setGroupBy(value as 'name' | 'unit')
                      }
                    >
                      <SelectTrigger id="groupBy">
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Group by Name</SelectItem>
                        <SelectItem value="unit">Group by Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="autoRefresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="autoRefresh">Auto-refresh metrics</Label>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMetrics}
                    className="ml-auto flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="fps">FPS</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Metric Values</CardTitle>
                    <CardDescription>
                      Average values for each metric type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {averageValuesByName().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={averageValuesByName()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 70,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={70}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                `${value}`,
                                'Average Value',
                              ]}
                              labelFormatter={(name) => `Metric: ${name}`}
                            />
                            <Legend />
                            <Bar
                              dataKey="value"
                              fill="#8884d8"
                              name="Average Value"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No metrics available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Metrics by Type</CardTitle>
                    <CardDescription>Count of metrics by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      {averageValuesByName().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={averageValuesByName()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 70,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={70}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [`${value}`, 'Count']}
                              labelFormatter={(name) => `Metric: ${name}`}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" name="Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">
                            No metrics available
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="fps">
              <Card>
                <CardHeader>
                  <CardTitle>FPS Over Time</CardTitle>
                  <CardDescription>
                    Frames per second performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {formatMetricsForChart('fps').length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatMetricsForChart('fps')}
                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis domain={[0, 'dataMax + 10']} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            name="FPS"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No FPS data available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          FPS metrics will appear as the application runs
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memory">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>
                    JavaScript heap memory usage over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {formatMetricsForChart('memory:used').length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatMetricsForChart('memory:used')}
                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis domain={[0, 'dataMax + 10']} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#82ca9d"
                            name="Memory Used (MB)"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No memory data available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Memory metrics may not be available in all browsers
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components">
              <Card>
                <CardHeader>
                  <CardTitle>Component Render Times</CardTitle>
                  <CardDescription>
                    Performance metrics for React components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(groupedMetrics())
                      .filter(
                        ([key]) =>
                          key.includes('component:') && key.includes(':render'),
                      )
                      .map(([key, componentMetrics]) => {
                        const avgRenderTime =
                          componentMetrics.reduce(
                            (sum, m) => sum + m.value,
                            0,
                          ) / componentMetrics.length;

                        return (
                          <div key={key} className="border rounded-lg p-4">
                            <h3 className="text-lg font-medium mb-2">{key}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-muted p-3 rounded-md text-center">
                                <div className="text-2xl font-bold">
                                  {componentMetrics.length}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Render Count
                                </div>
                              </div>
                              <div className="bg-muted p-3 rounded-md text-center">
                                <div className="text-2xl font-bold">
                                  {avgRenderTime.toFixed(2)} ms
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Average Render Time
                                </div>
                              </div>
                              <div className="bg-muted p-3 rounded-md text-center">
                                <div className="text-2xl font-bold">
                                  {Math.max(
                                    ...componentMetrics.map((m) => m.value),
                                  ).toFixed(2)}{' '}
                                  ms
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Max Render Time
                                </div>
                              </div>
                            </div>

                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={componentMetrics.map((m) => ({
                                    timestamp: new Date(
                                      m.timestamp,
                                    ).toLocaleTimeString(),
                                    value: m.value,
                                  }))}
                                  margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="timestamp" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    name="Render Time (ms)"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}

                    {Object.entries(groupedMetrics()).filter(
                      ([key]) =>
                        key.includes('component:') && key.includes(':render'),
                    ).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No component metrics available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Component metrics will appear as components are
                          rendered
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Metrics Data</CardTitle>
                  <CardDescription>
                    All collected metrics in tabular format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredMetrics().length > 0 ? (
                    <div className="border rounded-md">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Value</th>
                              <th className="px-4 py-2 text-left">Unit</th>
                              <th className="px-4 py-2 text-left">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMetrics().map((metric, index) => (
                              <tr
                                key={index}
                                className={
                                  index % 2 === 0
                                    ? 'bg-background'
                                    : 'bg-muted/50'
                                }
                              >
                                <td className="px-4 py-2 font-mono text-sm">
                                  {metric.name}
                                </td>
                                <td className="px-4 py-2">
                                  {metric.value.toFixed(2)}
                                </td>
                                <td className="px-4 py-2">{metric.unit}</td>
                                <td className="px-4 py-2">
                                  {new Date(metric.timestamp).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No metrics found</AlertTitle>
                      <AlertDescription>
                        No metrics match your current filter criteria.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default PerformanceDashboard;
