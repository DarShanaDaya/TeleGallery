<script>
	import { drive, submitPrompt } from '$lib/drive.svelte.js';
	import { X, FolderPlus, PencilLine } from 'lucide-svelte';

	let input = $state(null);
	let busy = $state(false);
	const prompt = $derived(drive.prompt);

	$effect(() => {
		if (prompt && input) {
			input.focus();
			input.select();
		}
	});

	async function confirm() {
		if (busy) return;
		busy = true;
		await submitPrompt();
		busy = false;
	}
</script>

{#if prompt}
	<div class="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
		<form
			class="fade-up w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl"
			onsubmit={(e) => {
				e.preventDefault();
				confirm();
			}}
		>
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
						{#if prompt.mode === 'create-folder'}
							<FolderPlus size={18} />
						{:else}
							<PencilLine size={18} />
						{/if}
					</span>
					<h2 class="text-base font-semibold text-white">{prompt.title}</h2>
				</div>
				<button type="button" class="icon-btn h-8 w-8" onclick={() => (drive.prompt = null)}>
					<X size={14} />
				</button>
			</div>

			<label class="mt-5 block text-xs font-medium text-slate-400" for="prompt-input">{prompt.label}</label>
			<input
				id="prompt-input"
				class="input mt-1.5"
				bind:this={input}
				bind:value={prompt.value}
				placeholder="Untitled"
				autocomplete="off"
			/>

			<div class="mt-6 flex justify-end gap-2">
				<button type="button" class="btn-ghost" onclick={() => (drive.prompt = null)}>Cancel</button>
				<button type="submit" class="btn-primary" disabled={busy}>{prompt.confirmLabel}</button>
			</div>
		</form>
	</div>
{/if}
