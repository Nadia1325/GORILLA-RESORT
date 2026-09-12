import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, createDataColumnHelper } from "@/components/data-table";

type EmailLog = Record<string, any>;

const columnHelper = createDataColumnHelper<EmailLog>();

interface EmailActivitySectionProps {
  emails: EmailLog[];
}

export function EmailActivitySection({ emails }: EmailActivitySectionProps) {
  const columns = [
    columnHelper.accessor("subject", { header: "Subject" }),
    columnHelper.display({
      id: "to",
      header: "To",
      cell: ({ row }) => <span className="text-xs opacity-60">{(row.original.to || []).join(", ")}</span>,
    }),
    columnHelper.accessor("at", {
      header: "Sent",
      cell: (info) => <span className="text-xs opacity-60">{new Date(info.getValue()).toLocaleString()}</span>,
    }),
  ];

  return (
    <Card>
      <CardHeader>
        <span className="eyebrow">Email activity</span>
        <CardTitle>Website-generated Gmail activity</CardTitle>
        <CardDescription>This shows emails sent by the website. It does not read private Gmail inbox contents.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={emails}
          searchPlaceholder="Search email activity…"
          emptyMessage="No email activity logged yet."
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}
