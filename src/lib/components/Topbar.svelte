<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { Search, Upload, Plus, X, Rows3, LayoutGrid } from 'lucide-svelte';

	let {
		title = 'My Drive',
		subtitle = '',
		showUpload = true,
		view = $bindable('list'),
		onUpload,
		onNewFolder,
		data
	} = $props();

	let query = $state(page.url.searchParams.get('q') || '');
	let timer;

	function onInput(e) {
		query = e.target.value;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (query.trim())
				goto(`/drive/search?q=${encodeURIComponent(query.trim())}`, {
					replaceState: true,
					keepFocus: true,
					noScroll: true
				});
			else if (page.url.pathname === '/drive/search') goto('/drive', { replaceState: true, noScroll: true });
		}, 260);
	}
</script>

<header class="flex h-16 shrink-0 items-center gap-3 border-b border-rule bg-paper/85 px-4 backdrop-blur-md sm:px-6">
	<a href="/drive" class="lg:hidden"><Logo size={25} withText={false} /></a>

	<div class="min-w-0 flex-1">
		<h1 class="display truncate text-[1.15rem] leading-tight text-ink">{title}</h1>
		{#if subtitle}
			<p class="mt-0.5 truncate text-[11.5px] text-ink-3">{subtitle}</p>
		{/if}
	</div>

	<div class="relative hidden w-56 shrink-0 sm:block">
		<Search size={13} class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
		<input
			class="input h-8 pl-8 pr-7 text-[12.5px]"
			placeholder="Search files"
			bind:value={query}
			oninput={onInput}
		/>
		{#if query}
			<button
				class="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-3 transition-colors hover:text-ink"
				onclick={() => ((query = ''), onInput({ target: { value: '' } }))}
				aria-label="Clear search"
			>
				<X size={12} />
			</button>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-1.5">
		<div class="hidden items-center gap-0.5 rounded-[9px] bg-paper-3 p-0.5 sm:flex">
			<button
				class="grid h-6 w-6 place-items-center rounded-[7px] transition-colors {view === 'list' ? 'bg-paper-2 text-ink shadow-sm'
					: 'text-ink-3 hover:text-ink'}"
				onclick={() => (view = 'list')}
				title="List view"
			>
				<Rows3 size={12} strokeWidth={2.1} />
			</button>
			<button
				class="grid h-6 w-6 place-items-center rounded-[7px] transition-colors {view === 'grid' ? 'bg-paper-2 text-ink shadow-sm'
					: 'text-ink-3 hover:text-ink'}"
				onclick={() => (view = 'grid')}
				title="Grid view"
			>
				<LayoutGrid size={12} strokeWidth={2.1} />
			</button>
		</div>

		<div class="lg:hidden"><ThemeToggle compact /></div>

		{#if onNewFolder}
			<button class="icon-btn" onclick={onNewFolder} title="New folder" aria-label="New folder">
				<Plus size={15} strokeWidth={2.1} />
			</button>
		{/if}

		{#if showUpload}
			<button class="btn btn-primary h-8 px-3 text-[12.5px]" onclick={onUpload}>
				<Upload size={13} strokeWidth={2.1} />
				Upload
			</button>
		{/if}
	</div>
</header>
