<script>
	import { drive, api } from '$lib/drive.svelte.js';
	import { toasts } from '$lib/toast.svelte.js';
	import {
		Download,
		PencilLine,
		Star,
		StarOff,
		FolderInput,
		Trash2,
		RotateCcw,
		Trash,
		Eye
	} from 'lucide-svelte';

	let { file, onClose, anchor = 'right' } = $props();

	const isTrash = $derived(Boolean(file.deletedAt));

	async function act(fn) {
		onClose?.();
		try {
			await fn();
		} catch (err) {
			toasts.error(err.message);
		}
	}

	const trash = () =>
		act(async () => {
			await api(`/api/files/${file.id}`, { method: 'DELETE' });
			toasts.success('Moved to trash');
			drive.refresh();
		});

	const restore = () =>
		act(async () => {
			await api(`/api/files/${file.id}`, { method: 'POST' });
			toasts.success('Restored');
			drive.refresh();
		});

	const destroy = () =>
		act(async () => {
			await api(`/api/files/${file.id}?permanent=1`, { method: 'DELETE' });
			toasts.success('Deleted forever');
			drive.refresh();
		});

	const star = () =>
		act(async () => {
			await api(`/api/files/${file.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'star' }) });
			drive.refresh();
		});
</script>

<div
	class="absolute {anchor === 'right' ? 'right-0' : 'left-0'} top-full z-40 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0e1626] p-1.5 shadow-2xl shadow-black/60"
	role="menu"
>
	{#if !isTrash}
		{#if file.kind === 'file'}
			<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openPreview(file))}>
				<Eye size={15} /> Preview
			</button>
			<a class="menu-item" role="menuitem" href={`/api/files/${file.id}/download`}>
				<Download size={15} /> Download
			</a>
		{/if}
		<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.rename(file))}>
			<PencilLine size={15} /> Rename
		</button>
		<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openMove(file))}>
			<FolderInput size={15} /> Move to
		</button>
		<button class="menu-item" role="menuitem" onclick={star}>
			{#if file.starred}<StarOff size={15} /> Remove star{:else}<Star size={15} /> Add star{/if}
		</button>
		<div class="my-1 h-px bg-white/5"></div>
		<button class="menu-item menu-danger" role="menuitem" onclick={trash}>
			<Trash2 size={15} /> Move to trash
		</button>
	{:else}
		<button class="menu-item" role="menuitem" onclick={restore}>
			<RotateCcw size={15} /> Restore
		</button>
		<button class="menu-item menu-danger" role="menuitem" onclick={destroy}>
			<Trash size={15} /> Delete forever
		</button>
	{/if}
</div>

<style>
	.menu-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.625rem;
		border-radius: 0.5rem;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		color: #cbd5e1;
		transition: background 0.12s ease, color 0.12s ease;
		text-align: left;
	}
	.menu-item:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
	}
	.menu-danger {
		color: #fda4af;
	}
	.menu-danger:hover {
		background: rgba(244, 63, 94, 0.12);
		color: #ffe4e6;
	}
</style>
