import type { ScratchPreviewSubstrate } from '../lib/scratch-compare-types';
import { ScratchSegmentedControl } from './ScratchSegmentedControl';

export function ScratchPreviewSubstrateSwitch({
  value,
  onChange,
}: {
  value: ScratchPreviewSubstrate;
  onChange: (next: ScratchPreviewSubstrate) => void;
}) {
  return (
    <ScratchSegmentedControl
      aria-label="미리보기 종류"
      value={value}
      onChange={onChange}
      options={[
        { value: 'code', label: '코드' },
        { value: 'capture', label: '캡처' },
      ]}
    />
  );
}
