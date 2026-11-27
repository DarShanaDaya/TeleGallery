<script>
	import Topbar from '$lib/components/Topbar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';
	import PreviewModal from '$lib/components/PreviewModal.svelte';
	import MoveModal from '$lib/components/MoveModal.svelte';
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('list');
</script>

<Topbar {data} title={data.q ? `Search: ${data.q}` : 'Search'} showUpload={false} bind:view />
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if !data.q}
		<div class="card flex flex-col items-center py-20 text-center">
			<Search size={30} class="mb-4 text-slate-500" />
			<p class="text-sm text-slate-400">Type in the search box above to find files and folders.</p>
		</div>
	{:else if !data.files.length}
		<div class="card flex flex-col items-center py-20 text-center">
			<Search size={30} class="mb-4 text-slate-500" />
			<p class="text-sm text-slate-400">No results for “{data.q}”.</p>
		</div>
	{:else}
		<p class="mb-4 text-xs text-slate-500">{data.files.length} result{data.files.length === 1 ? '' : 's'}</p>
		<FileGrid files={data.files} {view} onOpen={(f) => goto(`/drive?folder=${f.id}`)} />
	{/if}
</div>
<PreviewModal />
<MoveModal />
