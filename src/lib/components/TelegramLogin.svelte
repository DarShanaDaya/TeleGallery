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
		script.setAttribute('data-radius', '4');
		script.setAttribute('data-userpic', 'true');
		script.setAttribute('data-request-access', 'write');
		script.setAttribute('data-auth-url', authUrl);
		container.appendChild(script);
	});
</script>

<div class="flex min-h-[48px] items-center justify-center">
	{#if enabled && botUsername}
		<div bind:this={container}></div>
	{:else}
		<div class="w-full border border-rule border-dashed px-4 py-3.5">
			<p class="text-[11px] text-warn">Not configured</p>
			<p class="mt-2 text-[12px] leading-6 text-ink-2">
				Add <code class="border border-rule bg-paper-3 px-1 text-[11.5px]">TELEGRAM_BOT_TOKEN</code> and
				<code class="border border-rule bg-paper-3 px-1 text-[11.5px]">TELEGRAM_BOT_USERNAME</code> to
				<code class="border border-rule bg-paper-3 px-1 text-[11.5px]">.env</code> to show the official
				Telegram widget.
			</p>
		</div>
	{/if}
</div>
