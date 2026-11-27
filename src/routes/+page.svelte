<script>
	import Logo from '#lib/components/Logo.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { formatBytes } from '#lib/format.js';
	import { ArrowRight, ShieldCheck, Infinity as InfinityMark } from 'lucide-svelte';

	let { data } = $props();

	// Real numbers, not invented ones — these describe how the thing works.
	const facts = [
		{ figure: '∞', label: 'Storage ceiling', note: 'the limit is your Telegram account, not a plan' },
		{ figure: '45 MB', label: 'Chunk size', note: 'each slice becomes one Telegram document' },
		{ figure: '2 GB', label: 'Largest file', note: '4 GB on a Premium account' },
		{ figure: '0', label: 'Files on our servers', note: 'chunks are streamed through, never kept' }
	];

	const steps = [
		{
			title: 'You sign in with Telegram',
			body: 'One tap. Telegram hands us a signed payload, we check the signature, and that is your account. There is no password to make up or lose.'
		},
		{
			title: 'Files go into your chat',
			body: 'An upload is cut into 45 MB pieces and sent to your private storage chat as documents. We keep only the message references — the file itself is Telegram’s problem now.'
		},
		{
			title: 'Downloads are stitched as you watch',
			body: 'When you open or download something, the pieces are pulled in order and streamed straight to you. Video seeks work, because the server answers range requests piece by piece.'
		}
	];

	const questions = [
		{
			q: 'Where do my files actually live?',
			a: 'In a private Telegram chat with your storage bot, as ordinary documents. Your photos and video are not re-uploaded anywhere else.'
		},
		{
			q: 'What happens if I delete the app?',
			a: 'Your files are still in Telegram. The database only stores names, sizes and message references, so a backup of one folder is enough to rebuild the drive.'
		},
		{
			q: 'Can I share a single file?',
			a: 'Yes. Create a link with an optional expiry, send it to anyone, and revoke it whenever you like. Whoever holds the link can stream the file without an account.'
		},
		{
			q: 'Why is there a 2 GB limit?',
			a: 'That is Telegram’s per-file ceiling for a free account, not ours. Run your own Telegram Bot API server and the practical limit becomes the 2 GB single-document cap with no download ceiling.'
		},
		{
			q: 'Is this really self-hostable?',
			a: 'It ships as a Docker image. One volume for the database, five environment variables, and it runs anywhere you can run a container.'
		}
	];

	let open = $state(0);
</script>

<div class="min-h-screen">
	<header class="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur-md">
		<div class="mx-auto flex h-16 w-full max-w-[72rem] items-center justify-between px-5 sm:px-8">
			<a href="/" aria-label="TeleDrive home"><Logo /></a>
			<nav class="hidden items-center gap-8 md:flex">
				<a href="#how" class="text-[13.5px] text-ink-2 transition-colors hover:text-ink">How it works</a>
				<a href="#questions" class="text-[13.5px] text-ink-2 transition-colors hover:text-ink">Questions</a>
				<a href="https://core.telegram.org/bots/api" class="text-[13.5px] text-ink-2 transition-colors hover:text-ink" rel="noreferrer" target="_blank">The API</a>
			</nav>
			<div class="flex items-center gap-2">
				<ThemeToggle />
				<a href="/login" class="btn btn-primary">Log in</a>
			</div>
		</div>
	</header>

	<main>
		<!-- hero: the claim, then the seam -->
		<section class="mx-auto w-full max-w-[72rem] px-5 pb-14 pt-14 sm:px-8 sm:pt-20">
			<div class="grid items-start gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
				<div>
					<p class="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[12.5px] font-medium text-accent">
						<InfinityMark size={13} strokeWidth={2} />
						Unlimited storage, paid for already
					</p>

					<h1 class="display mt-6 text-[clamp(2.9rem,6.4vw,4.6rem)] text-ink">
						Your files, kept in a chat you already have.
					</h1>

					<p class="mt-6 max-w-[34rem] text-[15.5px] leading-[1.65] text-ink-2">
						TeleDrive turns a Telegram conversation into a proper drive. Folders, previews, share links,
						trash that restores — over storage you are not paying for separately.
					</p>

					<div class="mt-8 flex flex-wrap items-center gap-3">
						<a href="/login" class="btn btn-primary px-5 py-3 text-[14px]">
							Log in with Telegram
							<ArrowRight size={15} strokeWidth={2} />
						</a>
						<a href="#how" class="btn btn-ghost px-5 py-3 text-[14px]">See how it works</a>
					</div>

					<p class="mt-6 flex items-center gap-2 text-[12.5px] text-ink-3">
						<ShieldCheck size={14} class="text-success" strokeWidth={2} />
						No card, no quota, and nothing stored on our servers.
					</p>
				</div>

				<!-- the one bold device: a seam with two labels and files hanging from it -->
				<figure class="relative">
					<div class="card overflow-hidden p-5 sm:p-6">
						<div class="flex items-baseline justify-between">
							<p class="text-[13px] font-medium text-ink">Your Telegram chat</p>
							<p class="meta num">3 documents, 1 file</p>
						</div>

						<div class="seam-list mt-4 pl-7">
							<span class="seam-draw absolute left-[22px] top-0 h-full border-l border-dashed border-accent/60" aria-hidden="true"></span>
							{#each [{ n: 'holiday-04.mp4', s: '45 MB', part: 'part 1' }, { n: 'holiday-04.mp4', s: '45 MB', part: 'part 2' }, { n: 'holiday-04.mp4', s: '12.4 MB', part: 'part 3' }, { n: 'notes.md', s: '4 KB', part: '' }] as chunk, i}
								<div class="relative flex items-center gap-3 py-[7px]">
									<span
										class="absolute -left-7 grid h-[15px] w-[15px] place-items-center rounded-full border-2 border-paper bg-accent"
										aria-hidden="true"
									></span>
									<span class="truncate text-[12.5px] text-ink-2">{chunk.n}</span>
									<span class="ml-auto shrink-0 text-[11.5px] text-ink-3 num">{chunk.s}</span>
								</div>
							{/each}
						</div>

						<div class="mt-5 flex items-baseline justify-between border-t border-rule pt-4">
							<p class="text-[13px] font-medium text-ink">Your drive</p>
							<p class="meta">one file, stitched back together</p>
						</div>
						<div class="mt-3 flex items-center gap-3 rounded-[10px] bg-paper-3 px-3 py-2.5">
							<span class="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M8 5.5v13M8 5.5l-3 3M8 5.5l3 3" stroke-linecap="round" stroke-linejoin="round" />
									<path d="M16 18.5v-13M16 18.5l-3-3M16 18.5l3-3" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</span>
							<span class="text-[12.5px] text-ink">holiday-04.mp4</span>
							<span class="ml-auto text-[11.5px] text-ink-3 num">102.4 MB</span>
						</div>
					</div>
					<figcaption class="mt-3 px-1 text-[12px] leading-relaxed text-ink-3">
						A large file is several documents in Telegram. TeleDrive reassembles them as you download.
					</figcaption>
				</figure>
			</div>
		</section>

		<!-- facts, as a four-up band rather than cards -->
		<section class="border-y border-rule bg-paper-2">
			<div class="mx-auto grid w-full max-w-[72rem] grid-cols-2 gap-y-8 px-5 py-9 sm:px-8 lg:grid-cols-4">
				{#each facts as fact, i}
					<div class="px-0 lg:px-6 {i > 0 ? 'lg:border-l lg:border-rule' : ''} {i === 0 ? 'lg:pl-0' : ''}">
						<p class="display text-[2rem] leading-none text-ink">{fact.figure}</p>
						<p class="mt-2 text-[12.5px] font-medium text-ink">{fact.label}</p>
						<p class="mt-1 max-w-[15rem] text-[12px] leading-relaxed text-ink-3">{fact.note}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- how it works: a real sequence, so the numbers stay -->
		<section id="how" class="mx-auto w-full max-w-[72rem] px-5 py-20 sm:px-8">
			<div class="max-w-[38rem]">
				<h2 class="display text-[clamp(1.9rem,3.6vw,2.7rem)] text-ink">Three things happen, in this order</h2>
				<p class="mt-4 text-[15px] leading-[1.65] text-ink-2">
					Everything else in the product is a variation on these three steps.
				</p>
			</div>

			<ol class="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
				{#each steps as step, i}
					<li class="relative">
						<div class="flex items-center gap-3">
							<span class="grid h-8 w-8 place-items-center rounded-full bg-accent text-[13px] font-semibold text-white num">
								{i + 1}
							</span>
							{#if i < steps.length - 1}
								<span class="hidden h-px flex-1 border-t border-dashed border-line-strong md:block" aria-hidden="true"></span>
							{/if}
						</div>
						<h3 class="mt-4 text-[15.5px] font-semibold text-ink">{step.title}</h3>
						<p class="mt-2 text-[13.5px] leading-[1.7] text-ink-2">{step.body}</p>
					</li>
				{/each}
			</ol>

			<div class="mt-14 rounded-[14px] bg-ink px-5 py-5 text-paper sm:px-6">
				<p class="text-[12.5px] text-paper/60">Run it yourself</p>
				<pre class="mt-2 overflow-x-auto text-[12.5px] leading-relaxed"><code>docker compose up -d --build</code></pre>
			</div>
		</section>

		<!-- questions: an accordion, because only one answer is needed at a time -->
		<section id="questions" class="border-t border-rule bg-paper-2">
			<div class="mx-auto grid w-full max-w-[72rem] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
				<div>
					<h2 class="display text-[clamp(1.9rem,3.6vw,2.7rem)] text-ink">Fair questions</h2>
					<p class="mt-4 max-w-[22rem] text-[14px] leading-[1.7] text-ink-2">
						If something here is unclear, it is a documentation bug — tell us and it gets fixed.
					</p>
				</div>

				<div class="divide-y divide-rule border-y border-rule">
					{#each questions as item, i}
						<div>
							<button
								class="flex w-full items-center justify-between gap-4 py-4 text-left"
								onclick={() => (open = open === i ? -1 : i)}
								aria-expanded={open === i}
							>
								<span class="text-[14.5px] font-medium text-ink">{item.q}</span>
								<span class="shrink-0 text-ink-3 transition-transform duration-200" class:rotate-45={open === i}>
									<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8">
										<path d="M8 2.5v11M2.5 8h11" stroke-linecap="round" />
									</svg>
								</span>
							</button>
							{#if open === i}
								<p class="max-w-[36rem] pb-5 text-[13.5px] leading-[1.75] text-ink-2 rise">{item.a}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- closing -->
		<section class="mx-auto w-full max-w-[72rem] px-5 py-20 sm:px-8">
			<div class="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
				<h2 class="display max-w-[26rem] text-[clamp(2rem,4vw,3rem)] text-ink">
					Open your drive and put something in it.
				</h2>
				<div class="flex flex-col items-start gap-3">
					<a href="/login" class="btn btn-primary px-6 py-3.5 text-[14px]">
						Log in with Telegram
						<ArrowRight size={16} strokeWidth={2} />
					</a>
					<p class="text-[12.5px] text-ink-3">Takes about ten seconds, and your first upload is instant.</p>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-rule">
		<div class="mx-auto flex w-full max-w-[72rem] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
			<Logo size={26} textClass="text-[1.1rem]" />
			<p class="text-[12.5px] text-ink-3">
				© {new Date().getFullYear()} {data.siteName} · a Node project, packaged as one container
			</p>
		</div>
	</footer>
</div>
