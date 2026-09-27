<script lang="ts">
	import { page } from '$app/stores';
	import { base, resolve } from '$app/paths';

	const links = [
		['/', 'Home'],
		['/questions', 'Questions']
	] as const;
</script>

<nav>
	<ul>
		{#each links as [href, label] (href)}
			<li>
				<a
					href={resolve(href)}
					class:active={$page.url.pathname === (base + href).replace(/\/$/, '') ||
						$page.url.pathname === base + href}
				>
					{label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
	}

	ul {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: var(--spacing-sm);
	}

	li {
		display: flex;
	}

	a {
		text-decoration: none;
		color: var(--color-text-primary);
		font-family: var(--font-family-heading);
		font-size: var(--font-size-label-min);
		font-weight: var(--font-weight-bold);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		transition: all 0.2s ease-in-out;
		border: 1.5px solid transparent;
	}

	a:hover {
		background-color: var(--color-primary-darker);
		color: var(--color-white);
	}

	a.active {
		background-color: var(--color-secondary);
		color: var(--color-white);
		border-color: var(--color-secondary);
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		ul {
			gap: var(--spacing-xs);
		}

		a {
			padding: var(--spacing-xs) var(--spacing-xs);
			font-size: var(--font-size-caption-min);
		}
	}
</style>
