import type { ReactNode } from 'react';
import {
  SCRATCH_SEGMENT_TRACK_CLASS,
  scratchSegmentItemClass,
} from './scratch-preview-ui';

export type ScratchSegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export function ScratchSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: {
  value: T;
  options: ScratchSegmentOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <span
      className={SCRATCH_SEGMENT_TRACK_CLASS}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled || option.disabled}
          className={scratchSegmentItemClass(value === option.value)}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}
