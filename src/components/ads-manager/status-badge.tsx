import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "paused" | "pending" | "error" | "draft";
  label?: string;
}

const statusConfig = {
  active: {
    label: "Ativo",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  paused: {
    label: "Pausado",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  pending: {
    label: "Em revisão",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  error: {
    label: "Erro",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
  draft: {
    label: "Rascunho",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.paused;

  return (
    <Badge variant="outline" className={config.className}>
      <span
        className={`w-2 h-2 rounded-full mr-2 ${
          status === "active"
            ? "bg-green-500"
            : status === "paused"
            ? "bg-gray-400"
            : status === "pending"
            ? "bg-yellow-500"
            : status === "error"
            ? "bg-red-500"
            : "bg-blue-500"
        }`}
      />
      {label || config.label}
    </Badge>
  );
}

