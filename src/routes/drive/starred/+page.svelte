<script>
	import Topbar from '$lib/components/Topbar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';
	import PromptModal from '$lib/components/PromptModal.svelte';
	import PreviewModal from '$lib/components/PreviewModal.svelte';
	import MoveModal from '$lib/components/MoveModal.svelte';
	import { drive } from '$lib/drive.svelte.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Star } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('grid');
</script>

<Topbar {data} title="Starred" showUpload={false} bind:view />
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if !data.files.length}
		<div class="card flex flex-col items-center py-20 text-center">
			<Star size={30} class="mb-4 text-amber-300/70" />
			<p class="text-sm text-slate-400">Star files from the drive to find them quickly here.</p>
		</div>
	{:else}
		<FileGrid files={data.files} {view} onOpen={(f) => goto(`/drive?folder=${f.id}`)} />
	{/if}
</div>
<PromptModal />
<PreviewModal />
<MoveModal />
