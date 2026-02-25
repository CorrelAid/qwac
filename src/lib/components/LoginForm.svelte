<script lang="ts">
  const {
    passwordLogin = true,
  } = $props();
  import { login } from "$lib/pocketbase";

  let errorMessage = $state<string | null>(null);
  let submitting = $state(false);

  const form = $state({
    email: "",
    password: "",
  });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = null;
    if (!form.email || !form.password) {
      errorMessage = "Please enter your email and password.";
      return;
    }
    submitting = true;
    try {
      await login(form.email, form.password);
    } catch {
      errorMessage = "Invalid email or password. Please try again.";
    } finally {
      submitting = false;
    }
  }
</script>

{#snippet signin()}
  {#if errorMessage}
    <div class="error-message" role="alert">{errorMessage}</div>
  {/if}
  <label>
    <span>Email / Username</span>
    <input bind:value={form.email} required type="text" placeholder="Email or Username" />
  </label>
  <label>
    <span>Password</span>
    <input
      bind:value={form.password}
      required
      type="password"
      placeholder="Password"
    />
  </label>
  <button type="submit" disabled={submitting}>
    {submitting ? "Signing in..." : "Sign In"}
  </button>
{/snippet}

<form onsubmit={submit}>
  {#if passwordLogin}
    <h2>Sign In</h2>
    {@render signin()}
  {/if}
</form>

<style>
  form {
    max-width: 400px;
    margin: 0 auto;
    padding: var(--spacing-xl);
    background-color: var(--color-white);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  h2 {
    margin-top: 0;
    margin-bottom: var(--spacing-xl);
    color: var(--color-secondary);
    font-family: var(--font-family-heading);
    text-align: center;
    font-size: var(--font-size-h2-min);
  }

  form label {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--spacing-base);
    text-align: left;
  }

  form label span {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-label-min);
    margin-bottom: var(--spacing-2xs);
    color: var(--color-text-primary);
  }

  input[type="text"],
  input[type="password"] {
    padding: var(--spacing-sm);
    border: var(--dimension-border-width) solid var(--color-primary-darker);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-body);
    font-size: var(--font-size-body-min);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  input[type="text"]:focus,
  input[type="password"]:focus {
    outline: none;
    border-color: var(--color-secondary);
    box-shadow: 0 0 0 2px rgba(134, 24, 79, 0.1);
  }

  .error-message {
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: #fff1f1;
    border: 1px solid #ffa3a3;
    border-radius: var(--radius-sm);
    color: #d32f2f;
    font-size: var(--font-size-small-min);
    margin-bottom: var(--spacing-base);
  }

  form button {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-base);
    background-color: var(--color-secondary);
    color: var(--color-text-secondary);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-body-min);
    margin-top: var(--spacing-sm);
    transition: all 0.2s;
  }

  form button:hover {
    background-color: var(--color-primary-darker);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  form button:active {
    transform: translateY(0);
  }

  form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
</style>
