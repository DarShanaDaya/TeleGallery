<script>
	import FileIcon from './FileIcon.svelte';
	import FileMenu from './FileMenu.svelte';
	import { drive } from '$lib/drive.svelte.js';
	import { formatBytes, formatDate } from '$lib/format.js';
	import { Star, MoreVertical, LayoutGrid, List } from 'lucide-svelte';

	let { files = [], view = 'grid', trashMode = false, onOpen } = $props();
	let openMenu = $state(null);

	function activate(file) {
		if (trashMode) return;
		if (file.kind === 'folder') onOpen?.(file);
		else drive.openPreview(file);
	}
</script>

{#if view === 'grid'}
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
		{#each files as file (file.id)}
			<div
				class="group relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5 transition hover:border-brand-400/40 hover:bg-white/[0.05]"
			>
				<button
					class="block w-full text-left"
					ondblclick={() => activate(file)}
					onclick={() => activate(file)}
					title={file.name}
				>
					<FileIcon {file} boxed size={20} />
					<div class="mt-2.5 px-0.5">
						<p class="truncate text-[13px] font-medium text-slate-100">{file.name}</p>
						<p class="mt-0.5 text-[11px] text-slate-500">
							{file.kind === 'folder' ? 'Folder' : formatBytes(file.size)} · {formatDate(file.createdAt)}
						</p>
					</div>
				</button>

				<div class="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
					{#if file.starred}
						<span class="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-amber-300"><Star size={13} fill="currentColor" /></span>
					{/if}
					<button
						class="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-slate-300 transition hover:bg-black/70 hover:text-white"
						onclick={(e) => {
							e.stopPropagation();
							openMenu = openMenu === file.id ? null : file.id;
						}}
					>
						<MoreVertical size={14} />
					</button>
				</div>

				{#if openMenu === file.id}
					<div class="fixed inset-0 z-30" onclick={() => (openMenu = null)} role="presentation"></div>
					<FileMenu {file} onClose={() => (openMenu = null)} />
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="overflow-hidden rounded-2xl border border-white/[0.07]">
		<div class="hidden grid-cols-[1fr_120px_140px_110px_44px] gap-3 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid">
			<span>Name</span>
			<span>Size</span>
			<span>Modified</span>
			<span>Storage</span>
			<span></span>
		</div>
		{#each files as file (file.id)}
			<div
				class="group relative grid cursor-pointer grid-cols-[1fr_44px] items-center gap-3 border-b border-white/[0.04] px-4 py-2.5 transition last:border-0 hover:bg-white/[0.04] sm:grid-cols-[1fr_120px_140px_110px_44px]"
			>
				<button
					type="button"
					class="flex min-w-0 items-center gap-3 text-left"
					onclick={() => activate(file)}
				>
					<FileIcon {file} size={17} />
					<span class="truncate text-[13px] font-medium text-slate-100">{file.name}</span>
					{#if file.starred}<Star size={12} class="shrink-0 text-amber-300" fill="currentColor" />{/if}
				</button>
				<span class="hidden text-xs text-slate-500 sm:block">{file.kind === 'folder' ? '—' : formatBytes(file.size)}</span>
				<span class="hidden text-xs text-slate-500 sm:block">{formatDate(file.createdAt)}</span>
				<span class="hidden text-xs text-slate-500 sm:block">{file.storage === 'telegram' ? 'Telegram' : file.kind === 'folder' ? '—' : 'Local'}</span>
				<button
					class="icon-btn h-8 w-8 opacity-0 transition group-hover:opacity-100"
					onclick={(e) => {
						e.stopPropagation();
						openMenu = openMenu === file.id ? null : file.id;
					}}
				>
					<MoreVertical size={14} />
				</button>
				{#if openMenu === file.id}
					<div class="fixed inset-0 z-30" onclick={() => (openMenu = null)} role="presentation"></div>
					<FileMenu {file} onClose={() => (openMenu = null)} />
				{/if}
			</div>
		{/each}
	</div>
{/if}


