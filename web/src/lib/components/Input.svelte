<script lang="ts">
  let {
    label,
    id,
    name,
    type      = 'text',
    placeholder = '',
    required  = false,
    autocomplete,
    class: cls = '',
  }: {
    label?:        string;
    id?:           string;
    name:          string;
    type?:         string;
    placeholder?:  string;
    required?:     boolean;
    autocomplete?: HTMLInputElement['autocomplete'];
    class?:        string;
  } = $props();

  const inputCls =
    'w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white ' +
    'placeholder:text-muted/70 transition-colors ' +
    'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20';
</script>

{#if label}
  <div>
    <label for={id} class="block text-xs font-medium text-dim mb-1.5">{label}</label>
    <input {id} {name} {type} {placeholder} {required} {autocomplete} class="{inputCls} {cls}" />
  </div>
{:else}
  <input {id} {name} {type} {placeholder} {required} {autocomplete} class="{inputCls} {cls}" />
{/if}
