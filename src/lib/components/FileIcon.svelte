<script>
	import { Folder, FileText, FileImage, FileVideo, FileAudio, FileArchive, File } from 'lucide-svelte';
	import { fileCategory } from '#lib/format.js';

	let { file, size = 15, boxed = false } = $props();

	const kind = $derived(file.kind === 'folder' ? 'folder' : fileCategory(file.mime, file.name));
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
							: FileText
	);
	const isImage = $derived(file.kind === 'file' && kind === 'image');
	const isVideo = $derived(file.kind === 'file' && kind === 'video');
</script>

{#if boxed}
	<div class="relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden border-b border-rule bg-paper-3/60">
		{#if isImage}
			<img
				src={`/api/files/${file.id}/download?inline=1`}
				alt=""
				loading="lazy"
				class="h-full w-full object-cover grayscale-[18%] transition duration-300 group-hover:grayscale-0"
			/>
		{:else if isVideo}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={`/api/files/${file.id}/download?inline=1`}
				class="h-full w-full object-cover opacity-80"
				preload="metadata"
				muted
			></video>
		{:else}
			{@const Icon = icon}
			<Icon size={26} strokeWidth={1.1} class={kind === 'folder' ? 'text-ink-2' : 'text-ink-3'} />
		{/if}
		{#if file.starred}
			<span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent"></span>
		{/if}
	</div>
{:else}
	{@const Icon = icon}
	<Icon {size} strokeWidth={1.6} class={kind === 'folder' ? 'text-ink-2' : 'text-ink-3'} />
{/if}
