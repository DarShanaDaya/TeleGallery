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
	<div class="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
		{#each files as file (file.id)}
			<div class="group relative bg-paper-2">
				<button
					type="button"
					class="block w-full text-left"
					onclick={() => activate(file)}
					onkeydown={(e) => e.key === 'Enter' && activate(file)}
					title={file.name}
				>
					<FileIcon {file} boxed />
					<div class="flex items-start justify-between gap-2 px-2.5 py-2">
						<div class="min-w-0">
							<p class="truncate text-[12.5px] leading-5 text-ink">{file.name}</p>
							<p class="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
								{file.kind === 'folder' ? 'folder' : formatBytes(file.size)}
							</p>
						</div>
						{#if file.starred}
							<Star size={10} class="mt-1 shrink-0 text-accent" fill="currentColor" />
						{/if}
					</div>
				</button>

				<button
					class="icon-btn absolute right-1.5 top-1.5 h-6 w-6 bg-paper-2/90 opacity-0 backdrop-blur transition group-hover:opacity-100"
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
	<div class="border-t border-rule">
		<div
			class="hidden grid-cols-[1fr_96px_120px_88px_30px] gap-3 border-b border-rule bg-paper-2/50 px-2 py-1.5 sm:grid"
		>
			<span class="label">Name</span>
			<span class="label">Size</span>
			<span class="label">Added</span>
			<span class="label">Stored</span>
			<span></span>
		</div>
		{#each files as file (file.id)}
			<div
				class="group relative grid grid-cols-[1fr_30px] items-center gap-3 border-b border-rule px-2 py-0 transition-colors hover:bg-paper-2/70 sm:grid-cols-[1fr_96px_120px_88px_30px]"
			>
				<button
					type="button"
					class="flex min-w-0 items-center gap-2.5 py-2 text-left"
					onclick={() => activate(file)}
					onkeydown={(e) => e.key === 'Enter' && activate(file)}
				>
					<FileIcon {file} />
					<span class="truncate text-[13px] text-ink">{file.name}</span>
					{#if file.starred}<Star size={10} class="shrink-0 text-accent" fill="currentColor" />{/if}
				</button>
				<span class="hidden font-mono text-[11px] text-ink-2 sm:block">
					{file.kind === 'folder' ? '—' : formatBytes(file.size)}
				</span>
				<span class="hidden font-mono text-[11px] text-ink-3 sm:block">{formatDate(file.createdAt)}</span>
				<span class="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3 sm:block">
					{file.storage === 'telegram' ? 'telegram' : file.kind === 'folder' ? '—' : 'local'}
				</span>
				<button
					class="icon-btn h-6 w-6 opacity-0 transition group-hover:opacity-100"
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
