<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '#lib/theme.svelte.js';

	let { data, children } = $props();

	onMount(() => theme.init());
</script>

<svelte:head>
	<title>{data.siteName} — Unlimited Personal Cloud</title>
	<meta
		name="description"
		content="Store, manage, and access your files securely from anywhere. Unlimited storage powered by Telegram."
	/>
</svelte:head>

{@render children()}
