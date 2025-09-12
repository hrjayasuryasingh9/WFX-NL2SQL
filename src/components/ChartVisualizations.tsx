import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BarChart3, LineChart, PieChart, AreaChart } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart as RechartsLineChart,
    Line,
    PieChart as RechartsPieChart,
    Cell,
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Pie
} from 'recharts';
import { useSqlStore, ChartType } from '@/store/sqlStore';
import { useMemo } from 'react';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export function ChartVisualization() {
    const {
        currentConversation,
        selectedChartType,
        setSelectedChartType,
        showChart,
        toggleChart
    } = useSqlStore();

    const chartData = useMemo(() => {
        if (!currentConversation?.messages) return null;

        const lastMessage = currentConversation.messages
            .filter(m => m.type === 'assistant' && m.result)
            .pop();

        if (!lastMessage?.result) return null;

        const { columns, rows } = lastMessage.result;

        return rows.map((row) => {
            const item: any = {};
            columns.forEach((col, index) => {
                item[col] = row[index];
            });
            return item;
        });
    }, [currentConversation]);

    if (!showChart || !chartData) return null;

    const renderChart = () => {
        const numericColumns = chartData.length > 0
            ? Object.keys(chartData[0]).filter(key =>
                typeof chartData[0][key] === 'number'
            )
            : [];

        const stringColumns = chartData.length > 0
            ? Object.keys(chartData[0]).filter(key =>
                typeof chartData[0][key] === 'string'
            )
            : [];

        const xAxisKey = stringColumns[0] || Object.keys(chartData[0])[0];
        const yAxisKey = numericColumns[0] || Object.keys(chartData[0])[1];

        switch (selectedChartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            ))}
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsAreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stackId="1"
                                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    fillOpacity={0.7}
                                />
                            ))}
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                const pieData = chartData.map((item, index) => ({
                    name: item[xAxisKey],
                    value: item[yAxisKey] || 0,
                    fill: CHART_COLORS[index % CHART_COLORS.length]
                }));

                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsPieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="fixed top-4 right-4 w-[500px] bg-card border border-border shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Data Visualization</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleChart}
                    className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-4">
                {/* Chart Type Selector */}
                <div className="flex gap-2 mb-4">
                    {[
                        { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar' },
                        { type: 'line' as ChartType, icon: LineChart, label: 'Line' },
                        { type: 'area' as ChartType, icon: AreaChart, label: 'Area' },
                        { type: 'pie' as ChartType, icon: PieChart, label: 'Pie' },
                    ].map(({ type, icon: Icon, label }) => (
                        <Button
                            key={type}
                            size="sm"
                            onClick={() => setSelectedChartType(type)}
                            className={`transition-all flex items-center ${selectedChartType === type
                                ? 'bg-blue-600 text-white hover:bg-blue-600/90'
                                : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            <Icon className="w-3 h-3 mr-1" />
                            {label}
                        </Button>
                    ))}
                </div>

                {/* Chart */}
                <div className="bg-background rounded-lg border border-border p-4">
                    {renderChart()}
                </div>
            </div>
        </Card>
    );
}