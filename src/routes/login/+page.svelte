<script>
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import TelegramLogin from '$lib/components/TelegramLogin.svelte';
	import { ArrowLeft, LoaderCircle, ShieldCheck, Infinity as InfinityIcon, Lock } from 'lucide-svelte';

	let { data } = $props();
	let busy = $state(false);
	let error = $state(null);
	$effect(() => {
		if (data.error) error = data.error;
	});

	const messages = {
		invalid_signature: 'Telegram rejected the signature. Please try logging in again.',
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

<div class="grid min-h-screen lg:grid-cols-2">
	<!-- Left: brand panel -->
	<section class="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12">
		<div class="pointer-events-none absolute inset-0 -z-10">
			<div class="absolute left-[-10rem] top-10 h-96 w-96 rounded-full bg-brand-600/20 blur-[110px]"></div>
			<div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]"></div>
		</div>
		<Logo />
		<div class="max-w-md">
			<h1 class="text-4xl font-extrabold leading-tight tracking-tight text-white">
				Your private cloud,<br />
				<span class="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">already in your pocket.</span>
			</h1>
			<p class="mt-5 text-slate-400">
				TeleDrive keeps your files inside your own Telegram account. Unlimited space, zero setup, no card.
			</p>
			<ul class="mt-8 space-y-3 text-sm text-slate-300">
				<li class="flex items-center gap-3"><InfinityIcon size={17} class="text-brand-400" /> Unlimited storage</li>
				<li class="flex items-center gap-3"><ShieldCheck size={17} class="text-emerald-400" /> Private to your account</li>
				<li class="flex items-center gap-3"><Lock size={17} class="text-amber-400" /> No password needed</li>
			</ul>
		</div>
		<p class="text-xs text-slate-600">© {new Date().getFullYear()} {data.siteName}</p>
	</section>

	<!-- Right: login -->
	<section class="relative flex items-center justify-center px-6 py-14">
		<a href="/" class="absolute left-6 top-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
			<ArrowLeft size={16} /> Back
		</a>
		<div class="fade-up w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1220]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
			<div class="mb-8 text-center lg:hidden">
				<div class="mx-auto flex justify-center"><Logo size={44} /></div>
			</div>
			<h2 class="text-center text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
			<p class="mt-2 text-center text-sm text-slate-400">Log in to your private cloud</p>

			{#if error}
				<div class="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
					{messages[error] || error}
				</div>
			{/if}

			<div class="mt-7">
				<TelegramLogin
					enabled={data.telegramLoginEnabled}
					botUsername={data.botUsername}
					authUrl={`${page.url.origin}/api/auth/telegram`}
				/>
			</div>

			{#if data.demoLogin}
				<div class="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-600">
					<span class="h-px flex-1 bg-white/10"></span> or <span class="h-px flex-1 bg-white/10"></span>
				</div>
				<button class="btn-ghost w-full py-3" onclick={demoLogin} disabled={busy}>
					{#if busy}
						<LoaderCircle size={16} class="animate-spin" /> Signing in…
					{:else}
						Try the demo account
					{/if}
				</button>
				<p class="mt-3 text-center text-xs text-slate-500">
					Explore the full drive without a bot token. Files are stored locally.
				</p>
			{/if}

			<p class="mt-8 text-center text-xs leading-relaxed text-slate-500">
				By logging in, you agree to our
				<a href="/" class="text-brand-400 hover:underline">Terms of Service</a> &amp;
				<a href="/" class="text-brand-400 hover:underline">Privacy Policy</a>.
			</p>
		</div>
	</section>
</div>
