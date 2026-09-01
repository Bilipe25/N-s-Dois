import { Minus, Plus } from "lucide-react";

type GuestCountStepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  helperText?: string;
};

export function GuestCountStepper({ label, value, min, max, onChange, helperText }: GuestCountStepperProps) {
  return <div className="celebration-counter">
    <span>{label}{helperText && <small className="mt-1 block max-w-48 text-xs font-normal leading-relaxed text-stone-500">{helperText}</small>}</span>
    <div className="celebration-counter-controls">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Diminuir ${label.toLowerCase()}`}><Minus aria-hidden="true" /></button>
      <output aria-live="polite" aria-label={`${label}: ${value}`}>{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Aumentar ${label.toLowerCase()}`}><Plus aria-hidden="true" /></button>
    </div>
  </div>;
}
