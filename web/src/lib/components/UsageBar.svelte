<script lang="ts">
  // pct is a string|null from the data layer (null = unlimited).
  let { pct }: { pct: string | null } = $props();

  const value = $derived(pct === null ? 0 : Math.min(100, Number(pct)));
  // Single hue: WireGuard crimson, brighter as it approaches the cap.
  const color = $derived(value >= 90 ? 'bg-accent-soft' : 'bg-accent');
</script>

<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
  <div class="h-full rounded-full {color} transition-all duration-500" style="width: {value}%"></div>
</div>
