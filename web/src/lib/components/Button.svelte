<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'ghost' | 'danger' | 'success';
  type Size    = 'sm' | 'md';

  let {
    variant  = 'ghost',
    size     = 'sm',
    type     = 'button',
    name,
    value,
    class:   cls = '',
    onclick,
    children
  }: {
    variant?:  Variant;
    size?:     Size;
    type?:     'button' | 'submit';
    name?:     string;
    value?:    string;
    class?:    string;
    onclick?:  (e: MouseEvent) => void;
    children:  Snippet;
  } = $props();

  const base = 'inline-flex items-center rounded transition-colors font-mono font-medium';

  const sizes: Record<Size, string> = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-4 py-2',
  };

  const variants: Record<Variant, string> = {
    primary: 'bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-500',
    ghost:   'text-gray-300 border border-border hover:border-indigo-500',
    danger:  'text-red-400 border border-red-900 hover:bg-red-900/40',
    success: 'text-green-400 border border-green-900 hover:bg-green-900/40',
  };
</script>

<button {type} {name} {value} {onclick} class="{base} {sizes[size]} {variants[variant]} {cls}">
  {@render children()}
</button>
