<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'subtle';
  type Size    = 'sm' | 'md' | 'icon';

  let {
    variant  = 'ghost',
    size     = 'sm',
    type     = 'button',
    name,
    value,
    title,
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
    title?:    string;
    class?:    string;
    onclick?:  (e: MouseEvent) => void;
    disabled?: boolean;
    children:  Snippet;
  } = $props();

  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium leading-none ' +
    'transition-all duration-150 select-none cursor-pointer ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes: Record<Size, string> = {
    sm:   'text-xs px-2.5 py-1.5',
    md:   'text-sm px-4 py-2.5',
    icon: 'h-8 w-8 p-0'
  };

  const variants: Record<Variant, string> = {
    primary: 'bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-hover',
    ghost:   'bg-surface text-dim border border-border hover:border-border-hover hover:text-white hover:bg-surface-hover',
    danger:  'bg-transparent text-accent-soft border border-accent/20 hover:bg-accent/10 hover:border-accent/50 hover:text-[#d97a7d]',
    success: 'bg-transparent text-[#82c096] border border-online/20 hover:bg-online/10 hover:border-online/40 hover:text-[#9bcead]',
    subtle:  'text-muted hover:text-white hover:bg-surface-hover'
  };
</script>

<button
  {type}
  {name}
  {value}
  {title}
  {onclick}
  {disabled}
  class="{base} {sizes[size]} {variants[variant]} {cls}"
>
  {@render children()}
</button>
