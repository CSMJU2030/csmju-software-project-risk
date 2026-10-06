'use client';

import { useEffect, useState } from 'react';
import { CsmjuAppShell, type NavItem } from '@/csmju';

type Identity = {
  email?: string;
  coreRole?: string;
  subsystemRole?: string;
};

const ROLE_LABELS: Record<string, string> = {
  student: 'นักศึกษา',
  alumni: 'ศิษย์เก่า',
  staff: 'บุคลากร/อาจารย์',
  lecturer: 'บุคลากร/อาจารย์',
  admin: 'ผู้ดูแลระบบ',
  STUDENT: 'นักศึกษา',
  ALUMNI: 'ศิษย์เก่า',
  STAFF: 'บุคลากร/อาจารย์',
  ADMIN: 'ผู้ดูแลระบบ',
};

function getInitials(email: string | undefined) {
  const localPart = email?.split('@')[0] ?? '';
  const parts = localPart.split(/[._-]/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SP';
}

export default function CsmjuAppShellClient({
  displayName,
  nav,
  coreHubUrl,
  children,
}: {
  displayName: string;
  nav: NavItem[];
  coreHubUrl?: string;
  children: React.ReactNode;
}) {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/v1/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { data?: Identity };
        return payload.data ?? null;
      })
      .then((data) => {
        if (active && data) setIdentity(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const role = identity?.subsystemRole ?? identity?.coreRole ?? '';

  return (
    <CsmjuAppShell
      displayName={displayName}
      nav={nav}
      user={{
        initials: getInitials(identity?.email),
        roleLabel: ROLE_LABELS[role] ?? 'ผู้ใช้งาน',
      }}
      coreHubUrl={coreHubUrl}
    >
      {children}
    </CsmjuAppShell>
  );
}
