<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<input
	type="text"
	class="text-input"
	readonly
	tabindex="-1"
	aria-disabled="true"
	placeholder={$t('preview.textResponse')}
/>

<style>
	.text-input {
		width: 100%;
		max-width: 400px;
		padding: var(--spacing-xs) var(--spacing-sm);
		border: var(--dimension-border-width) solid var(--color-primary-darker);
		border-radius: var(--radius-sm);
		font-family: var(--font-family-body);
		font-size: var(--font-size-body-min);
		background-color: var(--color-white);
		color: var(--color-text-primary);
	}
</style>
