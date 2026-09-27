<script lang="ts">
	import { authModel, client } from '$lib/pocketbase';
	import type { Snippet } from 'svelte';
	const {
		admin,
		otherwise,
		children
	}: {
		admin?: boolean;
		otherwise?: Snippet<[]>;
		children: Snippet<[]>;
	} = $props();
	const authorized = $derived(
		$authModel && //  must be logged in
			// if admin is specified -- must be admin if admin true, must not be admin if admin false
			(admin === undefined || admin === client.authStore.isAdmin)
	);
</script>

{#if authorized}
	{@render children()}
{:else if otherwise}
	{@render otherwise()}
{/if}
