import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, BarChart3 } from 'lucide-react';
import { QueryResult, useSqlStore } from '@/store/sqlStore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataTableProps {
    result: QueryResult;
}

export function DataTable({ result }: DataTableProps) {
    const { toggleChart } = useSqlStore();

    const downloadCSV = () => {
        const headers = result.columns.join(',');
        const rows = result.rows.map(row => row.join(',')).join('\n');
        const csvContent = `${headers}\n${rows}`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-[800px] mx-auto">
            <div className="space-y-4 w-full">
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 px-2 sm:px-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCSV}
                        className="text-muted-foreground border-border hover:bg-muted hover:text-foreground transition-smooth text-xs sm:text-sm"
                    >
                        <Download className="w-3 h-3 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Download </span>CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleChart}
                        className="text-muted-foreground border-border hover:bg-muted hover:text-foreground transition-smooth text-xs sm:text-sm"
                    >
                        <BarChart3 className="w-3 h-3 mr-1 sm:mr-2" />
                        Visualize
                    </Button>
                </div>

                {/* Table Card */}
                <div className="w-full border border-border rounded-lg bg-card overflow-hidden">
                    {/* Scroll container */}
                    <div className="w-72 sm:w-full overflow-x-auto overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <Table className="w-full  overflow-hidden">
                            <TableHeader>
                                <TableRow className="bg-white border-b border-border hover:bg-gray-100">
                                    {result.columns.map((column, index) => (
                                        <TableHead
                                            key={index}
                                            className="text-foreground font-medium text-xs sm:text-sm uppercase tracking-wide sticky top-0 bg-white z-10 px-2 sm:px-4 py-2 sm:py-3 min-w-[100px]"
                                        >
                                            <div className="truncate" title={column}>
                                                {column}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.rows.map((row, rowIndex) => (
                                    <TableRow
                                        key={rowIndex}
                                        className="hover:bg-gray-100 transition-smooth border-b border-border/50"
                                    >
                                        {row.map((cell, cellIndex) => (
                                            <TableCell
                                                key={cellIndex}
                                                className="text-xs sm:text-sm text-foreground py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap min-w-[100px]"
                                            >
                                                <div
                                                    className="truncate max-w-[120px] sm:max-w-none"
                                                    title={
                                                        typeof cell === "number"
                                                            ? cell.toLocaleString()
                                                            : String(cell)
                                                    }
                                                >
                                                    {typeof cell === "number"
                                                        ? cell.toLocaleString()
                                                        : String(cell)}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>



                {/* Row count info */}
                <div className="text-xs text-muted-foreground px-2 sm:px-0">
                    Showing {result.rows.length} rows × {result.columns.length} columns
                </div>

                {/* Mobile scroll hint */}
                <div className="text-xs text-muted-foreground px-2 sm:px-0 sm:hidden">
                    💡 Scroll horizontally to see more columns
                </div>
            </div>
        </div>
    );
}

