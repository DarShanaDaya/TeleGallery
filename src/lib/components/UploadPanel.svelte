<script>
	import { uploader } from '$lib/uploader.svelte.js';
	import { formatBytes } from '$lib/format.js';
	import { ChevronDown, X, CheckCircle2, AlertCircle, LoaderCircle } from 'lucide-svelte';
</script>

{#if uploader.items.length}
	<div class="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 lg:left-auto lg:right-5 lg:translate-x-0">
		<div class="pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
			<button
				class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
				onclick={() => (uploader.open = !uploader.open)}
			>
				<div class="min-w-0">
					<p class="text-sm font-semibold text-white">
						{#if uploader.active}
							Uploading {uploader.active} file{uploader.active > 1 ? 's' : ''}…
						{:else}
							Uploads finished
						{/if}
					</p>
					<p class="mt-0.5 text-[11px] text-slate-500">{uploader.totalProgress}% complete</p>
				</div>
				<ChevronDown size={16} class="shrink-0 text-slate-400 transition {uploader.open ? '' : 'rotate-180'}" />
			</button>

			<div class="h-1 w-full bg-white/5">
				<div class="h-full bg-gradient-to-r from-brand-500 to-cyan-300 transition-all" style="width:{uploader.totalProgress}%"></div>
			</div>

			{#if uploader.open}
				<ul class="max-h-64 divide-y divide-white/5 overflow-y-auto">
					{#each uploader.items as item (item.id)}
						<li class="flex items-center gap-3 px-4 py-2.5">
							{#if item.status === 'done'}
								<CheckCircle2 size={15} class="shrink-0 text-emerald-400" />
							{:else if item.status === 'error'}
								<AlertCircle size={15} class="shrink-0 text-rose-400" />
							{:else}
								<LoaderCircle size={15} class="shrink-0 animate-spin text-brand-400" />
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs font-medium text-slate-200">{item.name}</p>
								<p class="text-[11px] text-slate-500">
									{#if item.status === 'error'}
										<span class="text-rose-300">{item.error}</span>
									{:else if item.status === 'done'}
										{formatBytes(item.size)} · stored
									{:else}
										{formatBytes(item.loaded)} / {formatBytes(item.size)}
									{/if}
								</p>
							</div>
						</li>
					{/each}
				</ul>
				<div class="flex justify-end border-t border-white/5 px-3 py-2">
					<button class="text-[11px] font-medium text-slate-400 transition hover:text-white" onclick={() => uploader.clearFinished()}>
						Clear
					</button>
				</div>
			{:else}
				<div class="flex justify-end border-t border-white/5 px-3 py-1.5">
					<button class="text-[11px] font-medium text-slate-500 transition hover:text-white" onclick={() => uploader.clearFinished()}>
						Clear
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
