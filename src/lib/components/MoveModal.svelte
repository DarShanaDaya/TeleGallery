<script>
	import { drive, api } from '$lib/drive.svelte.js';
	import { toasts } from '$lib/toast.svelte.js';
	import { Folder, ChevronRight, X, LoaderCircle, ArrowUp } from 'lucide-svelte';

	let current = $state(null);
	let folders = $state([]);
	let loading = $state(true);
	let busy = $state(false);
	let trail = $state([{ id: null, name: 'My Drive' }]);

	const file = $derived(drive.move);

	async function load(parentId, resetTrail = false) {
		loading = true;
		try {
			const res = await fetch(`/api/files?parent=${parentId ?? ''}`);
			const data = await res.json();
			folders = (data.files || []).filter((f) => f.kind === 'folder' && f.id !== file?.id);
			current = parentId;
			if (resetTrail) trail = [{ id: null, name: 'My Drive' }];
		} catch {
			toasts.error('Could not load folders');
		} finally {
			loading = false;
		}
	}

	function enter(folder) {
		trail = [...trail, { id: folder.id, name: folder.name }];
		load(folder.id);
	}

	function goUp() {
		if (trail.length <= 1) return;
		const next = trail.slice(0, -1);
		trail = next;
		load(next[next.length - 1].id);
	}

	$effect(() => {
		if (file) {
			trail = [{ id: null, name: 'My Drive' }];
			load(null);
		}
	});

	async function move() {
		busy = true;
		try {
			await api(`/api/files/${file.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ action: 'move', parentId: current })
			});
			toasts.success(`Moved "${file.name}"`);
			drive.move = null;
			drive.refresh();
		} catch (err) {
			toasts.error(err.message);
		} finally {
			busy = false;
		}
	}
</script>

{#if file}
	<div class="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
		<div class="fade-up w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-base font-semibold text-white">Move “{file.name}”</h2>
					<p class="mt-1 text-xs text-slate-500">Choose a destination folder</p>
				</div>
				<button class="icon-btn h-8 w-8" onclick={() => (drive.move = null)}><X size={14} /></button>
			</div>

			<div class="mt-4 flex items-center gap-1 text-xs text-slate-400">
				{#if trail.length > 1}
					<button class="icon-btn h-6 w-6" onclick={goUp}><ArrowUp size={12} /></button>
				{/if}
				<span class="truncate">{trail.map((t) => t.name).join(' / ')}</span>
			</div>

			<div class="mt-2 h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#070d18] p-1.5">
				{#if loading}
					<div class="grid h-full place-items-center text-slate-500"><LoaderCircle class="animate-spin" size={18} /></div>
				{:else if !folders.length}
					<div class="grid h-full place-items-center text-xs text-slate-600">No subfolders here</div>
				{:else}
					{#each folders as folder (folder.id)}
						<button
							class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
							ondblclick={() => enter(folder)}
							onclick={() => enter(folder)}
						>
							<Folder size={15} class="text-amber-300" />
							<span class="flex-1 truncate">{folder.name}</span>
							<ChevronRight size={13} class="text-slate-600" />
						</button>
					{/each}
				{/if}
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button class="btn-ghost" onclick={() => (drive.move = null)}>Cancel</button>
				<button class="btn-primary" onclick={move} disabled={busy || loading}>Move here</button>
			</div>
		</div>
	</div>
{/if}
