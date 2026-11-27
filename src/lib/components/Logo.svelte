<script>
	let { size = 40, withText = true, textClass = 'text-xl' } = $props();
</script>

<div class="flex items-center gap-3">
	<span
		class="grid place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-[0_12px_30px_-12px_rgba(35,128,247,0.9)]"
		style="width:{size}px;height:{size}px"
	>
		<svg viewBox="0 0 24 24" fill="none" style="width:{size * 0.55}px;height:{size * 0.55}px">
			<path
				d="M6.3 3.5h7.1L20.5 9v9.6a1.9 1.9 0 0 1-1.9 1.9H6.3a1.9 1.9 0 0 1-1.9-1.9V5.4a1.9 1.9 0 0 1 1.9-1.9Z"
				stroke="white"
				stroke-width="1.6"
				stroke-linejoin="round"
			/>
			<path d="M13 3.7V9h5.3" stroke="white" stroke-width="1.6" stroke-linejoin="round" />
			<path d="M8.2 13.4h7.6M8.2 16.6h4.6" stroke="white" stroke-width="1.6" stroke-linecap="round" />
		</svg>
	</span>
	{#if withText}
		<span class="{textClass} font-extrabold tracking-tight text-white">
			Tele<span class="text-brand-400">Drive</span>
		</span>
	{/if}
</div>
