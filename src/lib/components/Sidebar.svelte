<script>
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { formatBytes } from '#lib/format.js';
	import { HardDrive, Star, Clock, Trash2, Settings, LogOut, Plus } from 'lucide-svelte';

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

<aside
	class="hidden w-[248px] shrink-0 flex-col border-r border-rule bg-paper-2/40 lg:flex"
>
	<div class="flex h-14 items-center justify-between border-b border-rule px-4">
		<a href="/drive"><Logo size={28} textClass="text-lg" /></a>
		<ThemeToggle compact />
	</div>

	<div class="px-4 pt-4">
		<button class="btn btn-ghost w-full justify-start gap-2 py-2" onclick={() => onNewFolder?.()}>
			<Plus size={14} strokeWidth={1.8} /> New folder
		</button>
	</div>

	<nav class="mt-5 px-2">
		<p class="label px-2 pb-2">Library</p>
		<div class="border-t border-rule">
			{#each nav as item}
				<a
					href={item.href}
					class="group flex items-center gap-2.5 border-b border-rule px-2 py-2.5 text-[13px] transition-colors {isActive(
						item.href
					)
						? 'bg-paper-3 text-ink'
						: 'text-ink-2 hover:bg-paper-3/60 hover:text-ink'}"
				>
					<item.icon
						size={15}
						strokeWidth={1.6}
						class={isActive(item.href) ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2'}
					/>
					<span class="flex-1">{item.label}</span>
					{#if isActive(item.href)}
						<span class="h-3 w-px bg-accent"></span>
					{/if}
				</a>
			{/each}
		</div>
	</nav>

	<!-- usage ledger -->
	<div class="mt-6 px-4">
		<p class="label pb-2">Usage</p>
		<div class="border border-rule bg-paper-2 p-3">
			<div class="flex items-baseline justify-between">
				<span class="font-display text-2xl leading-none text-ink">{formatBytes(data.usage.bytes)}</span>
				<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">unlimited</span>
			</div>
			<div class="mt-2.5 h-1 w-full bg-paper-3">
				<div class="h-full bg-accent" style="width:12%"></div>
			</div>
			<p class="mt-2 font-mono text-[10px] leading-4 text-ink-3">
				{data.usage.files} files · {data.usage.folders} folders
			</p>
		</div>
	</div>

	<div class="mt-auto">
		<a
			href="/drive/settings"
			class="flex items-center gap-2.5 border-t border-rule px-4 py-2.5 text-[12px] text-ink-2 transition-colors hover:bg-paper-3/60 hover:text-ink"
		>
			<Settings size={14} strokeWidth={1.6} class="text-ink-3" />
			Settings
			<span class="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
				<span class="h-1.5 w-1.5 rounded-full {data.telegramConnected ? 'bg-success' : 'bg-warn'}"></span>
				{data.telegramConnected ? 'live' : 'demo'}
			</span>
		</a>

		<div class="flex items-center gap-2.5 border-t border-rule px-4 py-3">
			{#if user.photoUrl}
				<img src={user.photoUrl} alt="" class="h-7 w-7 rounded-full object-cover grayscale" />
			{:else}
				<span class="grid h-7 w-7 place-items-center rounded-full border border-rule-strong font-mono text-[10px] text-ink-2">
					{initials}
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="truncate text-[12px] font-medium text-ink">{name}</p>
				<p class="truncate font-mono text-[10px] text-ink-3">
					{user.username ? '@' + user.username : 'telegram'}
				</p>
			</div>
			<button class="icon-btn h-7 w-7" title="Log out" onclick={logout}><LogOut size={13} /></button>
		</div>
	</div>
</aside>
