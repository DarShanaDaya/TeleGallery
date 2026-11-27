<script>
	import { onMount } from 'svelte';
	import { drive, api } from '#lib/drive.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { formatBytes, formatDate, fileCategory } from '#lib/format.js';
	import { X, Download, PencilLine, Trash2 } from 'lucide-svelte';

	const file = $derived(drive.preview);
	const kind = $derived(file ? fileCategory(file.mime, file.name) : 'file');
	const src = $derived(file ? `/api/files/${file.id}/download?inline=1` : '');

	onMount(() => {
		const onKey = (e) => {
			if (e.key === 'Escape') drive.preview = null;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	async function trash() {
		try {
			await api(`/api/files/${file.id}`, { method: 'DELETE' });
			toasts.success('Moved to trash');
			drive.preview = null;
			drive.refresh();
		} catch (err) {
			toasts.error(err.message);
		}
	}
</script>

{#if file}
	<div class="fixed inset-0 z-[75] flex bg-ink/30 p-0 backdrop-blur-[3px] sm:p-6">
		<div
			class="rise mx-auto flex h-full w-full max-w-5xl flex-col border border-rule bg-paper-2 shadow-[0_40px_90px_-40px_rgba(25,23,18,0.6)]"
		>
			<header class="flex items-center justify-between gap-4 border-b border-rule px-4 py-2.5">
				<div class="min-w-0">
					<h3 class="truncate text-[13px] font-medium text-ink">{file.name}</h3>
					<p class="mt-0.5 text-[11.5px] text-ink-3">
						{formatBytes(file.size)} · {formatDate(file.createdAt)} ·
						{file.storage === 'telegram' ? 'telegram' : 'local'}
					</p>
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<a class="icon-btn" href={`/api/files/${file.id}/download`} title="Download"><Download size={14} /></a>
					<button
						class="icon-btn"
						title="Rename"
						onclick={() => ((drive.preview = null), drive.rename(file))}><PencilLine size={14} /></button
					>
					<button class="icon-btn" title="Move to trash" onclick={trash}><Trash2 size={14} /></button>
					<span class="mx-1 h-4 w-px bg-rule"></span>
					<button class="icon-btn" title="Close" onclick={() => (drive.preview = null)}><X size={15} /></button>
				</div>
			</header>

			<div class="flex flex-1 items-center justify-center overflow-auto bg-paper-3/40 p-4">
				{#if kind === 'image'}
					<img {src} alt={file.name} class="max-h-full max-w-full border border-rule object-contain" />
				{:else if kind === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video {src} controls class="max-h-full max-w-full border border-rule" preload="metadata"></video>
				{:else if kind === 'audio'}
					<div class="w-full max-w-md border border-rule bg-paper-2 p-6">
						<p class="truncate text-[13px] text-ink">{file.name}</p>
						<audio {src} controls class="mt-4 w-full"></audio>
					</div>
				{:else if kind === 'pdf'}
					<iframe {src} title={file.name} class="h-full w-full max-w-4xl border border-rule bg-white"></iframe>
				{:else}
					<div class="border border-rule bg-paper-2 p-8 text-center">
						<p class="text-[11.5px] font-medium text-ink-3">No preview</p>
						<p class="mt-2 max-w-[18rem] text-[13px] leading-6 text-ink-2">
							This file type can’t be rendered in the browser.
						</p>
						<a class="btn btn-primary mt-5" href={`/api/files/${file.id}/download`}>
							<Download size={14} /> Download {formatBytes(file.size)}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
