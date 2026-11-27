<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Topbar from '#lib/components/Topbar.svelte';
	import FileGrid from '#lib/components/FileGrid.svelte';
	import PromptModal from '#lib/components/PromptModal.svelte';
	import PreviewModal from '#lib/components/PreviewModal.svelte';
	import MoveModal from '#lib/components/MoveModal.svelte';
	import { drive, api } from '#lib/drive.svelte.js';
	import { uploader } from '#lib/uploader.svelte.js';
	import { formatBytes } from '#lib/format.js';
	import { ChevronRight, CloudUpload, FolderPlus, Upload, CornerDownRight } from 'lucide-svelte';

	let { data } = $props();

	let view = $state('list');
	let dragging = $state(false);
	let fileInput;

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
	const count = $derived(data.files?.length || 0);
	const totalBytes = $derived((data.files || []).reduce((s, f) => s + (f.kind === 'file' ? f.size : 0), 0));
	const subtitle = $derived(
		data.notFound
			? 'missing folder'
			: `${count} item${count === 1 ? '' : 's'}${totalBytes ? ' · ' + formatBytes(totalBytes) : ''}`
	);

	$effect(() => {
		drive.folderId = parentId;
	});

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

<svelte:window
	ondrop={onDrop}
	ondragover={(e) => (e.preventDefault(), (dragging = true))}
	ondragleave={() => (dragging = false)}
/>

<Topbar {data} {title} {subtitle} bind:view onUpload={pickFiles} onNewFolder={() => drive.newFolder(parentId)} />

<input type="file" multiple class="hidden" bind:this={fileInput} onchange={onFilesChosen} />

<div class="flex-1 overflow-y-auto">
	<!-- breadcrumb rail -->
	<div class="flex flex-wrap items-center gap-1.5 border-b border-rule px-4 py-2 sm:px-6">
		{#each data.crumbs as crumb, i}
			{#if i > 0}<ChevronRight size={11} class="text-ink-3/60" />{/if}
			{#if i === data.crumbs.length - 1}
				<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">{crumb.name}</span>
			{:else}
				<a
					href={crumb.id ? `/drive?folder=${crumb.id}` : '/drive'}
					class="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 transition-colors hover:text-ink"
				>
					{crumb.name}
				</a>
			{/if}
		{/each}
		<span class="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 sm:block">
			{view} view
		</span>
	</div>

	<div class="px-4 py-5 sm:px-6">
		{#if data.notFound}
			<div class="border border-rule bg-paper-2 px-6 py-12 text-center">
				<p class="label">404</p>
				<p class="mt-2 text-[13px] text-ink-2">This folder no longer exists.</p>
				<a href="/drive" class="btn btn-ghost mt-5">Back to My Drive</a>
			</div>
		{:else if !data.files.length}
			<div class="border border-dashed border-rule-strong bg-paper-2/40 px-6 py-16 text-center">
				<div class="mx-auto grid h-12 w-12 place-items-center border border-rule-strong bg-paper-2">
					<CloudUpload size={20} strokeWidth={1.3} class="text-ink-2" />
				</div>
				<h2 class="mt-5 font-display text-2xl text-ink">This folder is empty</h2>
				<p class="mx-auto mt-2 max-w-[26rem] text-[13px] leading-6 text-ink-2">
					Drag files anywhere on this page, or start with a folder. Uploads are chunked and written straight to
					Telegram.
				</p>
				<div class="mt-6 flex flex-wrap justify-center gap-2">
					<button class="btn btn-primary" onclick={pickFiles}><Upload size={13} /> Upload files</button>
					<button class="btn btn-ghost" onclick={() => drive.newFolder(parentId)}
						><FolderPlus size={13} /> New folder</button
					>
				</div>
				<p class="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
					Unlimited · private · chunked at 45 MB
				</p>
			</div>
		{:else}
			<FileGrid files={data.files} {view} onOpen={openFolder} />
		{/if}
	</div>
</div>

{#if dragging}
	<div class="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-ink/20 backdrop-blur-[2px]">
		<div class="rise border border-rule-strong bg-paper-2 px-12 py-10 text-center shadow-[0_30px_70px_-40px_rgba(25,23,18,0.6)]">
			<CornerDownRight size={22} class="mx-auto mb-3 text-accent" strokeWidth={1.4} />
			<p class="font-display text-2xl text-ink">Drop to upload</p>
			<p class="label mt-2">Files go to your Telegram chat</p>
		</div>
	</div>
{/if}

<PromptModal />
<PreviewModal />
<MoveModal />
