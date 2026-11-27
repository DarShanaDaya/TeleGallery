<script>
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { formatBytes } from '#lib/format.js';
	import { HardDrive, Star, Clock, Trash2, Settings, LogOut, Plus, Activity } from 'lucide-svelte';

	let { data, user, onNewFolder } = $props();

	const nav = [
		{ href: '/drive', label: 'My Drive', icon: HardDrive },
		{ href: '/drive/starred', label: 'Starred', icon: Star },
		{ href: '/drive/recent', label: 'Recent', icon: Clock },
		{ href: '/drive/trash', label: 'Trash', icon: Trash2 },
		{ href: '/drive/activity', label: 'Activity', icon: Activity }
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

<aside class="hidden w-[240px] shrink-0 flex-col border-r border-rule bg-paper-2/60 lg:flex">
	<div class="flex h-16 items-center justify-between px-4">
		<a href="/drive"><Logo size={27} textClass="text-[1.12rem]" /></a>
		<ThemeToggle compact />
	</div>

	<div class="px-3">
		<button class="btn btn-primary w-full py-2" onclick={() => onNewFolder?.()}>
			<Plus size={14} strokeWidth={2.2} /> New folder
		</button>
	</div>

	<nav class="mt-6 flex-1 px-3">
		<p class="px-2 pb-2 text-[11.5px] font-medium text-ink-3">Library</p>
		<div class="space-y-0.5">
			{#each nav as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 rounded-[9px] px-2 py-2 text-[13px] font-medium transition-colors {isActive( item.href
					)
						? 'bg-accent/12 text-accent'
						: 'text-ink-2 hover:bg-paper-3 hover:text-ink'}"
				>
					<item.icon size={15} strokeWidth={1.9} />
					{item.label}
				</a>
			{/each}
		</div>

		<div class="mt-7 rounded-[10px] bg-paper-3 px-3 py-3">
			<div class="flex items-baseline justify-between">
				<span class="display text-[1.25rem] leading-none text-ink num">{formatBytes(data.usage.bytes)}</span>
				<span class="text-[11px] text-ink-3">used</span>
			</div>
			<p class="mt-2 text-[11.5px] leading-relaxed text-ink-3">
				{data.usage.files} files and {data.usage.folders} folders. There is no ceiling to show a bar against.
			</p>
		</div>
	</nav>

	<div class="mt-auto">
		<a
			href="/drive/settings"
			class="flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
		>
			<Settings size={14} strokeWidth={1.9} />
			Settings
			<span class="ml-auto flex items-center gap-1.5 text-[11px] text-ink-3">
				<span class="h-1.5 w-1.5 rounded-full {data.telegramConnected ? 'bg-success' : 'bg-warn'}"></span>
				{data.telegramConnected ? 'Telegram' : 'Demo'}
			</span>
		</a>

		<div class="flex items-center gap-2.5 border-t border-rule px-4 py-3">
			{#if user.photoUrl}
				<img src={user.photoUrl} alt="" class="h-7 w-7 rounded-full object-cover" />
			{:else}
				<span class="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
					{initials}
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="truncate text-[12.5px] font-medium text-ink">{name}</p>
				<p class="truncate text-[11px] text-ink-3">{user.username ? '@' + user.username : 'Telegram'}</p>
			</div>
			<button class="icon-btn h-7 w-7" title="Log out" onclick={logout}><LogOut size={13} /></button>
		</div>
	</div>
</aside>
