import { useId } from 'react';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';

import { sceneTransitionFrame, type WindowPalette } from '../application/window-light-transition';

type ProgressLogRow = {
  transitionKey: string;
  mountId: string;
  bucket: number;
  surface: string;
  fromKey: string;
  toKey: string;
  e: number;
  baseOpacityB: number;
  litCode: number;
  win: number[];
};

type ProgressObservation = {
  transitionKey: string;
  bucket: number;
  mountId: string;
  surface: string;
  fromKey: string;
  toKey: string;
  from: WindowPalette;
  to: WindowPalette;
};

function printProgressRows(rows: ProgressLogRow[]) {
  rows.forEach((row) => console.log('[SceneTransition]', row));
}

export function useSceneTransitionProgressLog(
  surface: string,
  fromKey: string,
  toKey: string,
  from: WindowPalette,
  to: WindowPalette,
  progress: SharedValue<number>,
) {
  const mountId = `${surface}-${useId()}`;

  useAnimatedReaction(
    () => {
      if (fromKey === toKey) return null;
      return {
        transitionKey: `${fromKey}->${toKey}`,
        bucket: Math.min(4, Math.floor(progress.value * 4 + 0.00001)),
        mountId,
        surface,
        fromKey,
        toKey,
        from,
        to,
      } satisfies ProgressObservation;
    },
    (row, previous) => {
      if (!row) return;
      const firstBucket = previous?.transitionKey === row.transitionKey ? previous.bucket + 1 : 0;
      const rows: ProgressLogRow[] = [];
      for (let bucket = firstBucket; bucket <= row.bucket; bucket += 1) {
        const e = bucket / 4;
        const frame = sceneTransitionFrame(row.from, row.to, e);
        rows.push({
          transitionKey: row.transitionKey,
          bucket,
          mountId: row.mountId,
          surface: row.surface,
          fromKey: row.fromKey,
          toKey: row.toKey,
          e,
          baseOpacityB: frame.baseOpacityB,
          litCode: frame.litCode,
          win: frame.palette.win,
        });
      }
      if (rows.length) runOnJS(printProgressRows)(rows);
    },
    [from, fromKey, mountId, progress, surface, to, toKey],
  );
}
