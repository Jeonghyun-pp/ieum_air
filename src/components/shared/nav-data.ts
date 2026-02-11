// ============================================
// Navigation Menu Data Structure
// ============================================

export interface NavLink {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  // pathname 매칭을 위한 패턴 (정확히 일치하거나 prefix match)
  match?: 'exact' | 'prefix';
}

export interface NavSection {
  id: string;
  title: string;
  items: NavLink[];
}

export interface NavMenuItem {
  id: string;
  label: string;
  href?: string;
  // pathname 매칭을 위한 패턴
  match?: 'exact' | 'prefix';
  sections?: NavSection[];
}

// ============================================
// Pathname to Label Mapping
// ============================================

export const pathnameToLabel: Record<string, string> = {
  '/main': 'Main',
  '/main/workspace': 'Workspace',
  '/main/tools': 'Tools',
  '/main/resources': 'Resources',
  '/main/settings': 'Settings',
  '/main/pages': 'Pages',
  '/main/templates': 'Templates',
  '/main/import': 'Import',
  '/main/docs': 'Docs',
  '/main/support': 'Support',
};

// ============================================
// Helper: Pathname to Breadcrumb Labels
// ============================================

export function getBreadcrumbLabels(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  const labels: string[] = [];

  // 첫 번째 세그먼트는 항상 Main으로 시작
  if (segments.length > 0) {
    labels.push('Main');
  }

  // 나머지 세그먼트를 매핑
  for (let i = 1; i < segments.length; i++) {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = pathnameToLabel[path];
    
    if (label) {
      labels.push(label);
    } else {
      // Fallback: Title Case 변환
      const segment = segments[i];
      const titleCase = segment.charAt(0).toUpperCase() + segment.slice(1);
      labels.push(titleCase);
    }
  }

  return labels;
}

// ============================================
// Menu Data
// ============================================

export const navMenuItems: NavMenuItem[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    href: '/portal',
    match: 'prefix',
    sections: [
      {
        id: 'main',
        title: '주요 작업',
        items: [
          {
            id: 'home',
            label: '홈',
            href: '/portal',
            description: 'Client Portal',
            match: 'exact',
          },
          {
            id: 'pages',
            label: '페이지',
            href: '/main/pages',
            description: '모든 페이지 보기',
            match: 'prefix',
          },
        ],
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    match: 'prefix',
    sections: [
      {
        id: 'productivity',
        title: '생산성',
        items: [
          {
            id: 'templates',
            label: '템플릿',
            href: '/main/templates',
            description: '빠른 시작 템플릿',
            match: 'prefix',
          },
          {
            id: 'import',
            label: '가져오기',
            href: '/main/import',
            description: '데이터 가져오기',
            match: 'prefix',
          },
        ],
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    match: 'prefix',
    sections: [
      {
        id: 'help',
        title: '도움말',
        items: [
          {
            id: 'docs',
            label: '문서',
            href: '/main/docs',
            description: '사용 가이드',
            match: 'prefix',
          },
          {
            id: 'support',
            label: '지원',
            href: '/main/support',
            description: '고객 지원',
            match: 'prefix',
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/main/settings',
    match: 'prefix',
  },
];
