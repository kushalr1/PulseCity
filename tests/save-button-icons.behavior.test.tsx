import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
jest.mock('expo-symbols', () => ({
  SymbolView: ({ name }: { name: unknown }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'save-symbol' }, JSON.stringify(name));
  },
}));

import { SaveButton } from '@/components/ui/save-button';

describe('saved place icon', () => {
  test('uses the approved bookmark symbol when not saved and when saved', async () => {
    const view = await render(<SaveButton saved={false} onPress={() => undefined} />);
    expect(screen.getByTestId('save-symbol').props.children).toBe(JSON.stringify({ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }));

    await view.rerender(<SaveButton saved onPress={() => undefined} />);
    expect(screen.getByTestId('save-symbol').props.children).toBe(JSON.stringify({ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }));
  });
});
