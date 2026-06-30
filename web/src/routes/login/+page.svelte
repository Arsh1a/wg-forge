<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon name="shield" size={26} />
      </span>
      <div>
        <h1 class="text-lg font-semibold tracking-tight text-white">wg-forge</h1>
        <p class="text-sm text-muted">Admin Dashboard</p>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-surface/70 p-7 shadow-xl">
      <form method="POST" use:enhance class="space-y-4">
        {#if form?.error}
          <p class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{form.error}</p>
        {/if}

        <Input id="username" name="username" label="Username" autocomplete="username" required />
        <Input id="password" name="password" label="Password" type="password" autocomplete="current-password" required />

        <Button type="submit" variant="primary" size="md" class="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </div>

    <p class="mt-6 text-center text-xs text-muted">Protected dashboard · authorized access only</p>
  </div>
</div>
