'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useFetch } from '@/lib/useFetch';
import type { Project, Scenario } from '@/types/api';

type Row = Scenario & { projectName: string };

async function load(projects: Project[]): Promise<Row[]> {
  const groups = await Promise.all(projects.map(async (p) => {
    const items = await api.scenarios.list(p.id);
    return items.map((s) => ({ ...s, projectName: p.name }));
  }));
  return groups.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export default function ScenariosPage() {
  const [query, setQuery] = useState('');
  const projects = useFetch(() => api.projects.list());
  const scenarios = useFetch(() => projects.data ? load(projects.data) : Promise.resolve([]), [projects.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (scenarios.data ?? []).filter((s) => !q || s.name.toLowerCase().includes(q) || s.projectName.toLowerCase().includes(q));
  }, [scenarios.data, query]);

  if (projects.loading || scenarios.loading) return <LoadingState label="กำลังโหลดสถานการณ์จำลอง..." />;
  if (projects.error) return <ErrorState error={projects.error} onRetry={projects.reload} />;
  if (scenarios.error) return <ErrorState error={scenarios.error} onRetry={scenarios.reload} />;

  return <>
    <PageHeader title="สถานการณ์จำลอง" description="สร้างและดูสถานการณ์ What-if ของโครงการ" />
    {scenarios.data?.length ? <input type="search" placeholder="ค้นหาสถานการณ์หรือโครงการ..." value={query} onChange={(e) => setQuery(e.target.value)} className="focus-ring mb-4 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 md:max-w-sm" /> : null}
    {!scenarios.data?.length ? <Card><EmptyState title="ยังไม่มีสถานการณ์จำลอง" description="เข้าไปที่โครงการเพื่อสร้างสถานการณ์จำลอง" action={<Link href="/projects"><Button>ไปที่โครงการ</Button></Link>} /></Card>
      : !filtered.length ? <Card><EmptyState title="ไม่พบสถานการณ์จำลองที่ค้นหา" /></Card>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((s) => <Card key={s.id} className="flex flex-col gap-3">
        <div><Link href={`/scenarios/${s.id}`} className="focus-ring rounded font-display text-headline-md text-primary-container hover:underline">{s.name}</Link><p className="mt-1 text-label-md text-on-surface-variant">โครงการ: {s.projectName}</p></div>
        {s.description && <p className="line-clamp-3 text-body-md text-on-surface-variant">{s.description}</p>}
        <p className="mt-auto text-caption text-on-surface-variant">แก้ไขล่าสุด {formatDateTime(s.updatedAt)}</p>
        <Link href={`/scenarios/${s.id}`}><Button variant="secondary" className="w-full">ดูสถานการณ์</Button></Link>
      </Card>)}</div>}
  </>;
}
