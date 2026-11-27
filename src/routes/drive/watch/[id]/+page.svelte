<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import Logo from '#lib/components/Logo.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import FileMenu from '#lib/components/FileMenu.svelte';
	import { player, hydratePlayer, formatTime } from '#lib/player.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { formatBytes, formatDate } from '#lib/format.js';
	import {
		Play,
		Pause,
		SkipBack,
		SkipForward,
		Volume2,
		VolumeX,
		Maximize,
		Minimize,
		Repeat,
		Gauge,
		ArrowLeft,
		Download,
		Link2,
		Send,
		Copy,
		MoreHorizontal,
		ListVideo,
		RotateCcw
	} from 'lucide-svelte';

	let { data } = $props();

	let video = $state(null);
	let shell = $state(null);
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let muted = $state(false);
	let rate = $state(1);
	let fullscreen = $state(false);
	let controlsVisible = $state(true);
	let menuOpen = $state(false);
	let playlistOpen = $state(true);
	let hideTimer;
	let seekTarget = $state(null);

	const file = $derived(player.current ?? data.file);
	const src = $derived(file ? `/api/files/${file.id}/download?inline=1` : '');
	const isVideo = $derived(file?.kind === 'video');
	const isAudio = $derived(file?.kind === 'audio');
	const telegramLink = $derived(data.links.telegramLink);
	const shareLink = $derived(data.links.shares?.find((s) => s.active)?.url ?? null);

	const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

	onMount(() => {
		hydratePlayer();
		player.setQueue(data.queue, data.file.id);
		return () => clearTimeout(hideTimer);
	});

	// Keep the URL in step with the queue so every position is bookmarkable.
	$effect(() => {
		const current = player.current;
		if (current && current.id !== data.file.id && page.url.pathname.startsWith('/drive/watch/')) {
			goto(`/drive/watch/${current.id}`, { replaceState: true, noScroll: true, keepFocus: true });
		}
	});

	function onLoadedMetadata() {
		if (!video) return;
		duration = video.duration || 0;
		const resume = player.recall(file.id);
		if (resume > 3 && resume < duration - 4) {
			video.currentTime = resume;
			toasts.info(`Resumed at ${formatTime(resume)}`);
		}
		video.playbackRate = rate;
		if (player.autoplay) video.play().catch(() => (playing = false));
	}

	function toggle() {
		if (!video) return;
		if (video.paused) video.play().catch(() => {});
		else video.pause();
	}

	function seekTo(seconds) {
		if (!video || !Number.isFinite(duration)) return;
		video.currentTime = Math.max(0, Math.min(seconds, duration));
		currentTime = video.currentTime;
	}

	function nudge(delta) {
		seekTo(video.currentTime + delta);
	}

	function setVolume(next) {
		volume = Math.max(0, Math.min(1, next));
		muted = volume === 0;
		if (video) {
			video.volume = volume;
			video.muted = muted;
		}
	}

	function toggleMute() {
		muted = !muted;
		if (video) video.muted = muted;
	}

	function setRate(next) {
		rate = next;
		if (video) video.playbackRate = next;
	}

	function skip(direction) {
		if (video) player.remember(file.id, video.currentTime);
		if (direction > 0) player.next();
		else player.prev();
	}

	async function toggleFullscreen() {
		if (!shell) return;
		if (!document.fullscreenElement) {
			await shell.requestFullscreen?.();
			fullscreen = true;
		} else {
			await document.exitFullscreen?.();
			fullscreen = false;
		}
	}

	function onKey(e) {
		const tag = e.target?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
		switch (e.key) {
			case ' ':
			case 'k':
				e.preventDefault();
				toggle();
				break;
			case 'ArrowRight':
				e.preventDefault();
				nudge(e.shiftKey ? 30 : 5);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				nudge(e.shiftKey ? -30 : -5);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setVolume(volume + 0.1);
				break;
			case 'ArrowDown':
				e.preventDefault();
				setVolume(volume - 0.1);
				break;
			case 'f':
				toggleFullscreen();
				break;
			case 'm':
				toggleMute();
				break;
			case 'n':
				skip(1);
				break;
			case 'p':
				skip(-1);
				break;
			case 'Escape':
				if (!document.fullscreenElement) menuOpen = false;
				break;
			default:
				if (/^[0-9]$/.test(e.key) && video && Number.isFinite(duration)) {
					seekTo((Number(e.key) / 10) * duration);
				}
		}
	}

	function onTimeUpdate() {
		if (!video) return;
		currentTime = video.currentTime;
		if (Math.floor(video.currentTime) % 5 === 0) player.remember(file.id, video.currentTime);
	}

	function showControls() {
		controlsVisible = true;
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (!video?.paused) controlsVisible = false;
		}, 2600);
	}

	async function copy(text, label) {
		try {
			await navigator.clipboard.writeText(text);
			toasts.success(`${label} copied`);
		} catch {
			toasts.error('Could not copy — your browser blocked clipboard access');
		}
	}

	async function share() {
		const res = await fetch(`/api/files/${file.id}/shares`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ days: 7 })
		});
		if (!res.ok) return toasts.error('Could not create a share link');
		const { share: created } = await res.json();
		await copy(`${location.origin}${created.url}`, 'Share link');
		await invalidateAll();
	}

	const absolute = (path) => (typeof location === 'undefined' ? path : `${location.origin}${path}`);
	const progressPercent = $derived(duration ? (currentTime / duration) * 100 : 0);
</script>

<svelte:window onkeydown={onKey} />

<div class="flex h-screen overflow-hidden bg-paper">
	<!-- queue -->
	{#if playlistOpen}
		<aside class="hidden w-[280px] shrink-0 flex-col border-r border-rule bg-paper-2/60 lg:flex">
			<div class="flex h-16 items-center justify-between px-4">
				<a href="/drive"><Logo size={26} textClass="text-[1.08rem]" /></a>
				<button class="icon-btn h-7 w-7" title="Hide queue" onclick={() => (playlistOpen = false)}>
					<ArrowLeft size={13} />
				</button>
			</div>
			<div class="px-4 pb-2">
				<p class="text-[11.5px] font-medium text-ink-3">Up next · {player.items.length} playable</p>
			</div>
			<div class="flex-1 overflow-y-auto px-2 pb-4">
				{#each player.items as item, i (item.id)}
					<button
						class="mb-0.5 flex w-full items-start gap-2.5 rounded-[9px] px-2 py-2 text-left transition-colors {i ===
						player.index
							? 'bg-accent/12'
							: 'hover:bg-paper-3'}"
						onclick={() => player.select(item.id)}
					>
						<span class="mt-0.5 text-[11px] text-ink-3 num">{String(i + 1).padStart(2, '0')}</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-[12.5px] {i === player.index ? 'text-accent' : 'text-ink'}">
								{item.name}
							</span>
							<span class="mt-0.5 block text-[11px] text-ink-3">
								{item.kind === 'video' ? 'Video' : item.kind === 'audio' ? 'Audio' : 'Image'} · {formatBytes(item.size)}
							</span>
						</span>
					</button>
				{/each}
			</div>
		</aside>
	{/if}

	<main class="flex min-w-0 flex-1 flex-col">
		<!-- header -->
		<header class="flex h-16 shrink-0 items-center gap-3 border-b border-rule bg-paper/85 px-4 backdrop-blur-md">
			<a href="/drive" class="icon-btn" title="Back to drive"><ArrowLeft size={15} /></a>
			{#if !playlistOpen}
				<button class="icon-btn hidden lg:grid" title="Show queue" onclick={() => (playlistOpen = true)}>
					<ListVideo size={15} />
				</button>
			{/if}
			<div class="min-w-0 flex-1">
				<h1 class="truncate text-[13.5px] font-medium text-ink">{file?.name}</h1>
				<p class="truncate text-[11.5px] text-ink-3">
					{formatBytes(file?.size ?? 0)} · {formatDate(file?.createdAt)} · {data.parts} stored piece{data.parts === 1
						? ''
						: 's'}
				</p>
			</div>

			<div class="flex shrink-0 items-center gap-1">
				<button
					class="icon-btn"
					title="Copy Telegram link"
					onclick={() =>
						telegramLink
							? copy(telegramLink, 'Telegram link')
							: toasts.error('This file has no public Telegram link — add the bot as a channel admin first')}
				>
					<Send size={14} class={telegramLink ? '' : 'opacity-40'} />
				</button>
				<button class="icon-btn" title="Copy share link" onclick={share}><Link2 size={14} /></button>
				<a class="icon-btn" title="Download" href={`/api/files/${file?.id}/download`}><Download size={14} /></a>
				<button
					class="icon-btn"
					title="More"
					onclick={(e) => {
						e.stopPropagation();
						menuOpen = !menuOpen;
					}}
				>
					<MoreHorizontal size={15} />
				</button>
				<div class="hidden lg:block"><ThemeToggle compact /></div>
			</div>

			{#if menuOpen}
				<div class="fixed inset-0 z-30" onclick={() => (menuOpen = false)} role="presentation"></div>
				<FileMenu file={file} onClose={() => (menuOpen = false)} />
			{/if}
		</header>

		<!-- the player -->
		<div
			class="relative flex flex-1 items-center justify-center overflow-hidden bg-ink"
			bind:this={shell}
			role="region"
			aria-label="Media player"
			onmousemove={showControls}
		>
			{#if file?.kind === 'image'}
				<img src={src} alt={file.name} class="max-h-full max-w-full object-contain" />
			{:else}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					bind:this={video}
					src={src}
					class="max-h-full w-full {isAudio ? 'hidden' : 'object-contain'}"
					playsinline
					preload="metadata"
					onloadedmetadata={onLoadedMetadata}
					ontimeupdate={onTimeUpdate}
					onplay={() => ((playing = true), showControls())}
					onpause={() => ((playing = false), (controlsVisible = true))}
					onended={() => {
						player.remember(file.id, 0);
						skip(1);
					}}
				></video>
			{/if}

			{#if isAudio}
				<div class="flex flex-col items-center gap-3 px-8 text-center">
					<div class="grid h-24 w-24 place-items-center rounded-full bg-accent/20 text-accent">
						<Play size={28} />
					</div>
					<p class="max-w-md truncate text-[15px] text-paper">{file.name}</p>
					<p class="text-[12px] text-paper/50">Audio · {formatBytes(file.size)}</p>
				</div>
			{/if}

			{#if file?.kind !== 'image'}
				<!-- controls -->
				<div
					class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-14 transition-opacity duration-200 {controlsVisible
						? 'opacity-100'
						: 'pointer-events-none opacity-0'}"
				>
					<!-- seek bar -->
					<div class="group relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/20">
						<div class="absolute inset-y-0 left-0 rounded-full bg-accent" style="width:{progressPercent}%"></div>
						<input
							type="range"
							min="0"
							max={duration || 0}
							step="0.1"
							value={currentTime}
							oninput={(e) => seekTo(Number(e.target.value))}
							aria-label="Seek"
							class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						/>
					</div>

					<div class="flex items-center gap-2 text-paper">
						<button class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white" onclick={() => skip(-1)} title="Previous (p)">
							<SkipBack size={16} />
						</button>
						<button
							class="grid h-9 w-9 place-items-center rounded-full bg-white text-ink transition hover:scale-105"
							onclick={toggle}
							title="Play or pause (space)"
						>
							{#if playing}<Pause size={16} fill="currentColor" />{:else}<Play size={16} fill="currentColor" />{/if}
						</button>
						<button class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white" onclick={() => skip(1)} title="Next (n)">
							<SkipForward size={16} />
						</button>

						<span class="ml-1 text-[11.5px] text-paper/70 num">
							{formatTime(currentTime)} / {formatTime(duration)}
						</span>

						<div class="ml-auto flex items-center gap-1">
							<button class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white" onclick={() => nudge(-10)} title="Back 10 seconds">
								<RotateCcw size={14} />
							</button>

							<button class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white" onclick={toggleMute} title="Mute (m)">
								{#if muted || volume === 0}<VolumeX size={15} />{:else}<Volume2 size={15} />{/if}
							</button>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={muted ? 0 : volume}
								oninput={(e) => setVolume(Number(e.target.value))}
								aria-label="Volume"
								class="hidden w-20 cursor-pointer accent-[var(--thread)] sm:block"
							/>

							<button
								class="ml-1 rounded-[7px] px-2 py-1 text-[11.5px] text-paper/80 transition hover:bg-white/10 hover:text-white"
								onclick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
								title="Playback speed"
							>
								{rate}×
							</button>

							<button
								onclick={() => (player.loop = !player.loop)}
								class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white {player.loop ? 'bg-white/10' : ''}"
								title="Loop the queue"
							>
								<Repeat size={14} />
							</button>

							<button class="icon-btn text-paper/80 hover:bg-white/10 hover:text-white" onclick={toggleFullscreen} title="Fullscreen (f)">
								{#if fullscreen}<Minimize size={15} />{:else}<Maximize size={15} />{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- links strip -->
		<footer class="shrink-0 border-t border-rule bg-paper-2/60 px-4 py-3">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11.5px] text-ink-3">Links</span>

				<button
					class="flex items-center gap-1.5 rounded-[8px] bg-paper-3 px-2.5 py-1.5 text-[11.5px] text-ink-2 transition hover:text-ink disabled:opacity-40"
					disabled={!telegramLink}
					onclick={() => copy(telegramLink, 'Telegram link')}
					title={telegramLink || 'No public Telegram link for this file'}
				>
					<Copy size={11} /> Telegram
				</button>

				{#if shareLink}
					<button
						class="flex items-center gap-1.5 rounded-[8px] bg-paper-3 px-2.5 py-1.5 text-[11.5px] text-ink-2 transition hover:text-ink"
						onclick={() => copy(absolute(shareLink), 'TeleDrive link')}
					>
						<Copy size={11} /> TeleDrive
					</button>
					<a
						class="flex items-center gap-1 text-[11.5px] text-accent hover:underline"
						href={shareLink}
						target="_blank"
						rel="noreferrer"
					>
						open
					</a>
				{:else}
					<button
						class="flex items-center gap-1.5 rounded-[8px] bg-paper-3 px-2.5 py-1.5 text-[11.5px] text-ink-3 transition hover:text-ink"
						onclick={share}
					>
						<Link2 size={11} /> Create a link
					</button>
				{/if}

				<p class="ml-auto hidden text-[11px] text-ink-3 sm:block">
					Space plays · ← → seek · ↑ ↓ volume · f fullscreen · 1–9 jump
				</p>
			</div>
		</footer>
	</main>
</div>
