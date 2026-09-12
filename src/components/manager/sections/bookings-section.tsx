import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, createDataColumnHelper, type DataTableFilterOption } from "@/components/data-table";

type Booking = Record<string, any>;

const columnHelper = createDataColumnHelper<Booking>();

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Rejected", value: "rejected" },
];

function statusVariant(status: string) {
  if (status === "confirmed" || status === "approved") return "success" as const;
  if (status === "rejected") return "destructive" as const;
  return "warning" as const;
}

interface BookingsSectionProps {
  bookings: Booking[];
  actionId: string;
  onDelete: (booking: Booking) => void;
}

export function BookingsSection({ bookings, actionId, onDelete }: BookingsSectionProps) {
  const columns = [
    columnHelper.accessor("name", {
      header: "Guest",
      cell: (info) => (
        <div>
          <p className="font-semibold">{info.getValue()}</p>
          <p className="text-xs opacity-50">{info.row.original.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("room", {
      header: "Room",
      filterFn: "equalsString",
      cell: (info) => (
        <div>
          <p>{info.getValue()}</p>
          <p className="text-xs opacity-50">{info.row.original.tier || "Standard"}</p>
        </div>
      ),
    }),
    columnHelper.display({
      id: "stay",
      header: "Stay",
      cell: ({ row }) => (
        <span>
          {row.original.checkIn} → {row.original.checkOut}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: (info) => <Badge variant={statusVariant(info.getValue())}>{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("totalPrice", {
      header: "Value",
      cell: (info) => `$${Number(info.getValue() || 0).toLocaleString()}`,
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: ({ row }) =>
        row.original.status !== "rejected" ? (
          <Button
            variant="outline"
            size="sm"
            loading={actionId === row.original.id}
            onClick={() => onDelete(row.original)}
            className="border-red-500/20 text-red-700 hover:bg-red-500/10 dark:text-red-300"
          >
            {actionId === row.original.id ? "Deleting…" : "Delete & release"}
          </Button>
        ) : null,
    }),
  ];

  const roomOptions = Array.from(new Set(bookings.map((b) => b.room).filter(Boolean))).sort();

  const filters: DataTableFilterOption[] = [
    { columnId: "status", label: "Statuses", options: STATUS_OPTIONS },
    {
      columnId: "room",
      label: "Rooms",
      options: roomOptions.map((room) => ({ label: room, value: room })),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <span className="eyebrow">Booking management</span>
        <CardTitle>All booking requests</CardTitle>
        <CardDescription>Rejecting releases the dates. Deleting also releases the dates and leaves an audit record.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={bookings.slice().reverse()}
          searchPlaceholder="Search bookings…"
          emptyMessage="No bookings yet."
          pageSize={8}
          filters={filters}
        />
      </CardContent>
    </Card>
  );
}
