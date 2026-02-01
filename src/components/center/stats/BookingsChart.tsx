"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyBooking {
  month: string;
  label: string;
  count: number;
}

interface BookingsChartProps {
  data: MonthlyBooking[];
  translations: {
    title: string;
    bookings: string;
    noData: string;
  };
}

export function BookingsChart({ data, translations }: BookingsChartProps) {
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
            <BarChart
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
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [value, translations.bookings]}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Bar
                dataKey="count"
                name={translations.bookings}
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
