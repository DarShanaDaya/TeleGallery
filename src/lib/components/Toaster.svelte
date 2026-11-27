<script>
	import { toasts } from '#lib/toast.svelte.js';
	import { X } from 'lucide-svelte';

	const tones = {
		success: 'border-success/40',
		error: 'border-danger/45',
		info: 'border-rule-strong'
	};
	const marks = { success: 'bg-success', error: 'bg-danger', info: 'bg-accent' };
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(21rem,calc(100vw-2rem))] flex-col gap-1.5">
	{#each toasts.items as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-start gap-2.5 border bg-paper-2 px-3 py-2.5 shadow-[0_18px_40px_-28px_rgba(25,23,18,0.6)] {tones[ toast.type
			] || tones.info}"
		>
			<span class="mt-1.5 h-1.5 w-1.5 shrink-0 {marks[toast.type] || marks.info}"></span>
			<p class="flex-1 text-[12.5px] leading-5 text-ink-2">{toast.message}</p>
			<button class="mt-0.5 text-ink-3 transition-colors hover:text-ink" onclick={() => toasts.dismiss(toast.id)}>
				<X size={12} />
			</button>
		</div>
	{/each}
</div>
