import type { ScratchSegmentOption } from './ScratchSegmentedControl';
import { ScratchSegmentedControl } from './ScratchSegmentedControl';
import {
  LAYER_DOT_MUTED_CLASS,
  LAYER_DOT_RESULT_CLASS,
  LAYER_DOT_SOURCE_CLASS,
} from './scratch-preview-ui';

function layerLabel(name: string, dotClass: string) {
  return (
    <>
      <span className={dotClass} aria-hidden />
      {name}
    </>
  );
}

export function PreviewLayerChips({
  showingSource,
  onSelectLayer,
}: {
  showingSource: boolean;
  onSelectLayer: (layer: 'source' | 'result') => void;
}) {
  const options: ScratchSegmentOption<'source' | 'result'>[] = [
    {
      value: 'source',
      label: layerLabel(
        'Source',
        showingSource ? LAYER_DOT_SOURCE_CLASS : LAYER_DOT_MUTED_CLASS,
      ),
    },
    {
      value: 'result',
      label: layerLabel(
        'Result',
        showingSource ? LAYER_DOT_MUTED_CLASS : LAYER_DOT_RESULT_CLASS,
      ),
    },
  ];

  return (
    <ScratchSegmentedControl
      aria-label="미리보기 레이어"
      value={showingSource ? 'source' : 'result'}
      onChange={onSelectLayer}
      options={options}
    />
  );
}
