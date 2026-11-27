<script>
	import { drive, api } from '#lib/drive.svelte.js';
	import { fileCategory } from '#lib/format.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { Download, PencilLine, Star, StarOff, FolderInput, Trash2, RotateCcw, Trash, Eye, Link2, Send, Play } from 'lucide-svelte';

	let { file, onClose } = $props();

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

	async function copyBothLinks() {
		onClose?.();
		try {
			const res = await fetch(`/api/files/${file.id}/links`);
			const { telegramLink, shares } = await res.json();
			const activeShare = shares?.find((s) => s.active);
			const lines = [
				telegramLink ? `Telegram: ${telegramLink}` : null,
				activeShare ? `TeleDrive: ${location.origin}${activeShare.url}` : null
			].filter(Boolean);
			if (!lines.length) {
				toasts.error('No links yet — create a share link first');
				return;
			}
			await navigator.clipboard.writeText(lines.join('\n'));
			toasts.success('Links copied');
		} catch {
			toasts.error('Could not copy the links');
		}
	}

	const star = () =>
		act(async () => {
			await api(`/api/files/${file.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'star' }) });
			drive.refresh();
		});
</script>

<div
	class="absolute right-1 top-full z-40 mt-1 w-48 border border-rule bg-paper-2 py-1 shadow-[0_18px_40px_-24px_rgba(25,23,18,0.55)]"
	role="menu"
>
	{#if !isTrash}
		{#if file.kind === 'file'}
			<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openPreview(file))}>
				<Eye size={13} /> Preview
			</button>
			<a class="menu-item" role="menuitem" href={`/api/files/${file.id}/download`}>
				<Download size={13} /> Download
			</a>
			<a
				class="menu-item"
				role="menuitem"
				href={`/api/files/${file.id}/download?name=${encodeURIComponent(file.name)}`}
				download={file.name}
			>
				<Download size={13} /> Save a copy
			</a>
			<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openShare(file))}>
				<Link2 size={13} /> Share link
			</button>
			<button class="menu-item" role="menuitem" onclick={copyBothLinks}>
				<Send size={13} /> Copy both links
			</button>
			{#if ['video', 'audio'].includes(fileCategory(file.mime, file.name)) || file.mime?.startsWith('image/')}
				<a class="menu-item" role="menuitem" href={`/drive/watch/${file.id}`}>
					<Play size={13} /> Open in player
				</a>
			{/if}
		{/if}
		{#if file.kind === 'folder'}
            <button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openShare(file))}><Link2 size={13} /> Share link</button>
        {/if}
		<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.rename(file))}>
			<PencilLine size={13} /> Rename
		</button>
		<button class="menu-item" role="menuitem" onclick={() => (onClose?.(), drive.openMove(file))}>
			<FolderInput size={13} /> Move to…
		</button>
		<button class="menu-item" role="menuitem" onclick={star}>
			{#if file.starred}<StarOff size={13} /> Unstar{:else}<Star size={13} /> Star{/if}
		</button>
		<div class="my-1 h-px bg-rule"></div>
		<button class="menu-item menu-danger" role="menuitem" onclick={trash}>
			<Trash2 size={13} /> Move to trash
		</button>
	{:else}
		<button class="menu-item" role="menuitem" onclick={restore}>
			<RotateCcw size={13} /> Restore
		</button>
		<div class="my-1 h-px bg-rule"></div>
		<button class="menu-item menu-danger" role="menuitem" onclick={destroy}>
			<Trash size={13} /> Delete forever
		</button>
	{/if}
</div>

<style>
	.menu-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.65rem;
		font-size: 12.5px;
		color: var(--ink-2);
		text-align: left;
		transition:
			background-color 0.12s ease,
			color 0.12s ease;
	}
	.menu-item:hover {
		background: var(--paper-3);
		color: var(--ink);
	}
	.menu-danger {
		color: var(--danger);
	}
	.menu-danger:hover {
		background: color-mix(in oklab, var(--danger) 9%, transparent);
		color: var(--danger);
	}
</style>
