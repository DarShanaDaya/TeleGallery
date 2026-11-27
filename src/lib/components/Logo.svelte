<script>
	let { size = 32, withText = true, textClass = 'text-[1.35rem]' } = $props();
</script>

<div class="flex items-center gap-2.5">
	<span
		class="grid shrink-0 place-items-center border border-ink bg-ink text-paper-2"
		style="width:{size}px;height:{size}px"
	>
		<svg viewBox="0 0 24 24" fill="none" style="width:{size * 0.52}px;height:{size * 0.52}px">
			<path d="M5.5 3.5h7.2L18 8.8v11.7H5.5V3.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
			<path d="M12.4 3.8v5.2h5.3" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
			<path d="M8.4 13.2h6.6M8.4 16.3h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
		</svg>
	</span>
	{#if withText}
		<span class="{textClass} font-display leading-none tracking-tight text-ink">
			Tele<span class="italic">Drive</span>
		</span>
	{/if}
</div>
