<script>
	import { onMount } from 'svelte';
	import { theme } from '#lib/theme.svelte.js';
	import { Sun, Moon } from 'lucide-svelte';

	let { compact = false } = $props();
	onMount(() => theme.init());
</script>

<button
	class="icon-btn"
	onclick={() => theme.toggle()}
	title={theme.current === 'dark' ? 'Switch to light' : 'Switch to dark'}
	aria-label="Toggle colour theme"
>
	{#if theme.current === 'dark'}
		<Sun size={compact ? 14 : 15} strokeWidth={1.6} />
	{:else}
		<Moon size={compact ? 14 : 15} strokeWidth={1.6} />
	{/if}
</button>
