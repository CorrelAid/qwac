<script lang="ts">
	import { authModel, client } from '$lib/pocketbase';
	import { base } from '$app/paths';
	import { t } from '$lib/i18n';

	let open = $state(false);

	async function logout() {
		client.authStore.clear();
		open = false;
	}

	function toggle() {
		open = !open;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			open = false;
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener('click', handleClickOutside, true);
			return () => document.removeEventListener('click', handleClickOutside, true);
		}
	});
</script>

{#if $authModel}
	<div class="user-menu">
		<button class="badge" onclick={toggle}>
			{#if $authModel.avatar}
				<img src={client.getFileUrl($authModel, $authModel.avatar)} alt="profile pic" />
			{/if}
			<samp>{$authModel?.name || $authModel?.username || $authModel?.email}</samp>
			<svg class="chevron" class:open width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path
					d="M3 4.5L6 7.5L9 4.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
		{#if open}
			<div class="dropdown">
				<button class="dropdown-item" onclick={logout}>{$t('auth.signOut')}</button>
			</div>
		{/if}
	</div>
{:else}
	<a href="{base}/login" class="sign-in-link">{$t('auth.signIn')}</a>
{/if}

<style>
	.user-menu {
		position: relative;
	}

	.badge {
		background: none;
		border: 1.5px solid transparent;
		border-radius: var(--radius-md);
		padding: var(--spacing-2xs) var(--spacing-xs);
		color: var(--color-text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		min-width: 0;
		transition: background-color 0.15s ease;
	}

	.badge:hover {
		background-color: var(--color-tertiary);
	}

	.badge > img {
		height: 1.5rem;
		width: 1.5rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.badge > samp {
		font-family: var(--font-family-mono);
		font-size: var(--font-size-caption-min);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 150px;
	}

	.chevron {
		transition: transform 0.15s ease;
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + var(--spacing-2xs));
		right: 0;
		background-color: var(--color-white);
		border: var(--dimension-border-width) solid var(--color-primary-darker);
		border-radius: var(--radius-md);
		min-width: 140px;
		z-index: 200;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.dropdown-item {
		display: block;
		width: 100%;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		padding: var(--spacing-xs) var(--spacing-sm);
		color: var(--color-text-primary);
		font-family: var(--font-family-body);
		font-size: var(--font-size-small-min);
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s ease;
	}

	.dropdown-item:hover {
		background-color: var(--color-tertiary);
	}

	.sign-in-link {
		border: 1.5px solid var(--color-primary-darker);
		border-radius: var(--radius-md);
		padding: var(--spacing-2xs) var(--spacing-sm);
		color: var(--color-text-primary);
		font-family: var(--font-family-heading);
		font-size: var(--font-size-label-min);
		font-weight: var(--font-weight-bold);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.sign-in-link:hover {
		background-color: var(--color-primary-darker);
		color: var(--color-white);
	}
</style>
