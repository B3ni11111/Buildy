import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// Two emotion caches — swapped based on the active language's direction
// so that MUI's `sx`/styled output (margins, positioning, etc.) mirrors
// correctly for Hebrew and Arabic instead of just flipping text.
export const ltrCache = createCache({ key: 'mui-ltr' });

export const rtlCache = createCache({
  key: 'mui-rtl',
  stylisPlugins: [prefixer, rtlPlugin],
});
