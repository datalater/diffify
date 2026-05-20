import type { ScratchCaptureViewMode } from '../lib/scratch-compare-types';
import { ScratchSegmentedControl } from './ScratchSegmentedControl';

export function ScratchCaptureViewModeSwitch({
  value,
  disabled,
  onChange,
}: {
  value: ScratchCaptureViewMode;
  disabled?: boolean;
  onChange: (mode: ScratchCaptureViewMode) => void;
}) {
  return (
    <ScratchSegmentedControl
      aria-label="캡처 보기 방식"
      value={value}
      disabled={disabled}
      onChange={onChange}
      options={[
        { value: 'overlay', label: '겹쳐보기' },
        { value: 'pixel-diff', label: 'Diff' },
      ]}
    />
  );
}
