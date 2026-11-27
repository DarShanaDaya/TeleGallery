<script>
	import { toasts } from '$lib/toast.svelte.js';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';

	const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
	const tones = {
		success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
		error: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
		info: 'border-white/15 bg-[#0b1220]/95 text-slate-100'
	};
</script>

<div class="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
	{#each toasts.items as toast (toast.id)}
		{@const Icon = icons[toast.type] || Info}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur-xl {tones[
				toast.type
			] || tones.info}"
		>
			<Icon size={17} class="mt-0.5 shrink-0" />
			<p class="flex-1 leading-snug">{toast.message}</p>
			<button class="rounded p-0.5 opacity-60 transition hover:opacity-100" onclick={() => toasts.dismiss(toast.id)}>
				<X size={14} />
			</button>
		</div>
	{/each}
</div>
