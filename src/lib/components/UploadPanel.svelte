<script>
	import { uploader } from '#lib/uploader.svelte.js';
	import { formatBytes } from '#lib/format.js';
	import { ChevronDown, X } from 'lucide-svelte';
</script>

{#if uploader.items.length}
	<div
		class="fixed bottom-4 left-1/2 z-50 w-[min(23rem,calc(100vw-2rem))] -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0"
	>
		<div class="border border-rule bg-paper-2 shadow-[0_24px_60px_-32px_rgba(25,23,18,0.65)]">
			<button
				class="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
				onclick={() => (uploader.open = !uploader.open)}
			>
				<div class="min-w-0">
					<p class="label text-ink-2">
						{#if uploader.active}
							Uploading · {uploader.active} file{uploader.active > 1 ? 's' : ''}
						{:else}
							Uploads complete
						{/if}
					</p>
					<div class="mt-1.5 flex items-center gap-2">
						<span class="h-1 w-28 bg-paper-3">
							<span class="block h-full bg-accent transition-all" style="width:{uploader.totalProgress}%"></span>
						</span>
						<span class="font-mono text-[10px] text-ink-3">{uploader.totalProgress}%</span>
					</div>
				</div>
				<ChevronDown size={14} class="shrink-0 text-ink-3 transition {uploader.open ? '' : 'rotate-180'}" />
			</button>

			{#if uploader.open}
				<ul class="max-h-56 divide-y divide-rule overflow-y-auto border-t border-rule">
					{#each uploader.items as item (item.id)}
						<li class="flex items-start gap-2.5 px-3.5 py-2">
							<span
								class="mt-1.5 h-1.5 w-1.5 shrink-0 {item.status === 'done'
									? 'bg-success'
									: item.status === 'error'
										? 'bg-danger'
										: 'bg-accent'}"
							></span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-[12px] text-ink">{item.name}</p>
								<p class="font-mono text-[10px] text-ink-3">
									{#if item.status === 'error'}
										<span class="text-danger">{item.error}</span>
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
			{/if}

			<div class="flex justify-end border-t border-rule px-3 py-1.5">
				<button
					class="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 transition-colors hover:text-ink"
					onclick={() => uploader.clearFinished()}
				>
					Clear
				</button>
			</div>
		</div>
	</div>
{/if}
