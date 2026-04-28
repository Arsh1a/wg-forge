<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import QRCode from 'qrcode';

  let { data, form } = $props();

  let showAdd      = $state(false);
  let extendTarget = $state<string | null>(null);
  let shareClient  = $state<string | null>(null);
  let configText   = $state('');
  let qrDataUrl    = $state('');
  let shareLoading = $state(false);
  let copied          = $state(false);
  let regenerating    = $state(false);
  let regenConfirm    = $state(false);

  const TABLE_HEADERS = ['Name', 'IP', 'Status', 'Session', 'Limit', 'Lifetime', 'Last seen', 'Actions'];

  async function openShare(name: string) {
    shareClient  = name;
    configText   = '';
    qrDataUrl    = '';
    shareLoading = true;
    copied       = false;
    try {
      const res = await fetch(`/api/config/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      configText = data.config;
      qrDataUrl  = await QRCode.toDataURL(configText, { width: 256, margin: 2 });
    } finally {
      shareLoading = false;
    }
  }

  function closeShare() {
    shareClient  = null;
    configText   = '';
    qrDataUrl    = '';
    regenConfirm = false;
  }

  async function regenerateKey() {
    if (!shareClient) return;
    regenerating = true;
    regenConfirm = false;
    try {
      const fd = new FormData();
      fd.set('name', shareClient);
      fd.set('action', 'regenerate');
      await fetch('/?/action', { method: 'POST', body: fd });
      // reload the config after regeneration
      await openShare(shareClient);
    } finally {
      regenerating = false;
    }
  }

  async function copyConfig() {
    await navigator.clipboard.writeText(configText);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function downloadConfig() {
    const blob = new Blob([configText], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${shareClient}.conf`;
    a.click();
    URL.revokeObjectURL(url);
  }
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

                  <Button onclick={() => openShare(c.name)}>
                    Share
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

{#if shareClient !== null}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Share config"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onclick={(e) => { if (e.target === e.currentTarget) closeShare(); }}
    onkeydown={(e) => { if (e.key === 'Escape') closeShare(); }}
  >
    <div class="bg-surface border border-border rounded-2xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5">

      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-base">Share config — <span class="text-accent">{shareClient}</span></h3>
        <button onclick={closeShare} class="text-muted hover:text-white text-xl leading-none">&times;</button>
      </div>

      {#if shareLoading}
        <p class="text-muted text-sm text-center py-8">Loading…</p>

      {:else if configText}
        <div class="relative">
          <pre class="bg-bg border border-border rounded-lg text-xs text-gray-300 p-4 overflow-x-auto whitespace-pre">{configText}</pre>
          <button
            onclick={copyConfig}
            class="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-border hover:bg-muted text-gray-300 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div class="flex gap-3 flex-wrap items-center">
          <Button variant="primary" onclick={copyConfig}>{copied ? 'Copied!' : 'Copy text'}</Button>
          <Button onclick={downloadConfig}>Download .conf</Button>
          <div class="ml-auto flex gap-2 items-center">
            {#if regenConfirm}
              <span class="text-xs text-muted">Revokes current config!</span>
              <Button variant="danger" onclick={regenerateKey} disabled={regenerating}>
                {regenerating ? 'Regenerating…' : 'Confirm'}
              </Button>
              <Button onclick={() => regenConfirm = false}>Cancel</Button>
            {:else}
              <Button variant="danger" onclick={() => regenConfirm = true}>Regenerate key</Button>
            {/if}
          </div>
        </div>

        {#if qrDataUrl}
          <div class="flex flex-col items-center gap-2 pt-2 border-t border-border">
            <p class="text-xs text-muted">Scan with WireGuard mobile app</p>
            <img src={qrDataUrl} alt="WireGuard QR code" class="rounded-lg" width="256" height="256" />
          </div>
        {/if}
      {:else}
        <p class="text-red-400 text-sm">Failed to load config.</p>
      {/if}

    </div>
  </div>
{/if}
