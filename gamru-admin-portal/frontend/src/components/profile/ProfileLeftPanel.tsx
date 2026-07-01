import { UserProfile } from '@/types/profile';

interface Props {
  profile: UserProfile;
}

const ProfileLeftPanel = ({ profile }: Props) => (
  <aside className="w-100 bg-[#1a2744] flex flex-col items-center justify-center gap-5 px-8 flex-shrink-0 relative overflow-hidden ">
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: 'radial-gradient(circle, #60a5fa 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />

    <div className="relative z-10 w-28 h-28 rounded-full bg-amber-600 flex items-center justify-center text-3xl font-bold text-amber-900 select-none">
      {profile.avatarInitials}
    </div>

    <p className="relative z-10 text-xl font-semibold text-slate-100">{profile.name}</p>

    <span className="relative z-10 bg-green-900 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider">
      {profile.role}
    </span>
  </aside>
);

export default ProfileLeftPanel;
