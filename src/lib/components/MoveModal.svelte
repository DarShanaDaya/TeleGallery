<script>
	import { drive, api } from '#lib/drive.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
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
			toasts.success(`Moved “${file.name}”`);
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
	<div
		class="fixed inset-0 z-[70] grid place-items-center bg-ink/25 p-4 backdrop-blur-[2px]"
		role="presentation"
		onclick={() => (drive.move = null)}
	>
		<div
			class="rise w-full max-w-md border border-rule bg-paper-2 shadow-[0_30px_70px_-40px_rgba(25,23,18,0.6)]"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-start justify-between border-b border-rule px-5 py-3">
				<div class="min-w-0">
					<h2 class="truncate font-display text-lg text-ink">Move “{file.name}”</h2>
					<p class="label mt-0.5">Choose a destination</p>
				</div>
				<button class="icon-btn h-7 w-7" onclick={() => (drive.move = null)}><X size={13} /></button>
			</div>

			<div class="px-5 py-4">
				<div class="flex items-center gap-2">
					{#if trail.length > 1}
						<button class="icon-btn h-6 w-6" onclick={goUp} title="Up one level"><ArrowUp size={12} /></button>
					{/if}
					<p class="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
						{trail.map((t) => t.name).join(' / ')}
					</p>
				</div>

				<div class="mt-2.5 h-52 overflow-y-auto border border-rule">
					{#if loading}
						<div class="grid h-full place-items-center text-ink-3">
							<LoaderCircle size={16} class="animate-[spin_1s_linear_infinite]" />
						</div>
					{:else if !folders.length}
						<div class="grid h-full place-items-center px-4 text-center text-[12px] text-ink-3">
							No subfolders here — move into this level instead.
						</div>
					{:else}
						{#each folders as folder (folder.id)}
							<button
								class="flex w-full items-center gap-2.5 border-b border-rule px-3 py-2 text-left text-[13px] text-ink-2 transition-colors last:border-0 hover:bg-paper-3 hover:text-ink"
								onclick={() => enter(folder)}
							>
								<Folder size={13} strokeWidth={1.6} class="text-ink-3" />
								<span class="flex-1 truncate">{folder.name}</span>
								<ChevronRight size={12} class="text-ink-3" />
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t border-rule px-5 py-3">
				<button class="btn btn-quiet" onclick={() => (drive.move = null)}>Cancel</button>
				<button class="btn btn-primary" onclick={move} disabled={busy || loading}>Move here</button>
			</div>
		</div>
	</div>
{/if}
