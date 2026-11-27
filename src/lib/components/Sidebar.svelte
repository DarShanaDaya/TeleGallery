<script>
	import Logo from './Logo.svelte';
	import { page } from '$app/state';
	import { uploader } from '$lib/uploader.svelte.js';
	import { formatBytes } from '$lib/format.js';
	import {
		HardDrive,
		Star,
		Clock,
		Trash2,
		Plus,
		Upload,
		LogOut,
		ShieldCheck,
		ChevronRight
	} from 'lucide-svelte';

	let { data, user, onNewFolder } = $props();

	const nav = [
		{ href: '/drive', label: 'My Drive', icon: HardDrive },
		{ href: '/drive/starred', label: 'Starred', icon: Star },
		{ href: '/drive/recent', label: 'Recent', icon: Clock },
		{ href: '/drive/trash', label: 'Trash', icon: Trash2 }
	];

	const isActive = (href) =>
		href === '/drive' ? page.url.pathname === '/drive' : page.url.pathname.startsWith(href);

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		location.href = '/';
	}

	const name = $derived(
		[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user'
	);
	const initials = $derived(
		(() => {
			const parts = name.trim().split(/\s+/);
			return ((parts[0]?.[0] || 'T') + (parts[1]?.[0] || '')).toUpperCase();
		})()
	);
</script>

<aside class="hidden w-[264px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080e18]/70 p-4 lg:flex">
	<div class="px-2 py-1.5">
		<a href="/drive"><Logo size={34} textClass="text-lg" /></a>
	</div>

	<div class="mt-5 space-y-2">
		<button class="btn-primary w-full" onclick={() => onNewFolder?.()}>
			<Plus size={17} /> New folder
		</button>
	</div>

	<nav class="mt-5 space-y-1">
		{#each nav as item}
			<a
				href={item.href}
				class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition {isActive(
					item.href
				)
					? 'bg-brand-500/15 text-white'
					: 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}"
			>
				<span class="flex items-center gap-3">
					<item.icon size={17} class={isActive(item.href) ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
					{item.label}
				</span>
				<ChevronRight size={14} class="opacity-0 transition group-hover:opacity-40" />
			</a>
		{/each}
	</nav>

	<div class="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 to-transparent p-4">
		<div class="flex items-center justify-between text-xs font-medium text-slate-400">
			<span>Storage</span>
			<span class="text-slate-300">Unlimited</span>
		</div>
		<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
			<div class="h-full w-[12%] rounded-full bg-gradient-to-r from-brand-400 to-cyan-300"></div>
		</div>
		<p class="mt-3 text-[11px] leading-relaxed text-slate-500">
			{formatBytes(data.usage.bytes)} in {data.usage.files} files · backed by Telegram
		</p>
	</div>

	<div class="mt-auto space-y-3 pt-6">
		<a
			href="/drive/settings"
			class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-400 transition hover:text-white"
		>
			<ShieldCheck size={15} class="text-emerald-400" />
			{data.telegramConnected ? 'Telegram connected' : 'Demo storage mode'}
		</a>

		<div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
			{#if user.photoUrl}
				<img src={user.photoUrl} alt="" class="h-9 w-9 rounded-full object-cover" />
			{:else}
				<span class="grid h-9 w-9 place-items-center rounded-full bg-brand-500/25 text-xs font-bold text-brand-200">
					{initials}
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs font-semibold text-white">{name}</p>
				<p class="truncate text-[11px] text-slate-500">{user.username ? '@' + user.username : 'Telegram'}</p>
			</div>
			<button class="icon-btn h-8 w-8" title="Log out" onclick={logout}>
				<LogOut size={14} />
			</button>
		</div>
	</div>
</aside>
