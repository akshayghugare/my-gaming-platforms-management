import { useState, type FC, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/layout/DashboardLayout';

/**
 * In-app project guide. Explains what Gamru Engage does, the request flow,
 * and every feature area — with clickable cross-links into the live screens
 * so the page doubles as a navigation hub for onboarding users.
 */

interface FeatureLink {
  label: string;
  to: string;
  desc: string;
}

interface DocSection {
  id: string;
  title: string;
  intro: ReactNode;
  links?: FeatureLink[];
  body?: ReactNode;
}

const Step: FC<{ n: number; title: string; children: ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-4">
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400">
      {n}
    </div>
    <div>
      <div className="font-medium text-slate-200">{title}</div>
      <div className="mt-0.5 text-sm text-slate-400">{children}</div>
    </div>
  </div>
);

const LinkCard: FC<{ item: FeatureLink }> = ({ item }) => (
  <Link
    to={item.to}
    className="group flex flex-col rounded-xl border border-white/5 bg-[#162040] p-4 transition-all duration-150 hover:border-blue-400/30 hover:bg-[#1d2e55]"
  >
    <span className="text-sm font-medium text-blue-400 group-hover:underline">{item.label}</span>
    <span className="mt-1 text-xs text-slate-400">{item.desc}</span>
    <span className="mt-2 font-mono text-[10px] text-slate-600">{item.to}</span>
  </Link>
);

const SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    intro: (
      <>
        <strong className="text-slate-200">Gamru Engage</strong> is a player engagement &amp; CRM
        platform for iGaming operators. It pairs a TypeScript REST API (Express + Sequelize +
        PostgreSQL) with this React SPA. Operators design campaigns, build audience segments,
        configure gamification (missions, ranks, rewards, tournaments), manage casino/sports
        catalogs, and review analytics — all from one console.
      </>
    ),
    body: (
      <div className="space-y-3 text-sm text-slate-400">
        <p>
          The product is organised into four pillars:{' '}
          <strong className="text-slate-300">CRM</strong> (reaching players),{' '}
          <strong className="text-slate-300">Gamification</strong> (engaging players),{' '}
          <strong className="text-slate-300">Catalogs &amp; Media</strong> (content the campaigns
          and games reference), and <strong className="text-slate-300">Administration</strong>{' '}
          (users, roles, settings, audit).
        </p>
        <p>
          Every screen below is backed by a live API. Authentication is JWT-based: logging in stores
          a bearer token in <code className="text-slate-300">sessionStorage</code> that the axios
          client attaches to every request and clears automatically on a 401.
        </p>
      </div>
    ),
  },
  {
    id: 'flow',
    title: 'How a request flows',
    intro: 'Follow a single click from the browser all the way to PostgreSQL and back.',
    body: (
      <div className="space-y-5">
        <Step n={1} title="UI action (React)">
          A page or modal calls a typed helper in{' '}
          <code className="text-slate-300">services/api.ts</code> (or a feature client like{' '}
          <code className="text-slate-300">gamification.api.ts</code>).
        </Step>
        <Step n={2} title="HTTP request">
          Axios injects the <code className="text-slate-300">Bearer</code> token and hits{' '}
          <code className="text-slate-300">/api/&lt;feature&gt;</code>.
        </Step>
        <Step n={3} title="Route + middleware">
          Express matches the route, then runs <code className="text-slate-300">auth</code> →{' '}
          <code className="text-slate-300">role</code> →{' '}
          <code className="text-slate-300">validate</code> (Joi) middleware.
        </Step>
        <Step n={4} title="Controller → Service">
          The controller parses the request and delegates business logic to the service layer.
        </Step>
        <Step n={5} title="Repository → Model">
          The service calls a repository extending{' '}
          <code className="text-slate-300">BaseRepository</code>, which uses the Sequelize model to
          query PostgreSQL.
        </Step>
        <Step n={6} title="Standard envelope back">
          The result is wrapped as{' '}
          <code className="text-slate-300">{'{ success, message, data }'}</code> (lists add a{' '}
          <code className="text-slate-300">pagination</code> block) and rendered by the page.
        </Step>
      </div>
    ),
  },
  {
    id: 'crm',
    title: 'CRM — reaching players',
    intro:
      'Design and ship multi-channel campaigns, define who receives them, and measure the result. List screens support pagination, search, archive/restore and delete.',
    links: [
      {
        label: 'Campaigns',
        to: '/crm/campaigns',
        desc: 'Create, schedule & track direct campaigns.',
      },
      {
        label: 'Analytics',
        to: '/crm/analytics',
        desc: 'Sent / open / click / conversion per channel.',
      },
      { label: 'Segments', to: '/crm/segments', desc: 'Dynamic or static player audiences.' },
      { label: 'Templates', to: '/crm/templates', desc: 'Email / SMS / on-site / push content.' },
      {
        label: 'Custom Triggers',
        to: '/crm/custom-triggers',
        desc: 'Event-based automation entry points.',
      },
      {
        label: 'Frequency Cap',
        to: '/crm/frequency-cap',
        desc: 'Limit messages per channel per period.',
      },
      {
        label: 'Unsubscribe Reports',
        to: '/crm/unsubscribe-reports',
        desc: 'Read-only opt-out audit.',
      },
      {
        label: 'Player Data',
        to: '/crm/player-data',
        desc: 'Custom player fields + CSV bulk import.',
      },
    ],
  },
  {
    id: 'gamification',
    title: 'Gamification — engaging players',
    intro:
      'Twelve feature modules share one configurable engine: a list with status/tag filters and a multi-step create wizard, all bound to /api/gamification/<feature>.',
    links: [
      {
        label: 'Missions',
        to: '/gamification/missions',
        desc: 'Objective-based player challenges.',
      },
      {
        label: 'Mission Bundles',
        to: '/gamification/mission-bundles',
        desc: 'Grouped mission journeys.',
      },
      { label: 'Ranks', to: '/gamification/ranks', desc: 'Level tiers and rank rewards.' },
      {
        label: 'Token Rules (Casino)',
        to: '/gamification/token-rules-casino',
        desc: 'Casino token earn rules.',
      },
      {
        label: 'Token Rules (Sports)',
        to: '/gamification/token-rules-sports',
        desc: 'Sports token earn rules.',
      },
      {
        label: 'XP Point Rules (Casino)',
        to: '/gamification/xp-point-rules-casino',
        desc: 'Casino XP contribution.',
      },
      {
        label: 'XP Point Rules (Sports)',
        to: '/gamification/xp-point-rules-sports',
        desc: 'Sports XP contribution.',
      },
      {
        label: 'Player Categories',
        to: '/gamification/player-categories',
        desc: 'Range-based player segmentation.',
      },
      {
        label: 'Reward Shop',
        to: '/gamification/reward-shop',
        desc: 'Token/real-price product catalog.',
      },
      {
        label: 'Prizeshark Catalog',
        to: '/gamification/prizeshark-catalog',
        desc: 'CSV-only external prize feed.',
      },
      {
        label: 'Purchase Feed',
        to: '/gamification/purchase-feed',
        desc: 'Purchase activity entries.',
      },
      { label: 'Tournaments', to: '/gamification/tournaments', desc: 'Leaderboard competitions.' },
    ],
  },
  {
    id: 'catalogs',
    title: 'Catalogs & Media — supporting content',
    intro:
      'Reference data that campaigns and gamification rules point at: games, sports entities, and the media asset library.',
    links: [
      {
        label: 'Casino Catalog',
        to: '/casino-catalog',
        desc: 'Games, categories & providers (tabbed).',
      },
      {
        label: 'Sports Catalog',
        to: '/sports-catalog',
        desc: 'Sports, teams, tournaments & markets.',
      },
      {
        label: 'Media Database',
        to: '/media-database',
        desc: 'Uploaded banners/assets by category.',
      },
      {
        label: 'Tags (Gamification)',
        to: '/tags-gamification',
        desc: 'Reusable labels for gamification.',
      },
      { label: 'Tags (CRM)', to: '/tags-crm', desc: 'Reusable labels for CRM entities.' },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    intro:
      'Operator account management, access control, platform configuration, and an audit trail. Most actions here are ADMIN-only on the backend.',
    links: [
      { label: 'User Management', to: '/users', desc: 'Create/update operator accounts.' },
      { label: 'Roles', to: '/roles', desc: 'Role definitions & status.' },
      { label: 'User Logs', to: '/user-logs', desc: 'Read-only INSERT/UPDATE/DELETE/LOGIN audit.' },
      {
        label: 'System Settings',
        to: '/system-settings',
        desc: 'Core, gamification, CRM, platform & widget config.',
      },
      { label: 'Profile', to: '/profile', desc: 'Your own account & security settings.' },
      {
        label: 'HTTP Debugger Console',
        to: '/http-debugger-console',
        desc: 'Built-in API request tester.',
      },
    ],
  },
];

const DocumentationPage: FC = () => {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <DashboardLayout>
      <div className="w-full overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Project Documentation</h1>
          <p className="mt-1 text-sm text-slate-400">
            A guided tour of Gamru Engage — what each area does, how the stack fits together, and a
            direct link into every live screen.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5 pb-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                s.id === active
                  ? 'bg-blue-500/20 font-medium text-blue-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Active section */}
        <div className="max-w-5xl space-y-6">
          <h2 className="text-xl font-semibold text-white">{section.title}</h2>
          <p className="text-sm leading-relaxed text-slate-400">{section.intro}</p>

          {section.body}

          {section.links && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.links.map((item) => (
                <LinkCard key={item.to} item={item} />
              ))}
            </div>
          )}

          {section.links && (
            <p className="pt-2 text-xs text-slate-500">
              Tip: every card above navigates straight to the live screen.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentationPage;
