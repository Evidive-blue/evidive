"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  label: string;
  bookingAmount: number;
  centerAmount: number;
  commissionAmount: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
  translations: {
    title: string;
    grossRevenue: string;
    netRevenue: string;
    commission: string;
    noData: string;
  };
}

export function RevenueChart({ data, translations }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <p className="text-white/40">{translations.noData}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name,
                ]}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Legend
                wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Line
                type="monotone"
                dataKey="bookingAmount"
                name={translations.grossRevenue}
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: "#06b6d4", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="centerAmount"
                name={translations.netRevenue}
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
