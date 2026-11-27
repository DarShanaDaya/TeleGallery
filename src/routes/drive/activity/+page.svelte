<script>
	import Topbar from '#lib/components/Topbar.svelte';
	import { formatDate } from '#lib/format.js';
	import { goto } from '$app/navigation';
	import {
		Activity,
		Link2,
		Upload,
		Download,
		PencilLine,
		FolderInput,
		Star,
		Trash2,
		RotateCcw,
		LogIn,
		Share2,
		Play
	} from 'lucide-svelte';

	let { data } = $props();

	const icons = {
		import: Link2,
		'import.request': Link2,
		upload: Upload,
		download: Download,
		rename: PencilLine,
		move: FolderInput,
		star: Star,
		trash: Trash2,
		restore: RotateCcw,
		purge: Trash2,
		'auth.login': LogIn,
		'share.create': Share2,
		'share.revoke': Share2,
		'file.open': Play
	};

	const verbs = {
		import: 'Imported from a link',
		'import.request': 'Tried to import',
		upload: 'Uploaded',
		download: 'Downloaded',
		rename: 'Renamed',
		move: 'Moved',
		star: 'Starred',
		trash: 'Moved to trash',
		restore: 'Restored',
		purge: 'Deleted for good',
		'auth.login': 'Signed in',
		'share.create': 'Shared',
		'share.revoke': 'Revoked a link',
		'file.open': 'Opened in the player'
	};

	const filters = [
		{ value: null, label: 'Everything' },
		{ value: 'import', label: 'Imports' },
		{ value: 'upload', label: 'Uploads' },
		{ value: 'download', label: 'Downloads' },
		{ value: 'share.create', label: 'Shares' },
		{ value: 'trash', label: 'Trash' }
	];

	function applyFilter(value) {
		goto(value ? `/drive/activity?action=${encodeURIComponent(value)}` : '/drive/activity');
	}
</script>

<Topbar
	{data}
	title="Activity"
	subtitle="{data.total} event{data.total === 1 ? '' : 's'}{data.action
		? ` · filtered to ${data.action}`
		: ''}"
	showUpload={false}
/>

<div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
	<div class="mb-5 flex flex-wrap gap-1.5">
		{#each filters as filter}
			<button
				class="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors {data.action === filter.value
					? 'bg-accent text-white'
					: 'bg-paper-3 text-ink-2 hover:text-ink'}"
				onclick={() => applyFilter(filter.value)}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if !data.entries.length}
		<div class="card flex flex-col items-center px-6 py-16 text-center">
			<Activity size={20} strokeWidth={1.6} class="text-ink-3" />
			<p class="mt-4 text-[14px] font-medium text-ink">Nothing recorded yet</p>
			<p class="mt-1.5 max-w-[24rem] text-[12.5px] leading-relaxed text-ink-3">
				Imports, uploads, downloads, shares and deletions all show up here as they happen.
			</p>
		</div>
	{:else}
		<ol class="relative">
			{#each data.entries as entry, i (entry.id)}
				{@const Icon = icons[entry.action] || Activity}
				<li class="relative flex gap-4 pb-5">
					{#if i < data.entries.length - 1}
						<span class="absolute left-[13px] top-7 h-full w-px bg-rule" aria-hidden="true"></span>
					{/if}
					<span class="relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-3 text-ink-2">
						<Icon size={13} strokeWidth={1.9} />
					</span>
					<div class="min-w-0 flex-1 pt-0.5">
						<p class="text-[13px] text-ink">
							{verbs[entry.action] || entry.action}
							{#if entry.targetName}
								<span class="font-medium">{entry.targetName}</span>
							{/if}
						</p>
						{#if entry.detail}
							<p class="mt-0.5 truncate text-[11.5px] text-ink-3">{entry.detail}</p>
						{/if}
						<p class="mt-0.5 text-[11px] text-ink-3">
							{formatDate(entry.createdAt)}{entry.ip ? ` · from ${entry.ip}` : ''}
						</p>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>
