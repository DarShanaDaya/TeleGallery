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

<header class="flex shrink-0 flex-wrap items-center gap-3 border-b border-rule bg-paper/80 px-4 py-2.5 backdrop-blur-sm sm:px-6">
	<a href="/drive" class="lg:hidden"><Logo size={26} withText={false} /></a>

	<div class="order-2 min-w-0 sm:order-none">
		<h1 class="truncate font-display text-xl leading-tight text-ink">{title}</h1>
		{#if subtitle}
			<p class="label mt-0.5">{subtitle}</p>
		{/if}
	</div>

	<div class="order-last flex w-full items-center gap-2 sm:order-none sm:ml-auto sm:w-auto">
		<div class="relative flex-1 sm:w-60 sm:flex-none">
			<Search size={13} class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
			<input
				class="input h-8 pl-8 pr-7 text-[12.5px]"
				placeholder="Search files…"
				bind:value={query}
				oninput={onInput}
			/>
			{#if query}
				<button
					class="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-3 transition-colors hover:text-ink"
					onclick={() => ((query = ''), onInput({ target: { value: '' } }))}
				>
					<X size={12} />
				</button>
			{/if}
		</div>
	</div>

	<div class="order-3 ml-auto flex items-center gap-1.5 sm:order-none sm:ml-0">
		<div class="hidden items-center border border-rule p-0.5 sm:flex">
			<button
				class="grid h-6 w-6 place-items-center transition-colors {view === 'list'
					? 'bg-paper-3 text-ink'
					: 'text-ink-3 hover:text-ink'}"
				onclick={() => (view = 'list')}
				title="List view"
			>
				<Rows3 size={12} strokeWidth={1.9} />
			</button>
			<button
				class="grid h-6 w-6 place-items-center transition-colors {view === 'grid'
					? 'bg-paper-3 text-ink'
					: 'text-ink-3 hover:text-ink'}"
				onclick={() => (view = 'grid')}
				title="Grid view"
			>
				<LayoutGrid size={12} strokeWidth={1.9} />
			</button>
		</div>

		<div class="lg:hidden"><ThemeToggle compact /></div>

		{#if onNewFolder}
			<button class="icon-btn" onclick={onNewFolder} title="New folder">
				<Plus size={14} strokeWidth={1.8} />
			</button>
		{/if}

		{#if showUpload}
			<button class="btn btn-primary h-8 px-3 text-[12.5px]" onclick={onUpload}>
				<Upload size={13} strokeWidth={1.9} />
				Upload
			</button>
		{/if}
	</div>
</header>
