<script>
	import { drive } from '$lib/drive.svelte.js';
	import { formatBytes, formatDate, fileCategory } from '$lib/format.js';
	import { X, Download, PencilLine, Trash2, ExternalLink } from 'lucide-svelte';
	import { api } from '$lib/drive.svelte.js';
	import { toasts } from '$lib/toast.svelte.js';
	import { onMount } from 'svelte';

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
	<div class="fixed inset-0 z-[75] flex flex-col bg-black/85 backdrop-blur-md">
		<header class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
			<div class="min-w-0">
				<h3 class="truncate text-sm font-semibold text-white">{file.name}</h3>
				<p class="text-[11px] text-slate-500">
					{formatBytes(file.size)} · {formatDate(file.createdAt)} · {file.storage === 'telegram' ? 'Telegram' : 'Local'}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<a class="icon-btn" href={`/api/files/${file.id}/download`} title="Download"><Download size={15} /></a>
				<button class="icon-btn" title="Rename" onclick={() => ((drive.preview = null), drive.rename(file))}><PencilLine size={15} /></button>
				<button class="icon-btn" title="Trash" onclick={trash}><Trash2 size={15} /></button>
				<button class="icon-btn" title="Close" onclick={() => (drive.preview = null)}><X size={16} /></button>
			</div>
		</header>

		<div class="flex flex-1 items-center justify-center overflow-auto p-4">
			{#if kind === 'image'}
				<img {src} alt={file.name} class="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
			{:else if kind === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video {src} controls class="max-h-full max-w-full rounded-xl shadow-2xl" preload="metadata"></video>
			{:else if kind === 'audio'}
				<div class="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-center">
					<p class="mb-4 truncate text-sm text-slate-300">{file.name}</p>
					<audio {src} controls class="w-full"></audio>
				</div>
			{:else if kind === 'pdf'}
				<iframe {src} title={file.name} class="h-full w-full max-w-4xl rounded-xl border border-white/10 bg-white"></iframe>
			{:else}
				<div class="max-w-sm rounded-2xl border border-white/10 bg-[#0b1220] p-8 text-center">
					<p class="text-sm text-slate-300">No inline preview for this file type.</p>
					<a class="btn-primary mt-5" href={`/api/files/${file.id}/download`}>
						<Download size={16} /> Download {formatBytes(file.size)}
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
