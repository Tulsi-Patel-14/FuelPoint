import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Wrench, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/primitives";
import { adminService, formatDate } from "@/services/adminService";

export const Route = createFileRoute("/_admin/search")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const { q } = Route.useSearch();
  const rawQ = q.trim().toLowerCase();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rawQ) {
      setResults([]);
      return;
    }
    setLoading(true);
    adminService.globalSearch(rawQ)
      .then((data) => setResults(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [rawQ]);

  if (!rawQ) {
    return (
      <div className="space-y-6">
        <PageHeader title="Search" description="Enter a query to search across customers and workers." />
        <Panel className="p-12 text-center text-muted-foreground">
          Type in the top bar to begin searching.
        </Panel>
      </div>
    );
  }

  const filteredCustomers = results.filter(r => r.type === 'customer');
  const filteredWorkers = results.filter(r => r.type === 'worker');
  const filteredGroups = results.filter(r => r.type === 'group');

  const hasResults = results.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Results"
        description={`Showing results for "${q}"`}
      />

      {loading && (
        <Panel className="p-12 text-center text-muted-foreground">
          Searching...
        </Panel>
      )}

      {!loading && !hasResults && (
        <Panel className="p-12 text-center text-muted-foreground">
          No results found for "{q}".
        </Panel>
      )}

      {!loading && filteredCustomers.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Users className="size-4 text-primary" />
              Customers ({filteredCustomers.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {filteredCustomers.map((c) => (
              <Link
                key={c.id}
                to="/customers"
                search={{ q: c.name, highlight: c.id }}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{c.name}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {!loading && filteredWorkers.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Wrench className="size-4 text-teal" />
              Workers ({filteredWorkers.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {filteredWorkers.map((w) => (
              <Link
                key={w.id}
                to="/workers"
                search={{ q: w.name, highlight: w.id }}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{w.name}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {!loading && filteredGroups.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Users className="size-4 text-emerald-500" />
              Groups ({filteredGroups.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {filteredGroups.map((g) => (
              <Link
                key={g.id}
                to="/groups"
                search={{ highlight: g.id }}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{g.name}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
