<script lang="ts">
	import { client, clearOnAuthError } from '$lib/pocketbase';
	import LoginGuard from '$lib/components/LoginGuard.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { metadata } from '$lib/metadata';
	import { t } from '$lib/i18n';

	$effect(() => {
		$metadata.title = $t('upload.title');
	});
	$metadata.headline = '';

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

	function validateFile(f: File): string | null {
		if (!f.name.endsWith('.xml')) return $t('upload.xmlOnly');
		if (f.size > MAX_FILE_SIZE) return $t('upload.tooLarge');
		return null;
	}

	type ValidationError = { rule?: string; test?: string; location?: string; message?: string };
	type UploadResult = {
		valid: boolean;
		message?: string;
		errors?: (string | ValidationError)[];
		error?: string;
	};

	let file = $state<File | null>(null);
	let uploading = $state(false);
	let result = $state<UploadResult | null>(null);
	let dragover = $state(false);

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const selected = input.files?.[0] ?? null;
		if (selected) {
			const err = validateFile(selected);
			if (err) {
				result = { valid: false, message: err };
				file = null;
				return;
			}
		}
		file = selected;
		result = null;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;
		const dropped = e.dataTransfer?.files?.[0];
		if (dropped) {
			const err = validateFile(dropped);
			if (err) {
				result = { valid: false, message: err };
				return;
			}
			file = dropped;
			result = null;
		}
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragover = true;
	}

	function onDragLeave() {
		dragover = false;
	}

	async function upload() {
		if (!file) return;
		const fileErr = validateFile(file);
		if (fileErr) {
			result = { valid: false, message: fileErr };
			return;
		}
		uploading = true;
		result = null;
		try {
			const fd = new FormData();
			fd.append('file', file);
			result = await client.send('/api/validate', { method: 'POST', body: fd });
		} catch (e: any) {
			clearOnAuthError(e);
			if (import.meta.env.DEV) {
				console.error('Upload error:', e);
			}
			// client.send() throws ClientResponseError — actual data is in e.response
			const resp = e.response || e.data || {};
			if (resp.valid === false && resp.errors) {
				// Backend returned validation errors (400)
				result = { valid: false, errors: resp.errors };
			} else {
				result = { valid: false, message: $t('upload.uploadFailed') };
			}
		} finally {
			uploading = false;
		}
	}

	function reset() {
		file = null;
		result = null;
	}
</script>

<LoginGuard>
	<div class="upload-page">
		<a href="/" class="back-link">&larr; {$t('upload.back')}</a>

		<h2>{$t('upload.title')}</h2>
		<p class="description">{$t('upload.description')}</p>

		{#if result}
			<div class="result-box" class:success={result.valid} class:error={!result.valid}>
				<strong>{result.valid ? $t('upload.importSuccess') : $t('upload.importFailed')}</strong>
				{#if result.message}
					<p>{result.message}</p>
				{/if}
				{#if result.error}
					<p>{result.error}</p>
				{/if}
				{#if result.errors?.length}
					<ul class="error-list">
						{#each result.errors as err}
							<li>
								{#if typeof err === 'string'}
									{err}
								{:else}
									<span class="error-message">{err.message || err.rule || 'Unknown error'}</span>
									{#if err.location}
										<span class="error-location">{err.location}</span>
									{/if}
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				<button class="reset-btn" onclick={reset}>{$t('upload.uploadAnother')}</button>
			</div>
		{:else}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="drop-zone"
				class:dragover
				ondrop={onDrop}
				ondragover={onDragOver}
				ondragleave={onDragLeave}
			>
				{#if file}
					<p class="file-name">{file.name}</p>
					<p class="file-size">{(file.size / 1024).toFixed(1)} KB</p>
				{:else}
					<p>{$t('upload.dropHint')}</p>
				{/if}
				<label class="file-label">
					{file ? $t('upload.chooseDifferent') : $t('upload.chooseFile')}
					<input
						type="file"
						accept=".xml,application/xml,text/xml"
						onchange={onFileChange}
						hidden
					/>
				</label>
			</div>

			<button class="upload-btn" onclick={upload} disabled={!file || uploading}>
				{uploading ? $t('upload.uploading') : $t('upload.importCodebook')}
			</button>
		{/if}
	</div>

	{#snippet otherwise()}
		<div class="login-container">
			<p>{$t('auth.signInRequired')}</p>
			<LoginForm />
		</div>
	{/snippet}
</LoginGuard>

<style>
	.upload-page {
		max-width: 600px;
		margin: var(--spacing-base) auto;
	}

	.back-link {
		font-size: var(--font-size-small-min);
		color: var(--color-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h2 {
		color: var(--color-secondary);
		margin: var(--spacing-sm) 0 var(--spacing-xs);
	}

	.description {
		font-size: var(--font-size-small-min);
		color: var(--color-text-primary);
		opacity: 0.7;
		margin-bottom: var(--spacing-lg);
	}

	.drop-zone {
		border: 2px dashed var(--color-primary-darker);
		border-radius: var(--radius-md);
		padding: var(--spacing-xl) var(--spacing-base);
		text-align: center;
		transition: all 0.15s;
		background-color: var(--color-white);
	}

	.drop-zone.dragover {
		border-color: var(--color-secondary);
		background-color: #f0f7ff;
	}

	.drop-zone p {
		margin: 0 0 var(--spacing-xs);
		color: var(--color-text-primary);
		opacity: 0.7;
	}

	.file-name {
		font-weight: var(--font-weight-bold);
		font-family: var(--font-family-mono);
		opacity: 1 !important;
		color: var(--color-secondary) !important;
	}

	.file-size {
		font-size: var(--font-size-caption-min);
	}

	.file-label {
		display: inline-block;
		padding: var(--spacing-2xs) var(--spacing-sm);
		border: 1.5px solid var(--color-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-secondary);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-caption-min);
		font-family: var(--font-family-body);
		cursor: pointer;
		transition: all 0.15s;
	}

	.file-label:hover {
		background-color: var(--color-secondary);
		color: var(--color-white);
	}

	.upload-btn {
		margin-top: var(--spacing-base);
		width: 100%;
		padding: var(--spacing-xs) var(--spacing-base);
		background-color: var(--color-secondary);
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-white);
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-body-min);
		font-family: var(--font-family-body);
		cursor: pointer;
		transition: all 0.15s;
	}

	.upload-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.upload-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.result-box {
		padding: var(--spacing-base);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-base);
	}

	.result-box.success {
		background-color: #f0fdf4;
		border: 1px solid #86efac;
		color: #166534;
	}

	.result-box.error {
		background-color: #fff1f1;
		border: 1px solid #ffa3a3;
		color: #d32f2f;
	}

	.result-box p {
		margin: var(--spacing-xs) 0 0;
	}

	.error-list {
		margin: var(--spacing-xs) 0 0;
		padding-left: var(--spacing-base);
		font-size: var(--font-size-small-min);
	}

	.error-list li {
		margin-bottom: var(--spacing-xs);
	}

	.error-message {
		display: block;
	}

	.error-location {
		display: block;
		font-size: var(--font-size-caption-min);
		font-family: var(--font-family-mono);
		opacity: 0.7;
		margin-top: 2px;
	}

	.reset-btn {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-2xs) var(--spacing-sm);
		background: none;
		border: 1.5px solid currentColor;
		border-radius: var(--radius-sm);
		color: inherit;
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-caption-min);
		font-family: var(--font-family-body);
		cursor: pointer;
	}

	.reset-btn:hover {
		opacity: 0.8;
	}

	.login-container {
		text-align: center;
		margin-top: var(--spacing-xl);
	}
</style>
