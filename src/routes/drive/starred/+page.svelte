<script>
	import Topbar from '#lib/components/Topbar.svelte';
	import FileGrid from '#lib/components/FileGrid.svelte';
	import PreviewModal from '#lib/components/PreviewModal.svelte';
	import MoveModal from '#lib/components/MoveModal.svelte';
	import ShareModal from '#lib/components/ShareModal.svelte';
	import PromptModal from '#lib/components/PromptModal.svelte';
	import { goto } from '$app/navigation';
	import { Star } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('list');
	const count = $derived(data.files.length);
</script>

<Topbar
	{data}
	title="Starred"
	subtitle="{count} item{count === 1 ? '' : 's'}"
	showUpload={false}
	bind:view
/>
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if !count}
		<div class="border border-dashed border-rule-strong bg-paper-2/40 px-6 py-16 text-center">
			<Star size={20} strokeWidth={1.3} class="mx-auto text-ink-3" />
			<p class="mt-4 font-display text-xl text-ink">Nothing starred yet</p>
			<p class="mx-auto mt-1.5 max-w-[24rem] text-[13px] leading-6 text-ink-2">
				Star a file from its action menu and it will be pinned here.
			</p>
		</div>
	{:else}
		<FileGrid files={data.files} {view} onOpen={(f) => goto(`/drive?folder=${f.id}`)} />
	{/if}
</div>
<PromptModal />
<PreviewModal />
<MoveModal />
<ShareModal />
