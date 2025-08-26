"use client";

import * as React from "react";
import { api } from "@/lib/api"; // 프로젝트에 이미 있는 axios 인스턴스를 사용한다고 가정

type Report = {
  id: string;
  reason?: string;
  status: string;
  createdAt?: string;
};

export function RecentReports() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/reports", {
          params: { limit: 5, status: "PENDING" },
        });
        const items: Report[] = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? [];
        if (alive) setReports(items);
      } catch (e) {
        if (alive) setReports([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!reports.length) return <div className="text-sm text-gray-500">No recent reports</div>;

  return (
    <ul className="space-y-2">
      {reports.map((r) => (
        <li key={r.id} className="text-sm flex items-center gap-2">
          <span className="inline-flex min-w-[84px] justify-center rounded-full border px-2 py-0.5 text-xs">
            {r.status}
          </span>
          <span className="truncate">{r.reason ?? r.id}</span>
          {r.createdAt && (
            <span className="ml-auto text-xs text-gray-500">
              {new Date(r.createdAt).toLocaleString()}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
