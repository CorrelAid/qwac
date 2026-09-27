/**
 * A file name built from user data (e.g. a study title): characters that
 * aren't allowed in file names on common systems become "_", and the result
 * is trimmed and shortened. Falls back to `fallback` when nothing is left.
 */
export function safeFilename(name: string, fallback: string): string {
	const cleaned = name
		.replace(/\s+/g, ' ')
		// eslint-disable-next-line no-control-regex -- control characters are exactly what we strip
		.replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, '_')
		.trim()
		.replace(/^\.+/, '')
		.slice(0, 120)
		.trim();
	return cleaned || fallback;
}

/** Saves a blob as a download. */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	// Revoking right after click() can cancel the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
