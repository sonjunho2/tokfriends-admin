// admin-web/src/components/recent-reports.tsx
"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Report = {
  id: string | number;
  userId?: string;
  nickname?: string;
  reason?: string;
  status?: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt?: string; // ISO string
};

type Props = {
  className?: string;
  /**
   * 백엔드 API 엔드포인트 (없으면 환경변수 or 더미 데이터 사용)
   * 예: `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reports/recent?limit=20`
   */
  endpoint?: string;
  limit?: number;
};

function RecentReports({ className, endpoint, limit = 20 }: Props) {
  const [rows, setRows] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
        const url = endpoint ?? (base ? `${base}/admin/reports/recent?limit=${limit}` : "");
        if (!url) {
          // 더미 데이터 (빌드용 안전장치)
          const demo: Report[] = [
            { id: "1", nickname: "tester1", reason: "스팸 의심", status: "PENDING", createdAt: new Date().toISOString() },
            { id: "2", nickname: "tester2", reason: "부적절한 닉네임", status: "RESOLVED", createdAt: new Date().toISOString() },
          ];
          if (!cancelled) setRows(demo);
          return;
        }
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Report[] | { items: Report[] };
        const items = Array.isArray(data) ? data : data.items ?? [];
        if (!cancelled) setRows(items.slice(0, limit));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [endpoint, limit]);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">최근 신고 내역</h2>
        {loading && <span className="text-xs text-muted-foreground">불러오는 중…</span>}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          최근 신고를 불러오지 못했어. <span className="font-mono">({error})</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>닉네임</TableHead>
              <TableHead>사유</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>신고일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  데이터가 없어.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.nickname ?? r.userId ?? "-"}</TableCell>
                  <TableCell className="max-w-[360px] truncate">{r.reason ?? "-"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded px-2 py-0.5 text-xs",
                        r.status === "RESOLVED" && "bg-emerald-500/10 text-emerald-700",
                        r.status === "PENDING" && "bg-amber-500/10 text-amber-700",
                        r.status === "REJECTED" && "bg-rose-500/10 text-rose-700"
                      )}
                    >
                      {r.status ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
            )))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default RecentReports;
// ✅ 대시보드에서 named import를 그대로 쓰도록 지원
export { RecentReports };
