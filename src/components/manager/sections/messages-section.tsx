import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, createDataColumnHelper } from "@/components/data-table";

type Message = Record<string, any>;

const columnHelper = createDataColumnHelper<Message>();

interface MessagesSectionProps {
  messages: Message[];
  busyId: string;
  onDelete: (message: Message) => void;
}

export function MessagesSection({ messages, busyId, onDelete }: MessagesSectionProps) {
  const columns = [
    columnHelper.accessor("name", {
      header: "From",
      cell: (info) => (
        <div>
          <p className="font-semibold">{info.getValue()}</p>
          <p className="text-xs opacity-50">{info.row.original.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("message", {
      header: "Message",
      cell: (info) => <p className="max-w-md whitespace-pre-wrap text-sm">{info.getValue()}</p>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Received",
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
        <span className="eyebrow">Guest communication</span>
        <CardTitle>Messages & comments</CardTitle>
        <CardDescription>Everything submitted through the website contact form.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={messages.slice().reverse()}
          searchPlaceholder="Search messages…"
          emptyMessage="No messages."
          pageSize={8}
        />
      </CardContent>
    </Card>
  );
}
