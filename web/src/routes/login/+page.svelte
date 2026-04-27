<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';

  let { form } = $props();
</script>

<div class="min-h-screen bg-bg flex items-center justify-center px-4">
  <div class="w-full max-w-sm bg-surface border border-border rounded-xl p-10">
    <h1 class="text-xl font-bold text-white mb-1 font-mono">wg-forge</h1>
    <p class="text-sm text-gray-500 mb-8 font-mono">Admin Dashboard</p>

    <form method="POST" use:enhance class="space-y-4">
      {#if form?.error}
        <p class="text-red-400 text-sm">{form.error}</p>
      {/if}

      <Input id="username" name="username" label="Username" autocomplete="username" required />
      <Input id="password" name="password" label="Password" type="password" autocomplete="current-password" required />

      <Button type="submit" variant="primary" size="md" class="w-full justify-center mt-2 py-2.5">
        Sign in
      </Button>
    </form>
  </div>
</div>
