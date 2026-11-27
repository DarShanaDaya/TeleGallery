<script>
	import { Folder, FileText, FileImage, FileVideo, FileAudio, FileArchive, File as FileGeneric } from 'lucide-svelte';
	import { fileCategory, categoryStyles } from '$lib/format.js';

	let { file, size = 20, boxed = false } = $props();

	const kind = $derived(file.kind === 'folder' ? 'folder' : fileCategory(file.mime, file.name));
	const style = $derived(categoryStyles[kind] || categoryStyles.file);
	const icon = $derived(
		kind === 'folder'
			? Folder
			: kind === 'image'
				? FileImage
				: kind === 'video'
					? FileVideo
					: kind === 'audio'
						? FileAudio
						: kind === 'archive'
							? FileArchive
							: kind === 'pdf' || kind === 'text'
								? FileText
								: FileGeneric
	);

	const isImage = $derived(file.kind === 'file' && kind === 'image');
</script>

{#if boxed}
	<div class="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-br {style.bg}">
		{#if isImage}
			<img
				src={`/api/files/${file.id}/download?inline=1`}
				alt={file.name}
				loading="lazy"
				class="h-full w-full object-cover"
			/>
		{:else}
			{@const Icon = icon}
			<Icon size={Math.min(size * 1.6, 34)} class={style.text} strokeWidth={1.5} />
		{/if}
	</div>
{:else}
	{@const Icon = icon}
	<Icon {size} class={style.text} strokeWidth={1.7} />
{/if}
