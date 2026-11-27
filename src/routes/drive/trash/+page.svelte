<script>
	import Topbar from '$lib/components/Topbar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';
	import PreviewModal from '$lib/components/PreviewModal.svelte';
	import MoveModal from '$lib/components/MoveModal.svelte';
	import { api } from '$lib/drive.svelte.js';
	import { toasts } from '$lib/toast.svelte.js';
	import { invalidateAll } from '$app/navigation';
	import { Trash2, LoaderCircle } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('list');
	let busy = $state(false);

	async function emptyTrash() {
		if (!confirm('Permanently delete everything in the trash? This cannot be undone.')) return;
		busy = true;
		try {
			await api('/api/trash', { method: 'DELETE' });
			toasts.success('Trash emptied');
			await invalidateAll();
		} catch (err) {
			toasts.error(err.message);
		} finally {
			busy = false;
		}
	}
</script>

<Topbar {data} title="Trash" showUpload={false} bind:view />
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if data.files.length}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-xs text-slate-500">{data.files.length} item{data.files.length === 1 ? '' : 's'} in trash</p>
			<button class="btn-danger h-9 px-3 text-xs" onclick={emptyTrash} disabled={busy}>
				{#if busy}<LoaderCircle size={14} class="animate-spin" />{:else}<Trash2 size={14} />{/if}
				Empty trash
			</button>
		</div>
	{:else}
		<div class="card flex flex-col items-center py-20 text-center">
			<Trash2 size={30} class="mb-4 text-slate-500" />
			<p class="text-sm text-slate-400">Trash is empty. Deleted files stay here until you remove them.</p>
		</div>
	{/if}

	{#if data.files.length}
		<FileGrid files={data.files} {view} trashMode />
	{/if}
</div>
<PreviewModal />
<MoveModal />
