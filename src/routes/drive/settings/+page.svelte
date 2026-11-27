<script>
	import Topbar from '$lib/components/Topbar.svelte';
	import { formatBytes } from '$lib/format.js';
	import { page } from '$app/state';
	import { ShieldCheck, Bot, HardDrive, LogOut, Send, CircleAlert, Copy } from 'lucide-svelte';
	import { toasts } from '$lib/toast.svelte.js';

	let { data } = $props();
	let copied = $state(false);
	const user = $derived(data.user);
	const usage = $derived(data.usage);
	const s = $derived(data.settings);

	const kindRows = $derived([
		{ label: 'Images', key: 'image', color: 'bg-emerald-400' },
		{ label: 'Video', key: 'video', color: 'bg-rose-400' },
		{ label: 'Audio', key: 'audio', color: 'bg-violet-400' },
		{ label: 'Documents', key: 'document', color: 'bg-sky-400' },
		{ label: 'Other', key: 'other', color: 'bg-slate-400' }
	]);
	const maxKind = $derived(Math.max(1, ...kindRows.map((r) => usage.marked?.[r.key] || 0)));

	async function copy(text) {
		await navigator.clipboard.writeText(text);
		copied = true;
		toasts.success('Copied');
		setTimeout(() => (copied = false), 1500);
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		location.href = '/';
	}
</script>

<Topbar {data} title="Settings" showUpload={false} />
<div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
	<div class="mx-auto max-w-3xl space-y-5">
		<!-- account -->
		<section class="card p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Account</h2>
			<div class="mt-4 flex items-center gap-4">
				{#if user.photoUrl}
					<img src={user.photoUrl} alt="" class="h-14 w-14 rounded-2xl object-cover" />
				{:else}
					<span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/20 text-lg font-bold text-brand-200">
						{(user.firstName?.[0] || 'T').toUpperCase()}
					</span>
				{/if}
				<div class="min-w-0">
					<p class="truncate text-base font-semibold text-white">
						{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user'}
					</p>
					<p class="text-xs text-slate-500">
						{user.username ? '@' + user.username : user.isDemo ? 'Demo account' : 'Telegram account'}
					</p>
				</div>
				<button class="btn-ghost ml-auto h-9 px-3 text-xs" onclick={logout}><LogOut size={14} /> Log out</button>
			</div>
		</section>

		<!-- storage -->
		<section class="card p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Storage</h2>
				<span class="chip"><HardDrive size={12} /> Unlimited</span>
			</div>
			<div class="mt-4 grid gap-3 sm:grid-cols-3">
				<div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
					<p class="text-xl font-bold text-white">{formatBytes(usage.bytes)}</p>
					<p class="text-[11px] text-slate-500">{usage.files} files</p>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
					<p class="text-xl font-bold text-white">{usage.folders}</p>
					<p class="text-[11px] text-slate-500">folders</p>
				</div>
				<div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
					<p class="text-xl font-bold text-white">{formatBytes(usage.trashBytes)}</p>
					<p class="text-[11px] text-slate-500">{usage.trashFiles} in trash</p>
				</div>
			</div>

			<div class="mt-5 space-y-2.5">
				{#each kindRows as row (row.key)}
					<div class="flex items-center gap-3 text-xs">
						<span class="w-20 text-slate-400">{row.label}</span>
						<div class="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
							<div class="h-full rounded-full {row.color}" style="width:{Math.round(((usage.marked?.[row.key] || 0) / maxKind) * 100)}%"></div>
						</div>
						<span class="w-16 text-right text-slate-500">{formatBytes(usage.marked?.[row.key] || 0)}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- telegram -->
		<section class="card p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Telegram connection</h2>
			<div class="mt-4 space-y-3 text-sm">
				<div class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
					<span class="flex items-center gap-2.5 text-slate-300"><Bot size={16} class="text-brand-400" /> Bot</span>
					<span class="flex items-center gap-2 text-xs text-slate-400">
						{s.botUsername ? '@' + s.botUsername : 'not configured'}
						{#if s.botUsername}
							<button class="text-slate-500 hover:text-white" onclick={() => copy('@' + s.botUsername)}><Copy size={12} /></button>
						{/if}
					</span>
				</div>
				<div class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
					<span class="flex items-center gap-2.5 text-slate-300"><ShieldCheck size={16} class="text-emerald-400" /> Storage target</span>
					<span class="text-xs text-slate-400">{s.storageChat ? s.storageChat : 'your own Telegram account'}</span>
				</div>
				<div class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
					<span class="flex items-center gap-2.5 text-slate-300"><HardDrive size={16} class="text-sky-400" /> Mode</span>
					<span class="text-xs text-slate-400">{s.telegramEnabled ? 'Telegram storage' : 'Local demo storage'}</span>
				</div>
			</div>

			{#if !s.telegramEnabled}
				<div class="mt-4 flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200/90">
					<CircleAlert size={16} class="mt-0.5 shrink-0" />
					<div>
						<p class="font-semibold">Telegram isn't connected yet.</p>
						<p class="mt-1">
							Add <code class="rounded bg-black/30 px-1">TELEGRAM_BOT_TOKEN</code>,
							<code class="rounded bg-black/30 px-1">TELEGRAM_BOT_USERNAME</code> and
							<code class="rounded bg-black/30 px-1">TELEGRAM_STORAGE_CHAT_ID</code> to your
							<code class="rounded bg-black/30 px-1">.env</code> file, then restart the server. Files uploaded
							now are stored locally.
						</p>
					</div>
				</div>
			{:else if s.botUsername}
				<a
					class="btn-ghost mt-4 w-full"
					href="https://t.me/{s.botUsername}"
					target="_blank"
					rel="noreferrer"
				>
					<Send size={15} /> Open the bot in Telegram
				</a>
			{/if}
		</section>

		<!-- about -->
		<section class="card p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">About</h2>
			<p class="mt-3 text-xs leading-relaxed text-slate-500">
				{s.siteName} stores your files as documents inside your own Telegram chat. Uploads are split into chunks,
				and downloads are streamed back on demand. Nothing is shared with third parties.
			</p>
			<p class="mt-3 text-[11px] text-slate-600">Session expires in 30 days · Built with SvelteKit &amp; Node.js</p>
		</section>
	</div>
</div>
