<script>
	import { drive, api } from '#lib/drive.svelte.js';
	import { toasts } from '#lib/toast.svelte.js';
	import { X, Link2, Copy, Trash2, ExternalLink, LoaderCircle } from 'lucide-svelte';

	const file = $derived(drive.share);
	let links = $state([]);
	let loading = $state(true);
	let creating = $state(false);
	let days = $state(7);
	let mode = $state('anyone');
	let copied = $state('');

	function absolute(url) {
		return typeof location === 'undefined' ? url : `${location.origin}${url}`;
	}

	async function load() {
		if (!file) return;
		loading = true;
		try {
			const res = await fetch(`/api/files/${file.id}/shares`);
			links = (await res.json()).shares || [];
		} catch {
			toasts.error('Could not load links');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (file) load();
	});

	async function create() {
		creating = true;
		try {
			const { share } = await api(`/api/files/${file.id}/shares`, {
				method: 'POST',
				body: JSON.stringify({ days: Number(days), mode })
			});
			links = [share, ...links];
			toasts.success('Link created');
		} catch (err) {
			toasts.error(err.message);
		} finally {
			creating = false;
		}
	}

	async function copy(url, id) {
		await navigator.clipboard.writeText(absolute(url));
		copied = id;
		toasts.success('Link copied');
		setTimeout(() => (copied = ''), 1500);
	}

    async function decide(link, request, status) {
        try {
            await api(`/api/files/${file.id}/shares`, { method: 'PATCH', body: JSON.stringify({shareId: link.id, userId: request.userId, status}) });
            await load();
        } catch (err) { toasts.error(err.message); }
    }

	async function revoke(link) {
		try {
			await api(`/api/files/${file.id}/shares?shareId=${link.id}`, { method: 'DELETE' });
			links = links.filter((l) => l.id !== link.id);
			toasts.success('Link revoked');
		} catch (err) {
			toasts.error(err.message);
		}
	}
</script>

{#if file}
	<div
		class="fixed inset-0 z-[70] grid place-items-center bg-ink/25 p-4 backdrop-blur-[2px]"
		role="presentation"
		onclick={() => (drive.share = null)}
	>
		<div
			class="rise w-full max-w-lg border border-rule bg-paper-2 shadow-[0_30px_70px_-40px_rgba(25,23,18,0.6)]"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<div class="flex items-start justify-between border-b border-rule px-5 py-3">
				<div class="min-w-0">
					<h2 class="truncate font-display text-lg text-ink">Share “{file.name}”</h2>
					<p class="mt-0.5 text-[11.5px] text-ink-3">Choose who can access this link</p>
				</div>
				<button class="icon-btn h-7 w-7" onclick={() => (drive.share = null)}><X size={13} /></button>
			</div>

			<div class="border-b border-rule px-5 py-4">
				<div class="flex flex-wrap items-end gap-2">
					<label class="flex-1">
                        <span class="text-[11.5px] font-medium text-ink-3">Access</span>
                        <select class="input mt-1.5 h-9" bind:value={mode}>
                            <option value="anyone">Anyone with link</option>
                            <option value="approval">Approval required</option>
                        </select>
                    </label>
                    <label class="flex-1">
						<span class="text-[11.5px] font-medium text-ink-3">Expires</span>
						<select class="input mt-1.5 h-9" bind:value={days}>
							<option value={0}>Never</option>
							<option value={1}>In 1 day</option>
							<option value={7}>In 7 days</option>
							<option value={30}>In 30 days</option>
						</select>
					</label>
					<button class="btn btn-primary h-9" onclick={create} disabled={creating}>
						{#if creating}
							<LoaderCircle size={13} class="animate-[spin_1s_linear_infinite]" />
						{:else}
							<Link2 size={13} />
						{/if}
						Create link
					</button>
				</div>
			</div>

			<div class="max-h-64 overflow-y-auto">
				{#if loading}
					<div class="grid place-items-center py-10 text-ink-3">
						<LoaderCircle size={16} class="animate-[spin_1s_linear_infinite]" />
					</div>
				{:else if !links.length}
					<p class="px-5 py-8 text-center text-[12.5px] leading-6 text-ink-3">
						No links yet. Create one and paste it anywhere.
					</p>
				{:else}
					{#each links as link (link.id)}
						<div class="flex items-center gap-2 border-b border-rule px-5 py-2.5 last:border-0">
							<div class="min-w-0 flex-1">
								<p class="truncate text-[11.5px] text-ink-2">{absolute(link.url)}</p>
								<p class="mt-0.5 text-[11.5px] text-ink-3">
									{#if !link.active}
										<span class="text-danger">expired</span>
									{:else if link.expiresAt}
										expires {new Date(link.expiresAt).toLocaleDateString()}
									{:else}
										never expires
									{/if}
									· {link.mode === 'approval' ? 'Approval required' : 'Anyone with link'} · {link.views} open{link.views === 1 ? '' : 's'}
								</p>
							</div>
							<button class="icon-btn h-7 w-7" title="Copy link" onclick={() => copy(link.url, link.id)}>
								<Copy size={12} class={copied === link.id ? 'text-success' : ''} />
							</button>
							<a class="icon-btn h-7 w-7" href={link.url} target="_blank" rel="noreferrer" title="Open">
								<ExternalLink size={12} />
							</a>
							<button class="icon-btn h-7 w-7" title="Revoke" onclick={() => revoke(link)}>
								<Trash2 size={12} class="text-danger" />
							</button>
                        </div>
                        {#each link.requests || [] as request (request.userId)}
                          <div class="flex items-center gap-2 px-5 py-2 text-xs border-b border-rule">
                            <span class="flex-1">{request.firstName || request.username || 'User'} {request.lastName || ''} {request.username ? `(@${request.username})` : ''} — {request.status}</span>
                            {#if request.status !== 'approved'}<button class="btn btn-primary" onclick={() => decide(link, request, 'approved')}>Approve</button>{/if}
                            {#if request.status !== 'denied'}<button class="btn btn-ghost" onclick={() => decide(link, request, 'denied')}>{request.status === 'approved' ? 'Remove access' : 'Deny'}</button>{/if}
                          </div>
                        {/each}
					{/each}
				{/if}
			</div>

			<p class="border-t border-rule px-5 py-2.5 text-[11px] leading-5 text-ink-3">
				Approval links require a signed-in account. Revoke a link to remove access immediately.
			</p>
		</div>
	</div>
{/if}
