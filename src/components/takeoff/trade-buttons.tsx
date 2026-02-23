"use client";

import { Loader2, Zap, Droplets, Wind, Building2, Paintbrush, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TradeConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TRADES: TradeConfig[] = [
  { key: "electrical", label: "Electrical", icon: <Zap className="size-3.5" />, color: "text-yellow-600" },
  { key: "plumbing", label: "Plumbing", icon: <Droplets className="size-3.5" />, color: "text-blue-600" },
  { key: "hvac", label: "HVAC", icon: <Wind className="size-3.5" />, color: "text-cyan-600" },
  { key: "structural", label: "Structural", icon: <Building2 className="size-3.5" />, color: "text-stone-600" },
  { key: "finishes", label: "Finishes", icon: <Paintbrush className="size-3.5" />, color: "text-pink-600" },
];

interface TradeButtonsProps {
  availableTrades: string[];
  getTradeStatus: (trade: string) => "idle" | "loading" | "complete" | "error";
  getTradeItemCount: (trade: string) => number;
  onTradeClick: (trade: string) => void;
  disabled?: boolean;
}

export function TradeButtons({
  availableTrades,
  getTradeStatus,
  getTradeItemCount,
  onTradeClick,
  disabled,
}: TradeButtonsProps) {
  if (availableTrades.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#78716c]">Trade Deep-Dives</p>
      <div className="grid grid-cols-1 gap-1.5">
        {TRADES.filter((t) => availableTrades.includes(t.key)).map((trade) => {
          const status = getTradeStatus(trade.key);
          const itemCount = getTradeItemCount(trade.key);

          return (
            <Button
              key={trade.key}
              variant={status === "complete" ? "secondary" : "outline"}
              size="sm"
              onClick={() => onTradeClick(trade.key)}
              disabled={disabled || status === "loading"}
              className={`h-8 justify-start gap-2 text-xs ${
                status === "complete"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : ""
              }`}
            >
              {status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : status === "complete" ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <span className={trade.color}>{trade.icon}</span>
              )}
              {trade.label}
              {status === "complete" && itemCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto bg-emerald-100 text-[10px] text-emerald-700"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
