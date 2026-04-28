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
    disabled = false,
    children
  }: {
    variant?:  Variant;
    size?:     Size;
    type?:     'button' | 'submit';
    name?:     string;
    value?:    string;
    class?:    string;
    onclick?:  (e: MouseEvent) => void;
    disabled?: boolean;
    children:  Snippet;
  } = $props();

  const base = 'inline-flex items-center rounded transition-colors  font-medium';

  const sizes: Record<Size, string> = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-4 py-2',
  };

  const variants: Record<Variant, string> = {
    primary: 'bg-[#88171a] hover:bg-[#a01e22] text-white border border-[#88171a]',
    ghost:   'text-gray-300 border border-border hover:border-[#88171a] hover:text-white',
    danger:  'text-red-400 border border-red-900 hover:bg-red-900/40',
    success: 'text-green-400 border border-green-900 hover:bg-green-900/40',
  };
</script>

<button {type} {name} {value} {onclick} {disabled} class="{base} {sizes[size]} {variants[variant]} {cls} disabled:opacity-50 disabled:cursor-not-allowed">
  {@render children()}
</button>
