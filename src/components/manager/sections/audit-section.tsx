import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, createDataColumnHelper, type DataTableFilterOption } from "@/components/data-table";

type AuditEntry = Record<string, any>;

const columnHelper = createDataColumnHelper<AuditEntry>();

function actionLabel(action: string) {
  return String(action).split("_").join(" ");
}

interface AuditSectionProps {
  audit: AuditEntry[];
}

export function AuditSection({ audit }: AuditSectionProps) {
  const columns = [
    columnHelper.accessor("action", {
      header: "Action",
      filterFn: "equalsString",
      cell: (info) => <span className="font-semibold capitalize">{actionLabel(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-xs opacity-60">{JSON.stringify(row.original.details ?? {})}</span>
      ),
    }),
    columnHelper.accessor("at", {
      header: "When",
      cell: (info) => <span className="text-xs opacity-60">{new Date(info.getValue()).toLocaleString()}</span>,
    }),
  ];

  const actionOptions = Array.from(new Set(audit.map((a) => a.action).filter(Boolean)))
    .sort()
    .map((action) => ({ label: actionLabel(action), value: action }));

  const filters: DataTableFilterOption[] = [{ columnId: "action", label: "Actions", options: actionOptions }];

  return (
    <Card>
      <CardHeader>
        <span className="eyebrow">Audit trail</span>
        <CardTitle>Website updates & actions</CardTitle>
        <CardDescription>Every important action taken on the website or in this dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={audit}
          searchPlaceholder="Search audit trail…"
          emptyMessage="No audit activity yet."
          pageSize={10}
          filters={filters}
        />
      </CardContent>
    </Card>
  );
}
