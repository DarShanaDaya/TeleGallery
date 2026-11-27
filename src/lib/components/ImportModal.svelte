<script>
	import { drive } from '#lib/drive.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { invalidateAll } from '$app/navigation';
	import { Link2, X, LoaderCircle, CheckCircle2 } from 'lucide-svelte';

	let link = $state('');
	let chatId = $state('');
	let busy = $state(false);
	let error = $state('');
	let destinations = $state([]);
	let importing = $state(false);

	const open = $derived(drive.importOpen);

	$effect(() => {
		if (!open) return;
		error = '';
		fetch('/api/import')
			.then((r) => r.json())
			.then((data) => {
				destinations = data.destinations || [];
				if (!chatId && destinations.length) chatId = destinations[0].chatId;
			})
			.catch(() => {
				/* destinations are optional; the server falls back to the storage chat */
			});
	});

	async function submit() {
		if (!link.trim()) {
			error = 'Paste a Telegram post link first.';
			return;
		}
		busy = true;
		error = '';
		try {
			const res = await fetch('/api/import', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ link: link.trim(), chatId })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'The import did not work');
			toasts.success(data.duplicate ? 'That post is already in your drive' : `${data.file.name} imported`);
			importing = true;
			await invalidateAll();
			setTimeout(() => {
				drive.importOpen = false;
				importing = false;
				link = '';
			}, 700);
		} catch (err) {
			error = err.message;
		} finally {
			busy = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]"
		role="presentation"
		onclick={() => (drive.importOpen = false)}
	>
		<form
			class="rise w-full max-w-lg rounded-[14px] border border-rule bg-paper-2 p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onsubmit={(e) => {
				e.preventDefault();
				submit();
			}}
			role="presentation"
		>
			<div class="flex items-start justify-between">
				<div>
					<h2 class="display text-[1.35rem] text-ink">Add from Telegram</h2>
					<p class="mt-1 text-[12.5px] leading-relaxed text-ink-3">
						Paste a link to a post that has a file in it. The file is copied in place — nothing is re-uploaded.
					</p>
				</div>
				<button type="button" class="icon-btn h-7 w-7" onclick={() => (drive.importOpen = false)} aria-label="Close">
					<X size={14} />
				</button>
			</div>

			<label class="mt-5 block text-[12.5px] font-medium text-ink" for="import-link">Post link</label>
			<div class="relative mt-1.5">
				<Link2 size={13} class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
				<input
					id="import-link"
					class="input pl-8"
					bind:value={link}
					placeholder="https://t.me/yourchannel/123"
					autocomplete="off"
					spellcheck="false"
				/>
			</div>
			<p class="mt-1.5 text-[11.5px] text-ink-3">
				Works with channel posts (t.me/name/123) and private posts (t.me/c/1234…/123) that the bot can read.
			</p>

			{#if destinations.length > 1}
				<label class="mt-4 block text-[12.5px] font-medium text-ink" for="import-chat">Store it in</label>
				<select id="import-chat" class="input mt-1.5" bind:value={chatId}>
					{#each destinations as destination (destination.chatId)}
						<option value={destination.chatId}>{destination.title || destination.chatId}</option>
					{/each}
				</select>
			{/if}

			{#if error}
				<p class="mt-4 rounded-[10px] border-l-2 border-danger bg-danger/8 px-3 py-2 text-[12.5px] leading-relaxed text-danger">
					{error}
				</p>
			{/if}

			{#if importing}
				<p class="mt-4 flex items-center gap-2 text-[12.5px] text-success">
					<CheckCircle2 size={14} /> Copied into your drive.
				</p>
			{/if}

			<div class="mt-6 flex items-center justify-between gap-3">
				<p class="text-[11.5px] leading-relaxed text-ink-3">
					Needs the bot to be a member or admin of the source chat.
				</p>
				<div class="flex shrink-0 gap-2">
					<button type="button" class="btn btn-quiet" onclick={() => (drive.importOpen = false)}>Cancel</button>
					<button type="submit" class="btn btn-primary" disabled={busy}>
						{#if busy}<LoaderCircle size={13} class="animate-spin" />{:else}<Link2 size={13} />{/if}
						Import
					</button>
				</div>
			</div>
		</form>
	</div>
{/if}
