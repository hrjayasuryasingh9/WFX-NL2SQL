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
import { useEffect, useMemo, useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from "@/components/ui/input";

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export function ChartVisualization() {
    const {
        selectedChartType,
        setSelectedChartType,
        currentVisualMessage,
        showChart,
        toggleChart
    } = useSqlStore();

    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 30;
    const [range, setRange] = useState({ start: 0, end: 0 });
    const [error, setError] = useState("");



    const chartData = useMemo(() => {
        if (!currentVisualMessage) return [];

        const { columns, rows } = currentVisualMessage;

        return rows.map((row) => {
            const item: any = {};
            columns.forEach((col, index) => {
                const rawValue = row[index];
                const numValue = Number(rawValue);

                if (rawValue === true || rawValue === false) {
                    item[col] = rawValue;
                } else if (rawValue !== null && rawValue !== "" && !isNaN(numValue)) {
                    item[col] = numValue;
                } else {
                    item[col] = rawValue;
                }
            });

            const stringCols = columns.filter((c) => typeof item[c] === "string");
            if (stringCols.length > 1) {
                item.__label = stringCols.map((c) => item[c]).join(" - ");
            } else if (stringCols.length === 1) {
                item.__label = item[stringCols[0]];
            } else {
                item.__label = `Row ${Math.random().toString(36).slice(2, 6)}`;
            }
            return item;
        });
    }, [currentVisualMessage]);

    // Pagination
    useEffect(() => {
        if (chartData.length > 0) {
            setRange({
                start: 0,
                end: Math.min(pageSize, chartData.length) // default first 30 or all if less
            });
        }
    }, [chartData]);

    const totalPages = Math.ceil(chartData.length / pageSize);
    const paginatedData = useMemo(() => {
        if (!currentVisualMessage) return [];

        if (isNaN(range.start) || isNaN(range.end)) {
            setError("Start and End must be numbers");
            return [];
        }
        if (range.start < 0 || range.end > chartData.length) {
            setError(`Range must be between 0 and ${chartData.length}`);
            return [];
        }
        if (range.start >= range.end) {
            setError("Start must be less than End");
            return [];
        }

        setError("");
        return chartData.slice(range.start, range.end);
    }, [chartData, range]);

    // Suggested chart types
    const suggestedCharts = useMemo(() => {
        if (!paginatedData || paginatedData.length === 0) return [];

        const sampleRow = paginatedData[0];
        const numericColumns = Object.keys(sampleRow).filter(
            key => typeof sampleRow[key] === "number"
        );
        const stringColumns = Object.keys(sampleRow).filter(
            key => (typeof sampleRow[key] === "string" || typeof sampleRow[key] === "boolean") && key !== "__label"
        );

        const suggestions: ChartType[] = [];
        if (stringColumns.length === 1 && numericColumns.length === 1) {
            suggestions.push('bar', 'line', 'area', 'pie');
        } else if (stringColumns.length >= 1 && numericColumns.length > 1) {
            suggestions.push('bar', 'line', 'area');
        } else if (numericColumns.length === 1 && stringColumns.length === 0) {
            suggestions.push('bar');
        } else if (numericColumns.length === 2) {
            suggestions.push('line', 'area');
        } else if (numericColumns.length > 1 && stringColumns.length === 0) {
            suggestions.push('line', 'area');
        }

        return suggestions;
    }, [paginatedData]);

    if (!showChart || !chartData) return null;

    const renderChart = () => {
        if (!paginatedData || paginatedData.length === 0) return null;

        const sampleRow = paginatedData[0];
        const numericColumns = Object.keys(sampleRow).filter(key => typeof sampleRow[key] === 'number');

        const xAxisKey = "__label";
        const yAxisKey = numericColumns[0] || null;

        switch (selectedChartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={paginatedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsLineChart data={paginatedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />
                            ))}
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsAreaChart data={paginatedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip />
                            <Legend />
                            {numericColumns.map((key, index) => (
                                <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={CHART_COLORS[index % CHART_COLORS.length]} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.7} />
                            ))}
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                if (!yAxisKey) return <p>No numeric data for Pie chart</p>;
                const pieData = paginatedData.map((item, index) => ({
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
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                );
            default:
                return <p>No chart available for this data</p>;
        }
    };

    return (
        <Card className="fixed top-4 right-4 w-[500px] bg-card border border-border shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Data Visualization</h3>
                <Button variant="ghost" size="sm" onClick={() => toggleChart(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-4">
                {/* Chart Type Selector */}
                <div className="flex justify-between items-center mb-4 flex-wrap">
                    <div className="flex gap-2">
                        {[
                            { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar' },
                            { type: 'line' as ChartType, icon: LineChart, label: 'Line' },
                            { type: 'area' as ChartType, icon: AreaChart, label: 'Area' },
                            { type: 'pie' as ChartType, icon: PieChart, label: 'Pie' },
                        ].filter(c => suggestedCharts.includes(c.type))
                            .map(({ type, icon: Icon, label }) => (
                                <Button
                                    key={type}
                                    size="sm"
                                    onClick={() => setSelectedChartType(type)}
                                    className={`flex items-center ${selectedChartType === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-3 h-3 mr-1" />
                                    {label}
                                </Button>
                            ))}
                    </div>

                </div>
                <div className="flex gap-2 items-center mb-2">
                    <label className="text-sm font-medium text-foreground">Rows:</label>
                    <Input
                        type="number"
                        value={range.start}
                        onChange={(e) => setRange({ ...range, start: Number(e.target.value) })}
                        className="w-20"
                        placeholder="Start"
                    />
                    <span>to</span>
                    <Input
                        type="number"
                        value={range.end}
                        onChange={(e) => setRange({ ...range, end: Number(e.target.value) })}
                        className="w-20"
                        placeholder="End"
                    />
                </div>

                {/* Pagination Dropdown */}



                {/* {error && <p className="text-red-500 text-sm mb-2">{error}</p>} */}

                {/* Chart */}
                <div className="bg-background rounded-lg border border-border p-4">
                    {error ? <p className="text-muted-foreground">{error}</p> : renderChart()}
                </div>
            </div>
        </Card >
    );
}
