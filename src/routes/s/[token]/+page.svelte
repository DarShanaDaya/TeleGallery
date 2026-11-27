<script>
	import Logo from '#lib/components/Logo.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { formatBytes, formatDate } from '#lib/format.js';
	import { Download, FileQuestion, Lock, Copy, Check } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	let requestError = $state('');
	async function requestAccess() { const res = await fetch(`/s/${data.token}/request`, { method: 'POST' }); if (res.ok) await invalidateAll(); else requestError = 'Could not send request'; }

	let { data } = $props();
	let copied = $state(false);

	const file = $derived(data.file);

	async function copyLink() {
		await navigator.clipboard.writeText(location.href);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="min-h-screen">
	<header class="border-b border-rule">
		<div class="mx-auto flex h-14 w-full max-w-[64rem] items-center justify-between px-5">
			<a href="/"><Logo size={26} textClass="text-lg" /></a>
			<div class="flex items-center gap-2">
				<ThemeToggle compact />
				<a href="/login" class="btn btn-ghost h-8 px-3 text-[12px]">Sign in</a>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-[64rem] px-5 py-8">
		{#if data.access === 'signin' || data.access === 'request' || data.access === 'pending' || data.access === 'denied'}
            <div class="border border-rule bg-paper-2 px-6 py-16 text-center">
                <h1 class="font-display text-2xl">Access requires approval</h1>
                {#if data.access === 'signin'}
                    <p class="mt-3">Sign in to request access from the owner.</p>
                    <a class="btn btn-primary mt-5" href={`/login?next=${encodeURIComponent(`/s/${data.token}`)}`}>Sign in</a>
                {:else if data.access === 'pending'}<p class="mt-3">Your request is waiting for the owner.</p>
                {:else}<p class="mt-3">{data.access === 'denied' ? 'Your request was denied or access was removed.' : 'Ask the owner for access.'}</p><button class="btn btn-primary mt-5" onclick={requestAccess}>Request access</button>{/if}
                {#if requestError}<p class="text-danger">{requestError}</p>{/if}
            </div>
        {:else if !file}
			<div class="border border-dashed border-rule-strong bg-paper-2/40 px-6 py-16 text-center">
				<FileQuestion size={22} strokeWidth={1.3} class="mx-auto text-ink-3" />
				<h1 class="mt-4 font-display text-2xl text-ink">This link has expired</h1>
				<p class="mx-auto mt-2 max-w-[26rem] text-[13px] leading-6 text-ink-2">
					The file was removed, or the person who shared it revoked the link.
				</p>
				<a href="/" class="btn btn-ghost mt-6">Go to TeleDrive</a>
			</div>
		{:else}
			<div class="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
				<div class="min-w-0">
					<p class="text-[11.5px] font-medium text-ink-3">Shared file</p>
					<h1 class="mt-1.5 truncate font-display text-3xl leading-tight text-ink">{file.name}</h1>
					<p class="text-[11.5px] text-ink-3 mt-1.5">
						{formatBytes(file.size)} · {formatDate(file.createdAt)}
						{#if data.expiresAt}· link expires {formatDate(data.expiresAt)}{/if}
					</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<button class="btn btn-ghost h-9 px-3 text-[12px]" onclick={copyLink}>
						{#if copied}<Check size={13} class="text-success" />{:else}<Copy size={13} />{/if}
						{copied ? 'Copied' : 'Copy link'}
					</button>
					{#if file.kind !== 'folder'}<a class="btn btn-primary h-9 px-3 text-[12px]" href={data.download} download={file.name}>
						<Download size={13} /> Download
					</a>{/if}
				</div>
			</div>

			<div class="mt-5">
				{#if file.kind === 'folder'}
                    <a class="text-accent text-sm" href={`/s/${data.token}`}>Shared folder root</a>
                    {#each data.children as child}
                        <a class="block border-b border-rule py-3" href={child.kind === 'folder' ? `/s/${data.token}?item=${encodeURIComponent(child.id)}` : `/s/${data.token}/file?item=${encodeURIComponent(child.id)}`}>
                            {child.kind === 'folder' ? '📁' : '📄'} {child.name}
                        </a>
                    {:else}<p class="py-4 text-ink-3">This folder is empty.</p>{/each}
                {:else if file.kind === 'image'}
					<img
						src={data.src}
						alt={file.name}
						class="mx-auto max-h-[70vh] max-w-full border border-rule object-contain"
					/>
				{:else if file.kind === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						src={data.src}
						controls
						playsinline
						preload="metadata"
						class="mx-auto max-h-[70vh] w-full border border-rule bg-black"
					></video>
				{:else if file.kind === 'audio'}
					<div class="mx-auto max-w-md border border-rule bg-paper-2 p-6">
						<audio src={data.src} controls class="w-full"></audio>
					</div>
				{:else if file.kind === 'pdf'}
					<iframe
						src={data.src}
						title={file.name}
						class="h-[75vh] w-full border border-rule bg-white"
					></iframe>
				{:else}
					<div class="border border-rule bg-paper-2 px-6 py-12 text-center">
						<p class="text-[11.5px] font-medium text-ink-3">No inline preview</p>
						<p class="mx-auto mt-2 max-w-[24rem] text-[13px] leading-6 text-ink-2">
							This file type can’t be shown in the browser. Use the download button above.
						</p>
					</div>
				{/if}
			</div>

			<p class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-ink-3">
				<Lock size={10} /> Streamed from the owner’s Telegram storage
			</p>
		{/if}
	</main>
</div>
