import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { designTokens } from '../../src/shared/design-system/tokens.ts';

test('functional palette and dark City World colors stay explicit', () => {
  assert.equal(designTokens.color.canvas, '#F5F6F8');
  assert.equal(designTokens.color.surface, designTokens.color.white);
  assert.equal(designTokens.color.teal, '#0B7A69');
  assert.equal(designTokens.color.cityWorldNight, '#07101A');
});

test('spacing increases and layout controls meet minimum dimensions', () => {
  const spacingValues = Object.values(designTokens.spacing);
  assert.deepEqual(spacingValues, [...spacingValues].sort((a, b) => a - b));
  assert.ok(designTokens.layout.minimumTouchTarget >= 44);
  assert.ok(designTokens.layout.contentMaxWidth > 0);
});

test('existing theme exports use the shared content width token', async () => {
  const themeSource = await readFile(
    new URL('../../src/constants/theme.ts', import.meta.url),
    'utf8',
  );

  assert.match(themeSource, /import \{ designTokens \} from '@\/shared\/design-system\/tokens';/);
  assert.match(themeSource, /export const contentMaxWidth = designTokens\.layout\.contentMaxWidth;/);

  for (const name of ['colors', 'spacing', 'contentMaxWidth', 'Colors', 'ThemeColor', 'Fonts', 'Spacing', 'BottomTabInset', 'MaxContentWidth']) {
    assert.match(themeSource, new RegExp(`export (?:const|type) ${name}\\b`));
  }
});

test('legacy theme palette and spacing alias the shared compatibility tokens', async () => {
  const themeSource = await readFile(
    new URL('../../src/constants/theme.ts', import.meta.url),
    'utf8',
  );

  assert.deepEqual(designTokens.compatibility.spacing, {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  });
  assert.equal(designTokens.compatibility.colors.background, '#101020');
  assert.match(themeSource, /export const colors = designTokens\.compatibility\.colors;/);
  assert.match(themeSource, /export const spacing = designTokens\.compatibility\.spacing;/);
});
