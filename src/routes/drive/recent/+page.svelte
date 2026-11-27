<script>
	import Topbar from '$lib/components/Topbar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';
	import PromptModal from '$lib/components/PromptModal.svelte';
	import PreviewModal from '$lib/components/PreviewModal.svelte';
	import MoveModal from '$lib/components/MoveModal.svelte';
	import { Clock } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('list');
</script>

<Topbar {data} title="Recent" showUpload={false} bind:view />
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if !data.files.length}
		<div class="card flex flex-col items-center py-20 text-center">
			<Clock size={30} class="mb-4 text-slate-500" />
			<p class="text-sm text-slate-400">Uploaded files will appear here.</p>
		</div>
	{:else}
		<FileGrid files={data.files} {view} />
	{/if}
</div>
<PromptModal />
<PreviewModal />
<MoveModal />
