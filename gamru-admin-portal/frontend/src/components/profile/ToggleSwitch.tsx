interface Props {
  enabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch = ({ enabled, onToggle }: Props) => (
  <button
    onClick={onToggle}
    role="switch"
    aria-checked={enabled}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
      ${enabled ? 'bg-blue-600' : 'bg-slate-600'}`}
  >
    <span
      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200
        ${enabled ? 'left-5' : 'left-0.5'}`}
    />
  </button>
);

export default ToggleSwitch;
