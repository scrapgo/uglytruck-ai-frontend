import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

type TruckRow = Record<string, any>;

const statusColors: Record<string, string> = {
  "CLOSED": "bg-gray-700 text-white",
  "Complete": "bg-emerald-600 text-white",
  "Contacted": "bg-blue-600 text-white",
  "Contacted, VM": "bg-blue-400 text-white",
  "DNC": "bg-red-700 text-white",
  "Docs Received": "bg-indigo-600 text-white",
  "Does not meet Expectations": "bg-gray-500 text-white",
  "FUNDED": "bg-orange-600 text-white",
  "NQ": "bg-red-500 text-white",
  "Need Pics": "bg-yellow-500 text-black",
  "New Lead": "bg-lime-500 text-black",
  "Next Steps": "bg-cyan-600 text-white",
  "No Longer Available": "bg-neutral-600 text-white",
  "No Quote": "bg-stone-700 text-white",
  "Offer Declined": "bg-rose-600 text-white",
  "Offer Expired": "bg-orange-300 text-black",
  "Offer Made": "bg-blue-500 text-white",
  "Offer Made EXPIRED": "bg-orange-800 text-white",
  "SOLD": "bg-green-700 text-white",
  "Sold to Other": "bg-red-800 text-white",
  "sold to other": "bg-red-800 text-white",
  "Unresponsive/Follow Up": "bg-gray-400 text-black",
};

const communicationStatusMap = {
  0: { label: "Pending", color: "bg-yellow-500" },
  1: { label: "Pending", color: "bg-yellow-500" },
  2: { label: "No Email Needed", color: "bg-gray-500" },
  3: { label: "Completed", color: "bg-green-600" },
};
const Trucks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [fullTrucks, setFullTrucks] = useState<TruckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedTruck, setSelectedTruck] = useState<TruckRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchKeys = [
  "Last Name",
  "Location (City)",
  "Year",
  "Make",
  "Model",
  "VIN",
  "Mileage",
  "Engine",
  "Transmission",
  "Seller Phone",
  "Seller Email",
  "Status",
  "Communication Status",  // ⬅️ NEW COLUMN
];

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const fetchTrucks = async (pageNum: number, limitNum: number, table_name: string=import.meta.env.VITE_DB_TABLE_NAME) => {
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/database/paginated_fetch_table?table_name=${table_name}&page=${pageNum}&limit=${limitNum}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);

      const data = await response.json();
      const rows: TruckRow[] = data.data || [];

      setPage(data.page ?? pageNum);
      setRowsPerPage(data.limit ?? limitNum);
      setTotalPages(data.total_pages ?? 1);

      setFullTrucks(rows);

      const filteredData = rows.map((row: TruckRow) =>
        Object.fromEntries(fetchKeys.map(key => [key, row[key] ?? null]))
      );

      setTrucks(filteredData);

      toast({
        title: "Data Loaded",
        description: `Retrieved ${rows.length} records`,
      });

    } catch (error) {
      console.error("Error fetching trucks:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive",
      });
      setTrucks([]);
      setFullTrucks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const filtered = trucks
    .map((row, idx) => ({ row, full: fullTrucks[idx] }))
    .filter(({ row }) => {
      if (!debouncedSearch) return true;
      const searchLower = debouncedSearch.toLowerCase();
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchLower)
      );
    });

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Truck Inventory</h2>
            <p className="text-muted-foreground mt-1">Manage and track all trucks in the pipeline</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <Button
              onClick={() => fetchTrucks(page, rowsPerPage)}
              disabled={loading}
              size="icon"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading Records...
                </div>
              ) : (
                `Page ${page} of ${totalPages}`
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-4">Fetching data...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No records found.</div>
            ) : (
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fetchKeys.map((header) => (
                        <TableHead
                          key={header}
                          className={header === "Status" ? "min-w-[150px]" : ""}
                        >
                          {header}
                        </TableHead>
                      ))}

                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map(({ row, full }, idx) => (
                      <TableRow key={idx}>
                        {fetchKeys.map((header) => {
                          const value = row[header];

                          // --- MAIN STATUS BADGE ---
                          if (header === "Status") {
                            const color = statusColors[value] || "bg-gray-300 text-black";
                            return (
                              <TableCell key={header} className="min-w-[150px]">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${color}`}
                                >
                                  {value}
                                </span>
                              </TableCell>
                            );
                          }

                          // --- COMMUNICATION STATUS BADGE ---
                          if (header === "Communication Status") {
                            const statusInfo =
                              communicationStatusMap[value] || {
                                label: "Unknown",
                                color: "bg-gray-400",
                              };

                            return (
                              <TableCell key={header} className="min-w-[140px]">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap text-white ${statusInfo.color}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </TableCell>
                            );
                          }

                          // --- DEFAULT TEXT COLUMN ---
                          return <TableCell key={header}>{String(value ?? "")}</TableCell>;
                        })}

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* PAGINATION */}
          {!loading && trucks.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setPage(1);
                    setRowsPerPage(newLimit);
                  }}
                  className="border rounded-md p-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <p className="text-sm">Page {page} of {totalPages}</p>

              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
};

export default Trucks;
