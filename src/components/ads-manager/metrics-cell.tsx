import { formatCurrencyBRL, formatNumberPT } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsCellProps {
  value: number | null | undefined;
  type: "currency" | "number" | "percentage";
  showTrend?: boolean;
  previousValue?: number;
}

export function MetricsCell({
  value,
  type,
  showTrend,
  previousValue,
}: MetricsCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  let formattedValue = "";

  switch (type) {
    case "currency":
      formattedValue = formatCurrencyBRL(value);
      break;
    case "number":
      formattedValue = formatNumberPT(value);
      break;
    case "percentage":
      formattedValue = `${value.toFixed(2)}%`;
      break;
  }

  const getTrendIcon = () => {
    if (!showTrend || previousValue === undefined) return null;

    if (value > previousValue) {
      return <TrendingUp className="h-3 w-3 text-green-500 ml-1" />;
    } else if (value < previousValue) {
      return <TrendingDown className="h-3 w-3 text-red-500 ml-1" />;
    }
    return <Minus className="h-3 w-3 text-gray-400 ml-1" />;
  };

  return (
    <div className="flex items-center">
      <span>{formattedValue}</span>
      {getTrendIcon()}
    </div>
  );
}

