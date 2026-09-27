import { writable } from 'svelte/store';

/** Page metadata set by each page and rendered by the layout. */
export const metadata = writable({ title: '' });
