<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { uploader } from '$lib/uploader.svelte.js';
	import Logo from './Logo.svelte';
	import { Search, Upload, Plus, LayoutGrid, List, X, Menu } from 'lucide-svelte';

	let {
		title = 'My Drive',
		showUpload = true,
		view = $bindable('grid'),
		onUpload,
		onNewFolder,
		onSearch,
		data
	} = $props();

	let query = $state(page.url.searchParams.get('q') || '');
	let searchOpen = $state(false);
	let timer;

	function onInput(e) {
		query = e.target.value;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (query.trim()) goto(`/drive/search?q=${encodeURIComponent(query.trim())}`, { replaceState: true, keepFocus: true, noScroll: true });
			else if (page.url.pathname === '/drive/search') goto('/drive', { replaceState: true, noScroll: true });
		}, 260);
	}
</script>

<header class="flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-[#070d18]/60 px-4 py-3 backdrop-blur-xl sm:px-6">
	<a href="/drive" class="lg:hidden"><Logo size={32} withText={false} /></a>

	<h1 class="order-2 shrink-0 text-base font-semibold text-white sm:order-none sm:text-lg">{title}</h1>

	<div class="order-last flex w-full items-center gap-2 sm:order-none sm:ml-auto sm:w-auto">
		<div class="relative flex-1 sm:w-64 sm:flex-none">
			<Search size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
			<input
				class="input h-9 pl-9 pr-8 text-[13px]"
				placeholder="Search files…"
				bind:value={query}
				oninput={onInput}
			/>
			{#if query}
				<button class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onclick={() => ((query = ''), onInput({ target: { value: '' } }))}>
					<X size={14} />
				</button>
			{/if}
		</div>
	</div>

	<div class="order-3 ml-auto flex items-center gap-2 sm:order-none sm:ml-0">
		<div class="hidden items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 sm:flex">
			<button
				class="grid h-7 w-7 place-items-center rounded-md transition {view === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200'}"
				onclick={() => (view = 'grid')}
				title="Grid view"
			>
				<LayoutGrid size={14} />
			</button>
			<button
				class="grid h-7 w-7 place-items-center rounded-md transition {view === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200'}"
				onclick={() => (view = 'list')}
				title="List view"
			>
				<List size={14} />
			</button>
		</div>

		{#if onNewFolder}
			<button class="btn-ghost h-9 px-3" onclick={onNewFolder} title="New folder">
				<Plus size={15} />
			</button>
		{/if}

		{#if showUpload}
			<button class="btn-primary h-9 px-3.5" onclick={onUpload} title="Upload files">
				<Upload size={15} />
				<span class="hidden xs:inline sm:inline">Upload</span>
			</button>
		{/if}
	</div>
</header>
