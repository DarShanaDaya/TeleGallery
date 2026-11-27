<script>
	import Topbar from '#lib/components/Topbar.svelte';
	import FileGrid from '#lib/components/FileGrid.svelte';
	import PreviewModal from '#lib/components/PreviewModal.svelte';
	import MoveModal from '#lib/components/MoveModal.svelte';
	import ShareModal from '#lib/components/ShareModal.svelte';
	import { api } from '#lib/drive.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { invalidateAll } from '$app/navigation';
	import { Trash2, LoaderCircle } from 'lucide-svelte';

	let { data } = $props();
	let view = $state('list');
	let busy = $state(false);
	const count = $derived(data.files.length);

	async function emptyTrash() {
		if (!confirm('Permanently delete everything in the trash? This removes the Telegram messages too.')) return;
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

<Topbar {data} title="Trash" subtitle="{count} item{count === 1 ? '' : 's'} held" showUpload={false} bind:view />
<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	{#if count}
		<div class="mb-4 flex items-center justify-between gap-3">
			<p class="text-[12px] leading-5 text-ink-3">
				Restored items return to their original folder. Deleting forever removes the Telegram messages.
			</p>
			<button class="btn btn-danger h-8 shrink-0 px-3 text-[12px]" onclick={emptyTrash} disabled={busy}>
				{#if busy}<LoaderCircle size={13} class="animate-[spin_1s_linear_infinite]" />{:else}<Trash2 size={13} />{/if}
				Empty
			</button>
		</div>
		<FileGrid files={data.files} {view} trashMode />
	{:else}
		<div class="border border-dashed border-rule-strong bg-paper-2/40 px-6 py-16 text-center">
			<Trash2 size={20} strokeWidth={1.3} class="mx-auto text-ink-3" />
			<p class="mt-4 font-display text-xl text-ink">Trash is empty</p>
			<p class="mx-auto mt-1.5 max-w-[24rem] text-[13px] leading-6 text-ink-2">
				Deleted files are kept here — along with their Telegram messages — until you remove them.
			</p>
		</div>
	{/if}
</div>
<PreviewModal />
<MoveModal />
<ShareModal />
