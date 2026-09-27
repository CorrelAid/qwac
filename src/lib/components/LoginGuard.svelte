<script lang="ts">
	import { authModel } from '$lib/pocketbase';
	import type { Snippet } from 'svelte';
	const {
		otherwise,
		children
	}: {
		otherwise?: Snippet<[]>;
		children: Snippet<[]>;
	} = $props();
</script>

{#if $authModel}
	{@render children()}
{:else if otherwise}
	{@render otherwise()}
{/if}
