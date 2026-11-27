<script>
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
	import TelegramLogin from '#lib/components/TelegramLogin.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { ArrowLeft, LoaderCircle } from 'lucide-svelte';

	let { data } = $props();
	let busy = $state(false);
	let error = $state(null);

	$effect(() => {
		if (data.error) error = data.error;
	});

	const messages = {
		invalid_signature: 'Telegram rejected the signature. Please try again.',
		telegram_not_configured: 'Telegram login is not configured on this server yet.'
	};

	async function demoLogin() {
		busy = true;
		try {
			const res = await fetch('/api/auth/demo', { method: 'POST' });
			if (!res.ok) throw new Error('Demo login unavailable');
			location.href = '/drive';
		} catch (e) {
			error = e.message;
			busy = false;
		}
	}
</script>

<div class="min-h-screen">
	<header class="border-b border-rule">
		<div class="mx-auto flex h-14 w-full max-w-[76rem] items-center justify-between px-5 sm:px-8">
			<a href="/" class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink">
				<ArrowLeft size={13} strokeWidth={1.8} /> Back
			</a>
			<Logo />
			<ThemeToggle />
		</div>
	</header>

	<main class="mx-auto grid w-full max-w-[76rem] gap-0 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
		<!-- left: the argument -->
		<section class="border-rule py-12 lg:border-r lg:py-20 lg:pr-16">
			<span class="label">Authentication</span>
			<h1 class="display mt-5 text-[clamp(2.6rem,5vw,4rem)] text-ink">
				Your private cloud,<br /><em class="italic">already</em> in your pocket.
			</h1>
			<p class="mt-6 max-w-[30rem] text-[14px] leading-7 text-ink-2">
				Sign in with the Telegram account you already own. We never see a password, and your files never leave
				the chat you keep with your bot.
			</p>

			<dl class="mt-10 max-w-[30rem] border-t border-rule">
				{#each [['Identity', 'Telegram-signed payload, HMAC-SHA256 verified'], ['Session', 'httpOnly cookie, 30 days, server-side'], ['Storage', 'Your own account — unlimited by design']] as [k, v]}
					<div class="flex items-start justify-between gap-6 border-b border-rule py-3.5">
						<dt class="label pt-0.5">{k}</dt>
						<dd class="max-w-[18rem] text-right text-[12.5px] leading-6 text-ink-2">{v}</dd>
					</div>
				{/each}
			</dl>
		</section>

		<!-- right: the card -->
		<section class="flex items-center py-12 lg:py-20 lg:pl-16">
			<div class="rise w-full max-w-[25rem]">
				<div class="border border-rule bg-paper-2">
					<div class="flex items-center justify-between border-b border-rule px-5 py-3">
						<h2 class="font-display text-xl text-ink">Welcome back</h2>
						<span class="tag">Step 1 of 1</span>
					</div>

					<div class="px-5 py-6">
						{#if error}
							<p class="mb-5 border-l-2 border-danger bg-danger/8 px-3 py-2 text-[12.5px] leading-6 text-danger">
								{messages[error] || error}
							</p>
						{/if}

						<p class="label">Continue with Telegram</p>
						<div class="mt-3">
							<TelegramLogin
								enabled={data.telegramLoginEnabled}
								botUsername={data.botUsername}
								authUrl={`${page.url.origin}/api/auth/telegram`}
							/>
						</div>

						{#if data.demoLogin}
							<div class="my-6 flex items-center gap-3">
								<span class="h-px flex-1 bg-rule"></span>
								<span class="label">or</span>
								<span class="h-px flex-1 bg-rule"></span>
							</div>
							<button class="btn btn-ghost w-full py-2.5" onclick={demoLogin} disabled={busy}>
								{#if busy}
									<LoaderCircle size={14} class="animate-[spin_1s_linear_infinite]" /> Signing in…
								{:else}
									Try the demo account
								{/if}
							</button>
							<p class="mt-3 text-center text-[11px] leading-5 text-ink-3">
								Explores the full drive with local storage — no bot token needed.
							</p>
						{/if}
					</div>

					<p class="border-t border-rule px-5 py-3 text-[11px] leading-5 text-ink-3">
						By continuing you agree to the Terms of Service &amp; Privacy Policy. Session data is stored in
						your own database.
					</p>
				</div>

				<p class="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
					{data.siteName} · Node + SvelteKit
				</p>
			</div>
		</section>
	</main>
</div>
