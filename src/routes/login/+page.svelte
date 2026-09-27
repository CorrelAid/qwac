<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authModel } from '$lib/pocketbase';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { metadata } from '$lib/metadata';
	import { t } from '$lib/i18n';

	$effect(() => {
		$metadata.title = $t('auth.signIn');
	});

	$effect(() => {
		if ($authModel) {
			goto(resolve('/'));
		}
	});
</script>

<div class="login-container">
	<LoginForm />
</div>

<style>
	.login-container {
		margin-top: var(--spacing-xl);
	}
</style>
