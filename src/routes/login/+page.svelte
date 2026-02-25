<script lang="ts">
  import { goto } from "$app/navigation";
  import { authModel } from "$lib/pocketbase";
  import LoginForm from "$lib/components/LoginForm.svelte";
  import { metadata } from "$lib/metadata";

  $metadata.title = "Sign In";
  $metadata.headline = "";

  $effect(() => {
    if ($authModel) {
      goto("/");
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
