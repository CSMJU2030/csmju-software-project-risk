'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useFetch } from '@/lib/useFetch';
import type { Project, Scenario, Simulation } from '@/types/api';

type Row = Simulation & { scenarioName: string; projectName: string };

async function load(projects: Project[]): Promise<Row[]> {
  const groups = await Promise.all(projects.map(async (p) => {
    const scenarios = await api.scenarios.list(p.id);
    return Promise.all(scenarios.map(async (s: Scenario) => {
      const items = await api.simulations.listForScenario(s.id);
      return items.map((x) => ({ ...x, scenarioName: s.name, projectName: p.name }));
    }));
  }));
  return groups.flat(2).sort((a, b) => b.executedAt.localeCompare(a.executedAt));
}

export default function SimulationsPage() {
  const [query, setQuery] = useState('');
  const projects = useFetch(() => api.projects.list());
  const simulations = useFetch(() => projects.data ? load(projects.data) : Promise.resolve([]), [projects.data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (simulations.data ?? []).filter((s) => !q || s.scenarioName.toLowerCase().includes(q) || s.projectName.toLowerCase().includes(q));
  }, [simulations.data, query]);

  if (projects.loading || simulations.loading) return <LoadingState label="กำลังโหลดผลการจำลอง..." />;
  if (projects.error) return <ErrorState error={projects.error} onRetry={projects.reload} />;
  if (simulations.error) return <ErrorState error={simulations.error} onRetry={simulations.reload} />;

  return <>
    <PageHeader title="ผลการจำลอง" description="ดูผลการจำลอง What-if ที่เคยดำเนินการแล้ว" />
    {simulations.data?.length ? <input type="search" placeholder="ค้นหาสถานการณ์หรือโครงการ..." value={query} onChange={(e) => setQuery(e.target.value)} className="focus-ring mb-4 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 md:max-w-sm" /> : null}
    {!simulations.data?.length ? <Card><EmptyState title="ยังไม่มีผลการจำลอง" description="สร้างสถานการณ์จำลองและกดจำลองสถานการณ์อย่างน้อย 1 ครั้ง" action={<Link href="/scenarios"><Button>ไปที่สถานการณ์จำลอง</Button></Link>} /></Card>
      : !filtered.length ? <Card><EmptyState title="ไม่พบผลการจำลองที่ค้นหา" /></Card>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((s) => <Card key={s.id} className="flex flex-col gap-3">
        <div><Link href={`/simulations/${s.id}`} className="focus-ring rounded font-display text-headline-md text-primary-container hover:underline">ผลการจำลอง</Link><p className="mt-1 text-label-md text-on-surface-variant">สถานการณ์: {s.scenarioName}</p><p className="text-label-md text-on-surface-variant">โครงการ: {s.projectName}</p></div>
        <dl className="grid grid-cols-2 gap-2 text-label-md"><div><dt className="text-on-surface-variant">ระยะเวลา</dt><dd>{s.beforeDuration} → {s.afterDuration} วัน</dd></div><div><dt className="text-on-surface-variant">ทีม</dt><dd>{s.beforeTeamSize} → {s.afterTeamSize} คน</dd></div></dl>
        <p className="mt-auto text-caption text-on-surface-variant">จำลองเมื่อ {formatDateTime(s.executedAt)}</p>
        <Link href={`/simulations/${s.id}`}><Button variant="secondary" className="w-full">ดูผลการจำลอง</Button></Link>
      </Card>)}</div>}
  </>;
}
