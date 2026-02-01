"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopService {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

interface TopServicesTableProps {
  services: TopService[];
  translations: {
    title: string;
    service: string;
    bookings: string;
    revenue: string;
    noData: string;
  };
}

export function TopServicesTable({ services, translations }: TopServicesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (services.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <p className="text-white/40">{translations.noData}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...services.map((s) => s.count));

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-white/50">
            <div className="col-span-6">{translations.service}</div>
            <div className="col-span-3 text-right">{translations.bookings}</div>
            <div className="col-span-3 text-right">{translations.revenue}</div>
          </div>

          {/* Rows */}
          {services.map((service, index) => {
            const barWidth = (service.count / maxCount) * 100;

            return (
              <div key={service.serviceId} className="relative">
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded bg-cyan-500/10"
                  style={{ width: `${barWidth}%` }}
                />

                {/* Content */}
                <div className="relative grid grid-cols-12 gap-4 py-3 px-2">
                  <div className="col-span-6 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-medium text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-white">
                      {service.serviceName}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end">
                    <span className="text-sm font-semibold text-white">
                      {service.count}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end">
                    <span className="text-sm font-medium text-emerald-400">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
