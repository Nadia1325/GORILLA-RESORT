import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, createDataColumnHelper } from "@/components/data-table";

type Subscriber = Record<string, any>;

const columnHelper = createDataColumnHelper<Subscriber>();

interface SubscribersSectionProps {
  subscribers: Subscriber[];
  busyId: string;
  onDelete: (subscriber: Subscriber) => void;
}

export function SubscribersSection({ subscribers, busyId, onDelete }: SubscribersSectionProps) {
  const columns = [
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("source", {
      header: "Source",
      cell: (info) => <span className="text-xs opacity-60">{info.getValue() || "website"}</span>,
    }),
    columnHelper.accessor("subscribedAt", {
      header: "Subscribed",
      cell: (info) => <span className="text-xs opacity-60">{new Date(info.getValue()).toLocaleString()}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          loading={busyId === row.original.id}
          className="text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300"
          onClick={() => onDelete(row.original)}
        >
          Delete
        </Button>
      ),
    }),
  ];

  return (
    <Card>
      <CardHeader>
        <span className="eyebrow">Audience</span>
        <CardTitle>Subscribers</CardTitle>
        <CardDescription>Everyone who joined the newsletter list from the website.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={subscribers.slice().reverse()}
          searchPlaceholder="Search subscribers…"
          emptyMessage="No subscribers."
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}
