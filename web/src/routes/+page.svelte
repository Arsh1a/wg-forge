<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Badge from '$lib/components/Badge.svelte';
  let { data, form } = $props();

  let showAdd      = $state(false);
  let extendTarget = $state<string | null>(null);

  const TABLE_HEADERS = ['Name', 'IP', 'Status', 'Session', 'Limit', 'Lifetime', 'Last seen', 'Actions'];
</script>

<div class="min-h-screen bg-bg text-white ">

  <header class="bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
    <span class="font-bold text-lg">wg-forge</span>
    <div class="flex items-center gap-6">
      <span class="text-xs text-muted">{data.endpoint}</span>
      <form method="POST" action="/logout">
        <Button type="submit">Logout</Button>
      </form>
    </div>
  </header>

  <main class="px-8 py-8 max-w-7xl mx-auto">

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold">
        Clients
        <Badge color="gray">{data.clients.length}</Badge>
      </h2>
      <Button variant="primary" size="md" onclick={() => showAdd = !showAdd}>
        + Add Client
      </Button>
    </div>

    {#if form?.error}
      <p class="text-red-400 text-sm mb-4">{form.error}</p>
    {/if}

    {#if showAdd}
      <form method="POST" action="?/add" use:enhance class="flex gap-3 mb-6 items-center">
        <Input name="name" placeholder="Name (e.g. john)" required class="w-52" />
        <Input name="limit" placeholder="Limit e.g. 10GB (optional)" class="w-56" />
        <Button type="submit" variant="primary">Create</Button>
        <Button onclick={() => showAdd = false}>Cancel</Button>
      </form>
    {/if}

    <div class="border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-surface border-b border-border">
            {#each TABLE_HEADERS as h}
              <th class="text-left text-xs text-muted uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.clients as c (c.name)}
            <tr class="border-b border-border hover:bg-surface transition-colors">
              <td class="px-4 py-3 font-semibold">{c.name}</td>
              <td class="px-4 py-3 text-gray-400">{c.ip}</td>
              <td class="px-4 py-3">
                <Badge color={c.status === 'active' ? 'green' : 'red'}>{c.status}</Badge>
              </td>
              <td class="px-4 py-3 text-gray-300">
                {c.sessionHuman}
                {#if c.usagePct}
                  <span class="text-yellow-400 text-xs ml-1">{c.usagePct}%</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-gray-300">{c.limitHuman}</td>
              <td class="px-4 py-3 text-gray-300">{c.lifetimeHuman}</td>
              <td class="px-4 py-3 text-muted">{c.lastSeen}</td>
              <td class="px-4 py-3">
                <form method="POST" action="?/action" use:enhance class="flex gap-2 flex-wrap">
                  <input type="hidden" name="name" value={c.name} />

                  {#if c.status === 'active'}
                    <Button name="action" value="disable" variant="danger" type="submit">Disable</Button>
                  {:else}
                    <Button name="action" value="enable" variant="success" type="submit">Enable</Button>
                  {/if}

                  <Button onclick={() => extendTarget = extendTarget === c.name ? null : c.name}>
                    Extend
                  </Button>

                  <Button
                    name="action" value="remove" variant="danger" type="submit"
                    onclick={(e) => { if (!confirm(`Remove ${c.name}?`)) e.preventDefault(); }}
                  >
                    Remove
                  </Button>
                </form>

                {#if extendTarget === c.name}
                  <form method="POST" action="?/action" use:enhance class="flex gap-2 mt-2 items-center">
                    <input type="hidden" name="name" value={c.name} />
                    <input type="hidden" name="action" value="extend" />
                    <Input name="amount" placeholder="e.g. 5GB" required class="w-28" />
                    <Button type="submit" variant="primary">Add</Button>
                  </form>
                {/if}
              </td>
            </tr>
          {/each}

          {#if data.clients.length === 0}
            <tr>
              <td colspan="8" class="text-center text-muted py-16">No clients yet. Add one above.</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

  </main>
</div>
