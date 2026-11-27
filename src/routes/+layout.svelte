<script>
	import '../app.css';
	let { data, children } = $props();
</script>

<svelte:head>
	<title>{data.siteName} — Unlimited Personal Cloud</title>
	<meta
		name="description"
		content="Store, manage, and access your files securely from anywhere. Unlimited storage powered by Telegram."
	/>
</svelte:head>

{@render children()}
