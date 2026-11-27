<script>
	let { size = 30, withText = true, textClass = 'text-[1.3rem]' } = $props();
</script>

<div class="flex items-center gap-2.5">
	<span class="grid shrink-0 place-items-center rounded-[9px] bg-accent" style="width:{size}px;height:{size}px">
		<svg viewBox="0 0 24 24" fill="none" style="width:{size * 0.56}px;height:{size * 0.56}px">
			<!-- a thread running through two folds: the product in one mark -->
			<path
				d="M7 4.5h6.4L17.5 8.6V19.5H7V4.5Z"
				stroke="#f7fbfa"
				stroke-width="1.5"
				stroke-linejoin="round"
			/>
			<path d="M13.1 4.8v4h4.1" stroke="#f7fbfa" stroke-width="1.5" stroke-linejoin="round" />
			<path d="M4 9.4v10.1h8.6" stroke="#f7fbfa" stroke-width="1.5" stroke-linecap="round" opacity="0.55" />
		</svg>
	</span>
	{#if withText}
		<span class="{textClass} display text-ink">TeleDrive</span>
	{/if}
</div>
