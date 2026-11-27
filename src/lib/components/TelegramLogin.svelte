<script>
	import { onMount } from 'svelte';

	let { botUsername, enabled, authUrl } = $props();
	let container = $state(null);

	onMount(() => {
		if (!enabled || !botUsername || !container) return;
		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.async = true;
		script.setAttribute('data-telegram-login', botUsername);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-radius', '12');
		script.setAttribute('data-userpic', 'true');
		script.setAttribute('data-request-access', 'write');
		script.setAttribute('data-auth-url', authUrl);
		container.appendChild(script);
	});
</script>

<div class="flex min-h-[52px] items-center justify-center">
	{#if enabled && botUsername}
		<div bind:this={container}></div>
	{:else}
		<div class="w-full rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-center text-xs leading-relaxed text-amber-200/90">
			Telegram login isn't configured yet. Add <code class="rounded bg-black/30 px-1">TELEGRAM_BOT_TOKEN</code> and
			<code class="rounded bg-black/30 px-1">TELEGRAM_BOT_USERNAME</code> to <code class="rounded bg-black/30 px-1">.env</code>
			to enable the official Telegram widget. See <code class="rounded bg-black/30 px-1">README.md</code>.
		</div>
	{/if}
</div>
