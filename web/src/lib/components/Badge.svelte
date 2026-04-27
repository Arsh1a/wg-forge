<script lang="ts">
  import type { Snippet } from 'svelte';

  type Color = 'green' | 'red' | 'yellow' | 'gray';

  let {
    color = 'gray',
    children
  }: {
    color?:   Color;
    children: Snippet;
  } = $props();

  const colors: Record<Color, string> = {
    green:  'bg-green-900/50 text-green-400',
    red:    'bg-red-900/50 text-red-400',
    yellow: 'bg-yellow-900/50 text-yellow-400',
    gray:   'bg-border text-gray-400',
  };
</script>

<span class="text-xs font-semibold px-2 py-0.5 rounded {colors[color]}">
  {@render children()}
</span>
