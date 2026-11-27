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
		invalid_signature: 'Telegram could not verify that sign-in. Please try again.',
		telegram_not_configured: 'Telegram sign-in is not set up on this server yet.'
	};

	async function demoLogin() {
		busy = true;
		try {
			const res = await fetch('/api/auth/demo', { method: 'POST' });
			if (!res.ok) throw new Error('The demo account is unavailable right now.');
			location.href = data.next;
		} catch (e) {
			error = e.message;
			busy = false;
		}
	}
</script>

<div class="min-h-screen">
	<header class="border-b border-rule">
		<div class="mx-auto flex h-16 w-full max-w-[68rem] items-center justify-between px-5 sm:px-8">
			<a href="/" class="flex items-center gap-2 text-[13px] text-ink-2 transition-colors hover:text-ink">
				<ArrowLeft size={14} strokeWidth={2} /> Back
			</a>
			<Logo size={28} textClass="text-[1.15rem]" />
			<ThemeToggle />
		</div>
	</header>

	<main class="mx-auto grid w-full max-w-[68rem] items-start gap-0 px-5 sm:px-8 lg:grid-cols-[1fr_26rem]">
		<section class="max-w-[32rem] py-14 lg:py-20 lg:pr-14">
			<h1 class="display text-[clamp(2.3rem,4.6vw,3.3rem)] text-ink">Welcome back.</h1>
			<p class="mt-5 text-[15px] leading-[1.7] text-ink-2">
				Sign in with the Telegram account that will hold your files. There is nothing to register and no
				password to choose — Telegram vouches for who you are, and we keep the session.
			</p>

			<div class="mt-9 space-y-4 border-t border-rule pt-7">
				<div class="flex gap-4">
					<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-[11px] font-semibold text-accent num">1</span>
					<p class="text-[13.5px] leading-[1.7] text-ink-2">
						Telegram sends us your name and id, signed with the bot token, so we know the payload is genuine.
					</p>
				</div>
				<div class="flex gap-4">
					<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-[11px] font-semibold text-accent num">2</span>
					<p class="text-[13.5px] leading-[1.7] text-ink-2">
						We create a session for this browser. Sign in on your phone as well and both stay active, listed
						under Settings.
					</p>
				</div>
				<div class="flex gap-4">
					<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-[11px] font-semibold text-accent num">3</span>
					<p class="text-[13.5px] leading-[1.7] text-ink-2">
						Your files go to a chat with your bot. Nothing is copied to a server of ours.
					</p>
				</div>
			</div>
		</section>

		<section class="w-full pb-16 lg:pt-20">
			<div class="card p-6">
				<h2 class="display text-[1.35rem] text-ink">Sign in</h2>
				<p class="mt-1 text-[12.5px] text-ink-3">Use the Telegram account that should own this drive.</p>

				{#if error}
					<p class="mt-5 rounded-[10px] border-l-2 border-danger bg-danger/8 px-3 py-2.5 text-[12.5px] leading-relaxed text-danger">
						{messages[error] || error}
					</p>
				{/if}

				<div class="mt-6">
					<TelegramLogin
						enabled={data.telegramLoginEnabled}
						botUsername={data.botUsername}
						authUrl={`${page.url.origin}/api/auth/telegram`}
					/>
				</div>

				{#if data.demoLogin}
					<div class="my-5 flex items-center gap-3">
						<span class="h-px flex-1 bg-rule"></span>
						<span class="text-[11.5px] text-ink-3">or</span>
						<span class="h-px flex-1 bg-rule"></span>
					</div>
					<button class="btn btn-ghost w-full py-2.5" onclick={demoLogin} disabled={busy}>
						{#if busy}
							<LoaderCircle size={14} class="animate-spin" /> Signing in…
						{:else}
							Try it with a demo account
						{/if}
					</button>
					<p class="mt-2.5 text-center text-[11.5px] leading-relaxed text-ink-3">
						Gets its own empty drive, stored on this server.
					</p>
				{/if}
			</div>

			<p class="mt-4 text-center text-[11.5px] leading-relaxed text-ink-3">
				By continuing you agree to the terms of service and privacy policy.
			</p>
		</section>
	</main>
</div>
