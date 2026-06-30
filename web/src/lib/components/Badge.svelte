<script lang="ts">
  import type { Snippet } from 'svelte';

  type Color = 'green' | 'red' | 'yellow' | 'gray';

  let {
    color = 'gray',
    dot = false,
    children
  }: {
    color?:   Color;
    dot?:     boolean;
    children: Snippet;
  } = $props();

  const wrap: Record<Color, string> = {
    green:  'bg-online/12 text-[#82c096] border-online/25',
    red:    'bg-accent/12 text-accent-soft border-accent/30',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gray:   'bg-surface-hover text-dim border-border'
  };

  const dotColor: Record<Color, string> = {
    green:  'bg-[#6cae80]',
    red:    'bg-accent-soft',
    yellow: 'bg-amber-400',
    gray:   'bg-muted'
  };
</script>

<span class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border {wrap[color]}">
  {#if dot}
    <span class="h-1.5 w-1.5 rounded-full {dotColor[color]}"></span>
  {/if}
  {@render children()}
</span>
