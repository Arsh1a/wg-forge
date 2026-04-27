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

  const inputCls = 'bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white  focus:outline-none focus:border-[#88171a] w-full';
</script>

{#if label}
  <div>
    <label for={id} class="block text-xs text-gray-500 mb-1 ">{label}</label>
    <input {id} {name} {type} {placeholder} {required} {autocomplete} class="{inputCls} {cls}" />
  </div>
{:else}
  <input {id} {name} {type} {placeholder} {required} {autocomplete} class="{inputCls} {cls}" />
{/if}
