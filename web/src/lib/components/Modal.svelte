<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  let {
    title,
    subtitle,
    icon,
    size = 'md',
    onclose,
    children
  }: {
    title:     string;
    subtitle?: string;
    icon?:     string;
    size?:     'sm' | 'md';
    onclose:   () => void;
    children:  Snippet;
  } = $props();

  const widths = { sm: 'max-w-sm', md: 'max-w-lg' };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label={title}
  class="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
  onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
  onkeydown={(e) => { if (e.key === 'Escape') onclose(); }}
>
  <div class="animate-pop flex w-full {widths[size]} flex-col gap-5 rounded-2xl border border-border bg-elevated p-6 shadow-2xl">
    <div class="flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-base font-semibold text-white">
        {#if icon}<Icon name={icon} size={16} class="text-accent" />{/if}
        {title}
        {#if subtitle}<span class="font-mono text-accent-soft">{subtitle}</span>{/if}
      </h3>
      <button
        onclick={onclose}
        class="rounded-lg p-1 text-muted transition-colors hover:bg-surface-hover hover:text-white"
        aria-label="Close"
      >
        <Icon name="x" size={18} />
      </button>
    </div>
    {@render children()}
  </div>
</div>
