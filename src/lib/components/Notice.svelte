<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		kind = 'info',
		children,
		action
	}: {
		/** error and success are announced to screen readers right away. */
		kind?: 'info' | 'success' | 'error';
		children: Snippet;
		/** A button or link next to the message, e.g. "Try again". */
		action?: Snippet;
	} = $props();
</script>

<div
	class="notice {kind}"
	role={kind === 'error' ? 'alert' : kind === 'success' ? 'status' : undefined}
>
	<div class="message">{@render children()}</div>
	{#if action}<div class="action">{@render action()}</div>{/if}
</div>

<style>
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-base);
		border: 1px solid;
		border-radius: var(--radius-base);
		font-size: var(--font-size-small-min);
		line-height: var(--line-height-relaxed);
	}

	.info {
		background-color: var(--color-white);
		border-color: var(--color-primary-darker);
		color: var(--color-text-primary);
	}

	.success {
		background-color: var(--color-success-bg);
		border-color: var(--color-success-border);
		color: var(--color-success);
	}

	.error {
		background-color: var(--color-error-bg);
		border-color: var(--color-error-border);
		color: var(--color-error);
	}

	.message :global(p) {
		margin: 0;
	}

	.action :global(button) {
		padding: var(--spacing-2xs) var(--spacing-sm);
		background: none;
		border: 1.5px solid currentColor;
		border-radius: var(--radius-sm);
		color: inherit;
		font-family: var(--font-family-body);
		font-weight: var(--font-weight-bold);
		cursor: pointer;
	}
</style>
