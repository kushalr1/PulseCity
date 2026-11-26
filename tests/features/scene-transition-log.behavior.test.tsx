import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
  useAnimatedReaction: (prepare: () => unknown, react: (next: unknown, previous: unknown) => void) => react(prepare(), null),
}));

import { useSceneTransitionProgressLog } from '@/features/home/presentation/use-scene-transition-progress-log';
import type { WindowPalette } from '@/features/home/application/window-light-transition';
import type { SharedValue } from 'react-native-reanimated';

const chill: WindowPalette = { lit: 0.24, win: [255, 217, 154], haze: [127, 184, 200], hazeAlpha: 0.12 };
const social: WindowPalette = { lit: 0.8, win: [255, 143, 190], haze: [168, 119, 202], hazeAlpha: 0.28 };

function Probe({ toKey }: { toKey: string }) {
  const palette = toKey === 'preview/city/social' ? social : chill;
  useSceneTransitionProgressLog('preview', 'preview/city/chill', toKey, chill, palette, { value: 0.5 } as SharedValue<number>);
  return <Text>{toKey}</Text>;
}

function Harness() {
  const [toKey, setToKey] = useState('preview/city/chill');
  return <View><Probe toKey={toKey} /><Pressable onPress={() => setToKey('preview/city/social')}><Text>Social</Text></Pressable><Pressable onPress={() => setToKey('preview/city/nature')}><Text>Nature</Text></Pressable></View>;
}

describe('scene transition logging', () => {
  test('keeps mountId stable while the Home surface changes mood', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await render(<Harness />);
    await fireEvent.press(screen.getByText('Social'));
    await fireEvent.press(screen.getByText('Nature'));
    const rows = log.mock.calls.map((call) => call[1] as Record<string, unknown>);
    const midpoints = rows.filter((row) => row.e === 0.5);

    expect(midpoints).toHaveLength(2);
    expect(midpoints[0]).toHaveProperty('mountId');
    expect(midpoints[0]).toMatchObject({ surface: 'preview', fromKey: 'preview/city/chill', toKey: 'preview/city/social', baseOpacityB: 0.5 });
    expect(midpoints[1]).toMatchObject({ surface: 'preview', fromKey: 'preview/city/chill', toKey: 'preview/city/nature', baseOpacityB: 0.5, mountId: midpoints[0]?.mountId });
    expect(rows.filter((row) => row.e === 0).length).toBe(2);
    expect(rows.filter((row) => row.e === 0.25).length).toBe(2);
    log.mockRestore();
  });
});
