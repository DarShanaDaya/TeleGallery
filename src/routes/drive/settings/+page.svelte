<script>
	import Topbar from '#lib/components/Topbar.svelte';
	import { formatBytes } from '#lib/format.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { LogOut, Copy, Send, ArrowUpRight } from 'lucide-svelte';

	let { data } = $props();
	let copied = $state('');

	const user = $derived(data.user);
	const usage = $derived(data.usage);
	const s = $derived(data.settings);

	const kindRows = $derived([
		{ label: 'Images', key: 'image' },
		{ label: 'Video', key: 'video' },
		{ label: 'Audio', key: 'audio' },
		{ label: 'Documents', key: 'document' },
		{ label: 'Other', key: 'other' }
	]);
	const maxKind = $derived(Math.max(1, ...kindRows.map((r) => usage.marked?.[r.key] || 0)));
	const name = $derived(
		[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user'
	);

	async function copy(text, key) {
		await navigator.clipboard.writeText(text);
		copied = key;
		toasts.success('Copied');
		setTimeout(() => (copied = ''), 1500);
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		location.href = '/';
	}
</script>

<Topbar {data} title="Settings" subtitle="Account, storage, connection" showUpload={false} />

<div class="flex-1 overflow-y-auto">
	<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
		<!-- account -->
		<section class="border-t border-rule pt-4">
			<div class="flex items-center justify-between">
				<span class="label">01 — Account</span>
				<button class="btn btn-quiet text-[11px]" onclick={logout}><LogOut size={12} /> Log out</button>
			</div>
			<div class="mt-4 flex items-center gap-4">
				{#if user.photoUrl}
					<img src={user.photoUrl} alt="" class="h-12 w-12 border border-rule object-cover grayscale" />
				{:else}
					<span class="grid h-12 w-12 place-items-center border border-rule-strong bg-paper-2 font-mono text-sm text-ink-2">
						{(user.firstName?.[0] || 'T').toUpperCase()}
					</span>
				{/if}
				<div class="min-w-0">
					<p class="truncate font-display text-2xl leading-tight text-ink">{name}</p>
					<p class="label mt-1">
						{user.username ? '@' + user.username : user.isDemo ? 'demo account' : 'telegram account'}
					</p>
				</div>
			</div>
		</section>

		<!-- storage -->
		<section class="mt-10 border-t border-rule pt-4">
			<div class="flex items-center justify-between">
				<span class="label">02 — Storage</span>
				<span class="tag">unlimited</span>
			</div>

			<dl class="mt-4 grid gap-px border border-rule bg-rule sm:grid-cols-3">
				{#each [{ k: 'Used', v: formatBytes(usage.bytes) }, { k: 'Files', v: usage.files }, { k: 'In trash', v: formatBytes(usage.trashBytes) }] as tile}
					<div class="bg-paper-2 px-4 py-3.5">
						<dt class="label">{tile.k}</dt>
						<dd class="mt-1 font-display text-2xl leading-none text-ink">{tile.v}</dd>
					</div>
				{/each}
			</dl>

			<div class="mt-5">
				<span class="label">By type</span>
				<div class="mt-2 border-t border-rule">
					{#each kindRows as row (row.key)}
						<div class="flex items-center gap-3 border-b border-rule py-2">
							<span class="w-20 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">{row.label}</span>
							<div class="h-1.5 flex-1 bg-paper-3">
								<div
									class="h-full bg-ink-2"
									style="width:{Math.round(((usage.marked?.[row.key] || 0) / maxKind) * 100)}%"
								></div>
							</div>
							<span class="w-16 text-right font-mono text-[10px] text-ink-3">
								{formatBytes(usage.marked?.[row.key] || 0)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- telegram -->
		<section class="mt-10 border-t border-rule pt-4">
			<span class="label">03 — Telegram connection</span>
			<dl class="mt-3 border-t border-rule">
				{#each [{ k: 'Bot', v: s.botUsername ? '@' + s.botUsername : 'not configured', copyable: s.botUsername }, { k: 'Storage chat', v: s.storageChat || 'your own account with the bot' }, { k: 'Mode', v: s.telegramEnabled ? 'telegram storage' : 'local demo storage' }] as row}
					<div class="flex items-center justify-between gap-4 border-b border-rule py-2.5">
						<dt class="label">{row.k}</dt>
						<dd class="flex items-center gap-2 font-mono text-[11px] text-ink-2">
							{row.v}
							{#if row.copyable}
								<button class="text-ink-3 transition-colors hover:text-ink" onclick={() => copy(row.v, row.k)}>
									<Copy size={11} />
								</button>
							{/if}
						</dd>
					</div>
				{/each}
			</dl>

			{#if !s.telegramEnabled}
				<div class="mt-4 border-l-2 border-warn bg-paper-2 px-4 py-3">
					<p class="label text-warn">Not connected</p>
					<p class="mt-1.5 text-[12.5px] leading-6 text-ink-2">
						Add <code class="border border-rule bg-paper-3 px-1 font-mono text-[11px]">TELEGRAM_BOT_TOKEN</code>,
						<code class="border border-rule bg-paper-3 px-1 font-mono text-[11px]">TELEGRAM_BOT_USERNAME</code> and
						<code class="border border-rule bg-paper-3 px-1 font-mono text-[11px]">TELEGRAM_STORAGE_CHAT_ID</code>
						to <code class="border border-rule bg-paper-3 px-1 font-mono text-[11px]">.env</code> and restart.
						Uploads are currently kept on local disk.
					</p>
				</div>
			{:else if s.botUsername}
				<a class="btn btn-ghost mt-4" href="https://t.me/{s.botUsername}" target="_blank" rel="noreferrer">
					<Send size={13} /> Open the bot in Telegram
					<ArrowUpRight size={13} />
				</a>
			{/if}
		</section>

		<!-- about -->
		<section class="mt-10 border-t border-rule pt-4">
			<span class="label">04 — About</span>
			<p class="mt-3 max-w-[38rem] text-[12.5px] leading-6 text-ink-2">
				{s.siteName} writes each file to your Telegram chat as one or more documents and keeps only an index —
				chat id, message id, file id — in SQLite. Downloads are reassembled on demand and cached once.
			</p>
			<p class="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
				Node · SvelteKit · SQLite · 30-day sessions
			</p>
		</section>
	</div>
</div>
