<script>
	import { drive, submitPrompt } from '#lib/drive.svelte.js';
	import { X } from 'lucide-svelte';

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
	<div
		class="fixed inset-0 z-[70] grid place-items-center bg-ink/25 p-4 backdrop-blur-[2px]"
		role="presentation"
		onclick={() => (drive.prompt = null)}
	>
		<form
			class="rise w-full max-w-sm border border-rule bg-paper-2 shadow-[0_30px_70px_-40px_rgba(25,23,18,0.6)]"
			onclick={(e) => e.stopPropagation()}
			onsubmit={(e) => {
				e.preventDefault();
				confirm();
			}}
		>
			<div class="flex items-start justify-between border-b border-rule px-5 py-3">
				<div>
					<h2 class="font-display text-lg text-ink">{prompt.title}</h2>
					<p class="mt-0.5 text-[11.5px] text-ink-3">{prompt.mode === 'create-folder' ? 'New folder' : 'Rename item'}</p>
				</div>
				<button type="button" class="icon-btn h-7 w-7" onclick={() => (drive.prompt = null)}>
					<X size={13} />
				</button>
			</div>

			<div class="px-5 py-5">
				<label class="text-[11.5px] font-medium text-ink-3" for="prompt-input">{prompt.label}</label>
				<input
					id="prompt-input"
					class="input mt-2"
					bind:this={input}
					bind:value={prompt.value}
					placeholder="Untitled"
					autocomplete="off"
				/>
			</div>

			<div class="flex justify-end gap-2 border-t border-rule px-5 py-3">
				<button type="button" class="btn btn-quiet" onclick={() => (drive.prompt = null)}>Cancel</button>
				<button type="submit" class="btn btn-primary" disabled={busy}>{prompt.confirmLabel}</button>
			</div>
		</form>
	</div>
{/if}
