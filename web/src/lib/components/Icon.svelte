<script lang="ts">
  // Minimal inline icon set (Lucide-style, 24x24, stroke = currentColor).
  let {
    name,
    size = 16,
    class: cls = '',
    stroke = 2
  }: { name: string; size?: number; class?: string; stroke?: number } = $props();

  const paths: Record<string, string> = {
    plus:       '<path d="M12 5v14M5 12h14"/>',
    power:      '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    ban:        '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
    gauge:      '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    clock:      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    share:      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 3h3v3M21 7v0M3 14h3v3M7 21h0M14 14h0M17 17v0M21 14v3M14 21h3"/>',
    trash:      '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/>',
    refresh:    '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    x:          '<path d="M18 6 6 18M6 6l12 12"/>',
    copy:       '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>',
    download:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    check:      '<path d="M20 6 9 17l-5-5"/>',
    logout:     '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    users:      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    activity:   '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    arrowDown:  '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    database:   '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    shield:     '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    server:     '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/>',
    search:     '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    globe:      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cls}
  aria-hidden="true"
>
  {@html paths[name] ?? ''}
</svg>
