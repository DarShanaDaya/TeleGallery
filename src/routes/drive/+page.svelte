<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Topbar from '$lib/components/Topbar.svelte';
	import FileGrid from '$lib/components/FileGrid.svelte';
	import PromptModal from '$lib/components/PromptModal.svelte';
	import PreviewModal from '$lib/components/PreviewModal.svelte';
	import MoveModal from '$lib/components/MoveModal.svelte';
	import { drive } from '$lib/drive.svelte.js';
	import { uploader } from '$lib/uploader.svelte.js';
	import { api } from '$lib/drive.svelte.js';
	import { toasts } from '$lib/toast.svelte.js';
	import { formatBytes } from '$lib/format.js';
	import { ChevronRight, Home, CloudUpload, FolderPlus, UploadCloud, Sparkles } from 'lucide-svelte';

	let { data } = $props();

	let view = $state('grid');
	let dragging = $state(false);
	let fileInput;
	let folderInput;

	$effect(() => {
		if (typeof localStorage === 'undefined') return;
		const saved = localStorage.getItem('tg_view');
		if (saved === 'list' || saved === 'grid') view = saved;
	});

	$effect(() => {
		if (typeof localStorage !== 'undefined') localStorage.setItem('tg_view', view);
	});

	const parentId = $derived(page.url.searchParams.get('folder') || null);
	const title = $derived(data.crumbs?.at(-1)?.name || 'My Drive');

	// Follow folder navigation from the URL.
	$effect(() => {
		drive.folderId = parentId;
	});

	const totalBytes = $derived((data.files || []).reduce((s, f) => s + (f.kind === 'file' ? f.size : 0), 0));
	const folders = $derived((data.files || []).filter((f) => f.kind === 'folder').length);

	function openFolder(folder) {
		goto(`/drive?folder=${folder.id}`);
	}

	function pickFiles() {
		fileInput?.click();
	}

	async function onFilesChosen(e) {
		const files = e.target.files;
		if (!files?.length) return;
		await uploader.add(files, parentId);
		e.target.value = '';
		goto(page.url, { invalidateAll: true, noScroll: true });
	}

	function onDrop(e) {
		dragging = false;
		const items = e.dataTransfer?.files;
		if (items?.length) {
			uploader.add(items, parentId).then(() => goto(page.url, { invalidateAll: true, noScroll: true }));
		}
	}

	uploader.onComplete(() => goto(page.url, { invalidateAll: true, noScroll: true, keepFocus: true }));
</script>

<svelte:window ondrop={onDrop} ondragover={(e) => (e.preventDefault(), (dragging = true))} ondragleave={() => (dragging = false)} />

<Topbar {data} {title} bind:view onUpload={pickFiles} onNewFolder={() => drive.newFolder(parentId)} />

<input type="file" multiple class="hidden" bind:this={fileInput} onchange={onFilesChosen} />

<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	<!-- breadcrumbs -->
	<nav class="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
		{#each data.crumbs as crumb, i}
			{#if i > 0}<ChevronRight size={12} class="text-slate-700" />{/if}
			{#if i === data.crumbs.length - 1}
				<span class="font-medium text-slate-300">{crumb.name}</span>
			{:else}
				<a
					href={crumb.id ? `/drive?folder=${crumb.id}` : '/drive'}
					class="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 hover:text-white"
				>
					{#if i === 0}<Home size={12} />{/if}
					{crumb.name}
				</a>
			{/if}
		{/each}
	</nav>

	{#if data.notFound}
		<div class="card p-10 text-center text-sm text-slate-400">This folder no longer exists.</div>
	{:else if !data.files.length}
		<div
			class="card flex flex-col items-center justify-center border-dashed px-6 py-20 text-center transition {dragging
				? 'border-brand-400/60 bg-brand-500/5'
				: ''}"
		>
			<div class="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
				<CloudUpload size={28} />
			</div>
			<h2 class="text-lg font-semibold text-white">This folder is empty</h2>
			<p class="mt-2 max-w-sm text-sm text-slate-400">
				Drag files anywhere on this page to upload, or use the buttons below.
			</p>
			<div class="mt-6 flex flex-wrap justify-center gap-2">
				<button class="btn-primary" onclick={pickFiles}><UploadCloud size={16} /> Upload files</button>
				<button class="btn-ghost" onclick={() => drive.newFolder(parentId)}><FolderPlus size={16} /> New folder</button>
			</div>
			{#if data.usage.files === 0}
				<p class="mt-6 flex items-center gap-1.5 text-[11px] text-slate-600">
					<Sparkles size={12} /> Unlimited storage — your files are kept in your Telegram account
				</p>
			{/if}
		</div>
	{:else}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-xs text-slate-500">
				{data.files.length} item{data.files.length === 1 ? '' : 's'}
				{#if folders}· {folders} folder{folders === 1 ? '' : 's'}{/if}
				{#if totalBytes}· {formatBytes(totalBytes)}{/if}
			</p>
		</div>
		<FileGrid files={data.files} {view} onOpen={openFolder} />
	{/if}
</div>

{#if dragging}
	<div class="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-brand-950/40 backdrop-blur-sm">
		<div class="rounded-3xl border-2 border-dashed border-brand-400/70 bg-[#0b1220]/90 px-14 py-12 text-center">
			<CloudUpload size={40} class="mx-auto mb-4 text-brand-300" />
			<p class="text-lg font-semibold text-white">Drop to upload</p>
			<p class="mt-1 text-sm text-slate-400">Files go straight to your Telegram storage</p>
		</div>
	</div>
{/if}

<PromptModal />
<PreviewModal />
<MoveModal />
