import type { FC } from 'react';

interface ModalInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}

const ModalInput: FC<ModalInputProps> = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}) => {
  return (
    <div>
      <label className="text-sm block mb-1">{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-800 rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ModalInput;
