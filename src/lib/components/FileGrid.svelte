<script>
	import FileIcon from './FileIcon.svelte';
	import FileMenu from './FileMenu.svelte';
	import { drive } from '#lib/drive.svelte.js';
	import { formatBytes, formatDate } from '#lib/format.js';
	import { Star, MoreHorizontal } from 'lucide-svelte';

	let { files = [], view = 'list', trashMode = false, onOpen } = $props();
	let openMenu = $state(null);

	function activate(file) {
		if (trashMode) return;
		if (file.kind === 'folder') onOpen?.(file);
		else drive.openPreview(file);
	}
</script>

{#if view === 'grid'}
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
		{#each files as file (file.id)}
			<div
				class="group relative overflow-hidden rounded-[12px] border border-rule bg-paper-2 transition-colors hover:border-rule-strong"
			>
				<button
					type="button"
					class="block w-full text-left"
					onclick={() => activate(file)}
					onkeydown={(e) => e.key === 'Enter' && activate(file)}
					title={file.name}
				>
					<FileIcon {file} boxed />
					<div class="flex items-start justify-between gap-2 px-3 py-2.5">
						<div class="min-w-0">
							<p class="truncate text-[12.5px] font-medium text-ink">{file.name}</p>
							<p class="mt-0.5 text-[11px] text-ink-3">
								{file.kind === 'folder' ? 'Folder' : formatBytes(file.size)}
							</p>
						</div>
						{#if file.starred}
							<Star size={11} class="mt-1 shrink-0 text-accent" fill="currentColor" />
						{/if}
					</div>
				</button>

				<button
					class="icon-btn absolute right-1.5 top-1.5 h-6 w-6 bg-paper-2/90 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100"
					onclick={(e) => {
						e.stopPropagation();
						openMenu = openMenu === file.id ? null : file.id;
					}}
					aria-label="File actions"
				>
					<MoreHorizontal size={13} />
				</button>

				{#if openMenu === file.id}
					<div class="fixed inset-0 z-30" onclick={() => (openMenu = null)} role="presentation"></div>
					<FileMenu {file} onClose={() => (openMenu = null)} />
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<!-- the seam: rows hang off a single dashed thread -->
	<div class="seam-list pl-7">
		<span class="seam-draw absolute left-[11px] top-1 h-[calc(100%-0.5rem)] border-l border-dashed border-line-strong" aria-hidden="true"></span>
		{#each files as file (file.id)}
			<div
				class="group relative grid grid-cols-[1fr_28px] items-center gap-3 border-b border-rule py-0 last:border-0 sm:grid-cols-[1fr_88px_112px_28px]"
			>
				<span
					class="absolute -left-7 top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full border-2 border-paper transition-colors {file.starred ? 'bg-accent'
						: 'bg-paper-2 group-hover:bg-accent/40'}"
					aria-hidden="true"
				></span>

				<button
					type="button"
					class="flex min-w-0 items-center gap-2.5 py-[9px] text-left"
					onclick={() => activate(file)}
					onkeydown={(e) => e.key === 'Enter' && activate(file)}
				>
					<FileIcon {file} />
					<span class="truncate text-[13px] text-ink">{file.name}</span>
					{#if file.starred}<Star size={10} class="shrink-0 text-accent" fill="currentColor" />{/if}
				</button>

				<span class="hidden text-[11.5px] text-ink-2 num sm:block">
					{file.kind === 'folder' ? '' : formatBytes(file.size)}
				</span>
				<span class="hidden text-[11.5px] text-ink-3 sm:block">{formatDate(file.createdAt)}</span>

				<button
					class="icon-btn h-6 w-6 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
					onclick={(e) => {
						e.stopPropagation();
						openMenu = openMenu === file.id ? null : file.id;
					}}
					aria-label="File actions"
				>
					<MoreHorizontal size={13} />
				</button>

				{#if openMenu === file.id}
					<div class="fixed inset-0 z-30" onclick={() => (openMenu = null)} role="presentation"></div>
					<FileMenu {file} onClose={() => (openMenu = null)} />
				{/if}
			</div>
		{/each}
	</div>
{/if}
