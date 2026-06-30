<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Badge from '$lib/components/Badge.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import UsageBar from '$lib/components/UsageBar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import QRCode from 'qrcode';

  let { data, form } = $props();

  type Client = (typeof data.clients)[number];

  let showAdd      = $state(false);
  let search       = $state('');
  let extendTarget = $state<string | null>(null);
  let expiryTarget = $state<string | null>(null);
  let shareClient  = $state<string | null>(null);
  let configText   = $state('');
  let qrDataUrl    = $state('');
  let shareLoading = $state(false);
  let copied       = $state(false);
  let regenerating = $state(false);
  let regenConfirm = $state(false);

  let selected = $state<Set<string>>(new Set());

  // ---- derived data -------------------------------------------------------
  const filtered = $derived(
    search.trim()
      ? data.clients.filter((c: Client) =>
          c.name.toLowerCase().includes(search.trim().toLowerCase()))
      : data.clients
  );

  const activeCount   = $derived(data.clients.filter((c: Client) => c.status === 'active').length);
  const totalSession  = $derived(data.clients.reduce((s: number, c: Client) => s + c.sessionBytes, 0));
  const totalLifetime = $derived(data.clients.reduce((s: number, c: Client) => s + c.lifetimeBytes, 0));

  const allNames    = $derived(filtered.map((c: Client) => c.name));
  const allSelected = $derived(allNames.length > 0 && allNames.every((n: string) => selected.has(n)));
  const anySelected = $derived(selected.size > 0);

  function humanBytes(b: number): string {
    if (b >= 1099511627776) return (b / 1099511627776).toFixed(2) + ' TB';
    if (b >= 1073741824)    return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576)       return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024)          return (b / 1024).toFixed(1) + ' KB';
    return b + ' B';
  }

  // ---- selection ----------------------------------------------------------
  function toggleAll() {
    if (allSelected) selected = new Set();
    else             selected = new Set(allNames);
  }

  function toggleOne(name: string) {
    const s = new Set(selected);
    if (s.has(name)) s.delete(name);
    else             s.add(name);
    selected = s;
  }

  // ---- share modal --------------------------------------------------------
  async function openShare(name: string) {
    shareClient  = name;
    configText   = '';
    qrDataUrl    = '';
    shareLoading = true;
    copied       = false;
    try {
      const res = await fetch(`/api/config/${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      configText = d.config;
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
      await openShare(shareClient);
    } finally {
      regenerating = false;
    }
  }

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(configText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = configText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
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

<div class="min-h-screen text-white">

  <!-- Header -->
  <header class="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
      <div class="flex items-center gap-2.5">
        <span class="font-mono text-[15px] font-semibold tracking-tight">wg-forge</span>
      </div>
      <form method="POST" action="/logout">
        <Button type="submit" title="Log out">
          <Icon name="logout" size={14} />
          <span class="hidden sm:inline">Logout</span>
        </Button>
      </form>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-6 py-8">

    <!-- Server status strip -->
    <section class="mb-8 flex flex-col sm:flex-row flex-wrap items-center gap-x-7 gap-y-4 rounded-xl border border-border bg-surface/40 px-5 py-4">
      <div class="flex items-center gap-3">
        <span class="relative flex h-2.5 w-2.5" title="Server online">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60"></span>
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#6cae80]"></span>
        </span>
        <div class="leading-tight">
          <p class="font-mono text-sm text-white">{data.endpoint || 'wg0'}</p>
          <p class="text-[11px] uppercase tracking-wider text-muted">Server online</p>
        </div>
      </div>

      <div class="hidden h-9 w-px bg-border sm:block"></div>

      <div class="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3">
        {#snippet metric(label: string, value: string, sub?: string)}
          <div class="leading-tight">
            <p class="font-mono text-lg font-semibold tnum text-white">
              {value}{#if sub}<span class="ml-0.5 text-sm font-normal text-muted">{sub}</span>{/if}
            </p>
            <p class="text-[11px] uppercase tracking-wider text-muted">{label}</p>
          </div>
        {/snippet}
        {@render metric('Clients',  String(data.clients.length))}
        {@render metric('Active',   String(activeCount), `/ ${data.clients.length}`)}
        {@render metric('Session',  humanBytes(totalSession))}
        {@render metric('Lifetime', humanBytes(totalLifetime))}
      </div>
    </section>

    <!-- Toolbar -->
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <h2 class="flex items-center gap-2 text-base font-semibold">
        Clients
        <span class="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-dim">{data.clients.length}</span>
      </h2>

      <div class="ml-auto flex items-center gap-2.5">
        <div class="relative">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="search" size={15} />
          </span>
          <input
            bind:value={search}
            placeholder="Search clients…"
            class="w-44 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted/70 transition-colors focus:w-56 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <Button variant="primary" size="md" onclick={() => showAdd = true}>
          <Icon name="plus" size={16} />
          Add Client
        </Button>
      </div>
    </div>

    {#if form?.error && !showAdd && !extendTarget && !expiryTarget}
      <p class="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent-soft">{form.error}</p>
    {/if}

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-border bg-surface/40">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left">
              <th class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onchange={toggleAll}
                  class="h-3.5 w-3.5 cursor-pointer accent-accent"
                />
              </th>
              {#each ['Name', 'IP', 'Status', 'Usage', 'Lifetime', 'Last seen', 'Expires'] as h}
                <th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted">{h}</th>
              {/each}
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as c (c.name)}
              <tr
                class="group border-b border-border/60 transition-colors last:border-0 hover:bg-surface-hover/50 hover:shadow-[inset_2px_0_0_var(--color-accent)]"
                class:bg-surface-hover={selected.has(c.name)}
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.name)}
                    onchange={() => toggleOne(c.name)}
                    class="h-3.5 w-3.5 cursor-pointer accent-accent"
                  />
                </td>

                <!-- Name -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-hover font-mono text-xs font-semibold uppercase text-dim">
                      {c.name.slice(0, 1)}
                    </span>
                    <span class="font-medium text-white">{c.name}</span>
                  </div>
                </td>

                <!-- IP -->
                <td class="px-4 py-3">
                  <span class="font-mono text-xs text-dim">{c.ip}</span>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <Badge color={c.status === 'active' ? 'green' : 'red'} dot>{c.status}</Badge>
                </td>

                <!-- Usage -->
                <td class="px-4 py-3">
                  <div class="min-w-37.5">
                    <div class="mb-1.5 flex items-center justify-between gap-2 font-mono text-xs">
                      <span class="tnum text-gray-300">
                        {c.sessionHuman}{#if c.limitBytes}<span class="text-muted"> / {c.limitHuman}</span>{/if}
                      </span>
                      {#if c.usagePct}
                        <span class="tnum font-medium {Number(c.usagePct) >= 90 ? 'text-accent-soft' : 'text-muted'}">{c.usagePct}%</span>
                      {/if}
                    </div>
                    {#if c.limitBytes}
                      <UsageBar pct={c.usagePct} />
                    {:else}
                      <div class="text-xs text-muted">No limit</div>
                    {/if}
                  </div>
                </td>

                <!-- Lifetime -->
                <td class="px-4 py-3 font-mono tnum text-dim">{c.lifetimeHuman}</td>

                <!-- Last seen -->
                <td class="px-4 py-3 font-mono text-xs text-muted">{c.lastSeen}</td>

                <!-- Expires -->
                <td class="px-4 py-3 font-mono text-xs">
                  {#if c.expiresHuman === 'expired'}
                    <span class="text-red-400">expired</span>
                  {:else if c.expiresHuman === 'never'}
                    <span class="text-muted">never</span>
                  {:else}
                    <span class="tnum text-dim">{c.expiresHuman}</span>
                  {/if}
                </td>

                <!-- Actions -->
                <td class="px-4 py-3">
                  <form method="POST" action="?/action" use:enhance class="flex items-center justify-end gap-1">
                    <input type="hidden" name="name" value={c.name} />

                    {#if c.status === 'active'}
                      <Button name="action" value="disable" variant="subtle" size="icon" type="submit" title="Disable">
                        <Icon name="ban" size={15} />
                      </Button>
                    {:else}
                      <Button name="action" value="enable" variant="subtle" size="icon" type="submit" title="Enable" class="text-[#82c096] hover:text-[#9bcead]">
                        <Icon name="power" size={15} />
                      </Button>
                    {/if}

                    <Button variant="subtle" size="icon" title="Extend limit"
                      onclick={() => { extendTarget = c.name; }}>
                      <Icon name="gauge" size={15} />
                    </Button>

                    <Button variant="subtle" size="icon" title="Set expiry"
                      onclick={() => { expiryTarget = c.name; }}>
                      <Icon name="clock" size={15} />
                    </Button>

                    <Button variant="subtle" size="icon" title="Share config" onclick={() => openShare(c.name)}>
                      <Icon name="share" size={15} />
                    </Button>

                    <Button name="action" value="remove" variant="subtle" size="icon" type="submit" title="Remove"
                      class="hover:bg-accent/10 hover:text-accent-soft"
                      onclick={(e) => { if (!confirm(`Remove ${c.name}?`)) e.preventDefault(); }}>
                      <Icon name="trash" size={15} />
                    </Button>
                  </form>
                </td>
              </tr>
            {/each}

            {#if filtered.length === 0}
              <tr>
                <td colspan="9" class="py-16 text-center">
                  {#if data.clients.length === 0}
                    <div class="flex flex-col items-center gap-3 text-muted">
                      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
                        <Icon name="users" size={22} />
                      </span>
                      <p class="text-sm">No clients yet.</p>
                      <Button variant="primary" size="md" onclick={() => showAdd = true}>
                        <Icon name="plus" size={16} /> Add your first client
                      </Button>
                    </div>
                  {:else}
                    <p class="text-sm text-muted">No clients match “{search}”.</p>
                  {/if}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Floating bulk action bar (overlay — never shifts the table) -->
{#if anySelected}
  <div class="animate-pop fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
    <form
      method="POST" action="?/bulk"
      use:enhance={() => ({ update }) => update().then(() => { selected = new Set(); })}
      class="flex items-center gap-3 rounded-xl border border-border bg-elevated/95 px-3 py-2.5 shadow-2xl backdrop-blur-md"
    >
      <span class="pl-1 text-sm font-medium text-dim">{selected.size} selected</span>
      {#each [...selected] as name}
        <input type="hidden" name="name" value={name} />
      {/each}
      <div class="h-5 w-px bg-border"></div>
      <Button name="action" value="enable"  variant="success" type="submit">Enable</Button>
      <Button name="action" value="disable" variant="danger"  type="submit">Disable</Button>
      <Button
        name="action" value="remove" variant="danger" type="submit"
        onclick={(e) => { if (!confirm(`Remove ${selected.size} clients?`)) e.preventDefault(); }}
      >Remove</Button>
      <button
        type="button"
        onclick={() => selected = new Set()}
        class="ml-0.5 rounded-md p-1 text-muted transition-colors hover:bg-surface-hover hover:text-white"
        aria-label="Clear selection"
      >
        <Icon name="x" size={16} />
      </button>
    </form>
  </div>
{/if}

<!-- Add client modal -->
{#if showAdd}
  <Modal title="Add client" icon="plus" onclose={() => showAdd = false}>
    <form
      method="POST" action="?/add"
      use:enhance={() => ({ result, update }) => update().then(() => { if (result.type !== 'failure') showAdd = false; })}
      class="flex flex-col gap-4"
    >
      {#if form?.error}
        <p class="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent-soft">{form.error}</p>
      {/if}
      <Input name="name"   label="Name" placeholder="e.g. john" required />
      <Input name="limit"  label="Bandwidth limit (optional)" placeholder="e.g. 10GB" />
      <Input name="expiry" label="Expiry (optional)" placeholder="e.g. 30d" />
      <div class="flex justify-end gap-2 pt-1">
        <Button size="md" onclick={() => showAdd = false}>Cancel</Button>
        <Button type="submit" variant="primary" size="md">Create client</Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Extend limit modal -->
{#if extendTarget}
  <Modal title="Extend limit" subtitle={extendTarget} icon="gauge" size="sm" onclose={() => extendTarget = null}>
    <form
      method="POST" action="?/action"
      use:enhance={() => ({ result, update }) => update().then(() => { if (result.type !== 'failure') extendTarget = null; })}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="name" value={extendTarget} />
      <input type="hidden" name="action" value="extend" />
      <Input name="amount" label="Amount to add" placeholder="e.g. 5GB" required />
      <div class="flex justify-end gap-2 pt-1">
        <Button size="md" onclick={() => extendTarget = null}>Cancel</Button>
        <Button type="submit" variant="primary" size="md">Add bandwidth</Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Set expiry modal -->
{#if expiryTarget}
  <Modal title="Set expiry" subtitle={expiryTarget} icon="clock" size="sm" onclose={() => expiryTarget = null}>
    <form
      method="POST" action="?/action"
      use:enhance={() => ({ result, update }) => update().then(() => { if (result.type !== 'failure') expiryTarget = null; })}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="name" value={expiryTarget} />
      <input type="hidden" name="action" value="setexpiry" />
      <Input name="amount" label="New expiry" placeholder="e.g. 30d, 12h, or never" required />
      <div class="flex justify-end gap-2 pt-1">
        <Button size="md" onclick={() => expiryTarget = null}>Cancel</Button>
        <Button type="submit" variant="primary" size="md">Set expiry</Button>
      </div>
    </form>
  </Modal>
{/if}

<!-- Share config modal -->
{#if shareClient !== null}
  <Modal title="Share config" subtitle={shareClient} icon="share" onclose={closeShare}>
    {#if shareLoading}
      <p class="py-10 text-center text-sm text-muted">Loading…</p>

    {:else if configText}
      <div class="relative">
        <pre class="overflow-x-auto whitespace-pre rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-gray-300">{configText}</pre>
        <button
          onclick={copyConfig}
          class="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-dim transition-colors hover:bg-surface-hover hover:text-white"
        >
          {#if copied}<Icon name="check" size={13} class="text-[#82c096]" /> Copied{:else}<Icon name="copy" size={13} /> Copy{/if}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button onclick={downloadConfig}>
          <Icon name="download" size={14} /> Download .conf
        </Button>
        <div class="ml-auto flex items-center gap-2">
          {#if regenConfirm}
            <span class="text-xs text-muted">Revokes current config!</span>
            <Button variant="danger" onclick={regenerateKey} disabled={regenerating}>
              {regenerating ? 'Regenerating…' : 'Confirm'}
            </Button>
            <Button onclick={() => regenConfirm = false}>Cancel</Button>
          {:else}
            <Button variant="danger" onclick={() => regenConfirm = true}>
              <Icon name="refresh" size={14} /> Regenerate key
            </Button>
          {/if}
        </div>
      </div>

      {#if qrDataUrl}
        <div class="flex flex-col items-center gap-2 border-t border-border pt-4">
          <p class="text-xs text-muted">Scan with the WireGuard mobile app</p>
          <img src={qrDataUrl} alt="WireGuard QR code" class="rounded-lg" width="220" height="220" />
        </div>
      {/if}
    {:else}
      <p class="text-sm text-accent-soft">Failed to load config.</p>
    {/if}
  </Modal>
{/if}
