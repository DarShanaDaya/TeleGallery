<script>
	import Logo from '#lib/components/Logo.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { formatBytes } from '#lib/format.js';
	import { ArrowUpRight, Plus, Minus, ArrowRight } from 'lucide-svelte';

	let { data } = $props();

	const stats = [
		{ k: 'Storage ceiling', v: '∞', note: 'no tiers, no metering' },
		{ k: 'Cost per month', v: '0', note: 'you already pay for Telegram' },
		{ k: 'Chunk size', v: '45 MB', note: 'reassembled on download' },
		{ k: 'Session', v: '30 d', note: 'httpOnly, server-side' }
	];

	const rows = [
		{
			n: '01',
			title: 'Sign in, don’t sign up',
			body: 'The Telegram widget hands us a signed payload. We verify the HMAC against your bot token, mint a session, and that is the whole account system. No email, no password, no verification loop.',
			meta: 'auth'
		},
		{
			n: '02',
			title: 'Uploads become documents',
			body: 'A file is cut into 45 MB chunks, each sent to your private storage chat as a Telegram document. The index — chat id, message id, file id — lives in one SQLite table.',
			meta: 'write'
		},
		{
			n: '03',
			title: 'Downloads are stitched on the fly',
			body: 'Chunks are pulled in order, cached to disk once, and streamed back with Range support. Video seeks. Large files resume. Nothing is ever stored in full on the server.',
			meta: 'read'
		}
	];

	const faqs = [
		{
			q: 'Is the storage actually unlimited?',
			a: 'It is as unlimited as your Telegram account. You are not renting a bucket, so there is no plan to outgrow. Telegram Premium accounts can hold 4 GB per file; free accounts hold 2 GB.'
		},
		{
			q: 'Who can read my files?',
			a: 'Only your signed-in session. Files sit in a private chat between you and the storage bot, and every API route checks the session before touching a chunk.'
		},
		{
			q: 'What about the 50 MB Bot API limit?',
			a: 'Uploads are already chunked to 45 MB so they clear it. If you want to move files over 20 MB back out, run Telegram’s own Bot API server and point TELEGRAM_API_BASE at it — the limits become 2 GB with no download cap.'
		},
		{
			q: 'What happens when I delete something?',
			a: 'It goes to Trash and the Telegram messages are kept, so restore is instant. “Delete forever” removes the messages from Telegram too.'
		},
		{
			q: 'Can I run this myself?',
			a: 'Yes — it is a Node app. npm install, fill in three environment variables, npm run build, node build/index.js. SQLite and the blob cache live in ./data.'
		}
	];
</script>

<div class="min-h-screen">
	<!-- masthead -->
	<header class="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-sm">
		<div class="mx-auto flex h-14 w-full max-w-[76rem] items-center justify-between px-5 sm:px-8">
			<a href="/"><Logo /></a>
			<nav class="hidden items-center gap-7 md:flex">
				{#each [['Features', '#features'], ['How it works', '#how'], ['Questions', '#faq']] as [label, href]}
					<a
						href={href}
						class="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink"
					>
						{label}
					</a>
				{/each}
			</nav>
			<div class="flex items-center gap-2">
				<ThemeToggle />
				<a href="/login" class="btn btn-primary">
					Log in
					<ArrowRight size={14} strokeWidth={1.8} />
				</a>
			</div>
		</div>
	</header>

	<main>
		<!-- hero -->
		<section class="mx-auto w-full max-w-[76rem] px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
			<div class="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
				<div class="rise">
					<div class="flex flex-wrap items-center gap-3">
						<span class="tag">v1.0</span>
						<span class="tag">Node · SvelteKit</span>
						<span class="tag">Telegram storage</span>
					</div>

					<h1 class="display mt-7 text-[clamp(3rem,7.6vw,5.6rem)] text-ink">
						Your unlimited<br />
						personal <em class="italic">cloud</em><span class="text-accent">.</span>
					</h1>

					<p class="mt-7 max-w-[34rem] text-[15px] leading-7 text-ink-2">
						TeleDrive is a file manager with no storage bill. It keeps your documents, photos and video inside
						the Telegram account you already have, and gives you a proper drive to browse them.
					</p>

					<div class="mt-9 flex flex-wrap items-center gap-3">
						<a href="/login" class="btn btn-primary px-5 py-3 text-sm">
							Log in with Telegram
							<ArrowRight size={15} strokeWidth={1.8} />
						</a>
						<a href="#how" class="btn btn-ghost px-5 py-3 text-sm">How it works</a>
					</div>

					<p class="mt-6 font-mono text-[11px] leading-relaxed text-ink-3">
						No card. No quota. No files on our servers.
					</p>
				</div>

				<!-- the ledger card -->
				<aside class="rise self-start border border-rule bg-paper-2" style="animation-delay:.08s">
					<div class="flex items-center justify-between border-b border-rule px-4 py-2.5">
						<span class="label">Storage ledger</span>
						<span class="label text-ink-3">{new Date().getFullYear()}</span>
					</div>

					<dl class="divide-y divide-rule">
						{#each stats as s}
							<div class="flex items-baseline justify-between gap-4 px-4 py-3.5">
								<dt class="text-[13px] text-ink-2">{s.k}</dt>
								<dd class="text-right">
									<span class="font-display text-2xl leading-none text-ink">{s.v}</span>
									<span class="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
										{s.note}
									</span>
								</dd>
							</div>
						{/each}
					</dl>

					<div class="border-t border-rule px-4 py-3.5">
						<div class="flex items-center justify-between">
							<span class="label">Sample file · 212 MB</span>
							<span class="font-mono text-[10px] text-ink-3">5 chunks</span>
						</div>
						<div class="mt-2.5 flex gap-1">
							{#each Array(5) as _, i}
								<span
									class="h-5 flex-1 border border-rule-strong"
									style="background: {'var(--accent)'};opacity:{0.12 + i * 0.16}"
								></span>
							{/each}
						</div>
						<div class="mt-2 flex items-center justify-between font-mono text-[10px] text-ink-3">
							<span>doc 01</span><span>doc 05</span>
						</div>
					</div>

					<div class="flex items-center gap-2 border-t border-rule px-4 py-2.5">
						<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
						<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
							Bot connected · chat pinned
						</span>
					</div>
				</aside>
			</div>
		</section>

		<!-- figure strip -->
		<section class="border-y border-rule bg-paper-2/60">
			<div class="mx-auto grid w-full max-w-[76rem] grid-cols-2 divide-rule px-5 sm:grid-cols-4 sm:divide-x sm:px-8">
				{#each [{ v: '∞', k: 'files' }, { v: '45 MB', k: 'chunk ceiling' }, { v: '4 GB', k: 'per file, premium' }, { v: '0', k: 'third-party buckets' }] as f, i}
					<div class="px-0 py-6 sm:px-6 {i > 0 ? 'sm:pl-6' : 'sm:pl-0'} {i < 3 ? 'border-b border-rule sm:border-0' : ''}">
						<p class="font-display text-3xl leading-none text-ink">{f.v}</p>
						<p class="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{f.k}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- features -->
		<section id="features" class="mx-auto w-full max-w-[76rem] px-5 py-20 sm:px-8">
			<div class="grid gap-10 lg:grid-cols-[0.42fr_0.58fr]">
				<div>
					<span class="label">01 — The product</span>
					<h2 class="display mt-4 text-[clamp(2rem,3.6vw,2.9rem)] text-ink">
						Everything a drive needs.<br /><em class="italic">Nothing it doesn’t.</em>
					</h2>
					<p class="mt-5 max-w-[26rem] text-sm leading-7 text-ink-2">
						Folders, rename, move, star, trash, restore, search, grid and list views, inline preview. The
						unremarkable things, done carefully.
					</p>
				</div>

				<ul class="grid gap-x-10 gap-y-0 sm:grid-cols-2">
					{#each [['Unlimited', 'Chunks live in Telegram, so the ceiling is your account, not a plan.'], ['Private', 'A private chat with your bot. Every route checks your session first.'], ['Streaming', 'Chunked reads with Range support — video seeks and downloads resume.'], ['Portable', 'One SQLite file, one env file, one Node process. Run it anywhere.'], ['Honest UI', 'Hairline rules instead of card soup. Colour only when it means something.'], ['Dark by choice', 'A separately tuned dark palette, not an inverted light one.']] as [t, d], i}
						<li class="rule-top py-5 {i < 2 ? 'sm:border-t-0' : ''}">
							<div class="flex items-baseline gap-2">
								<span class="font-mono text-[10px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
								<h3 class="text-[15px] font-medium text-ink">{t}</h3>
							</div>
							<p class="mt-1.5 pl-6 text-[13px] leading-6 text-ink-2">{d}</p>
						</li>
					{/each}
				</ul>
			</div>
		</section>

		<!-- how it works -->
		<section id="how" class="border-y border-rule bg-paper-2/60">
			<div class="mx-auto w-full max-w-[76rem] px-5 py-20 sm:px-8">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<span class="label">02 — The mechanism</span>
						<h2 class="display mt-4 text-[clamp(2rem,3.6vw,2.9rem)] text-ink">Three moves, start to finish.</h2>
					</div>
					<p class="max-w-[22rem] text-[13px] leading-6 text-ink-3">
						The whole pipeline is a signed login, a chunked write, and an ordered read.
					</p>
				</div>

				<ol class="mt-10 grid gap-0 border-t border-rule md:grid-cols-3 md:divide-x md:divide-rule">
					{#each rows as r, i}
						<li class="border-b border-rule px-0 py-7 md:border-b-0 md:px-7 {i === 0 ? 'md:pl-0' : ''}">
							<div class="flex items-center justify-between">
								<span class="font-display text-4xl leading-none text-ink-3">{r.n}</span>
								<span class="tag">{r.meta}</span>
							</div>
							<h3 class="mt-4 text-[15px] font-medium text-ink">{r.title}</h3>
							<p class="mt-2 text-[13px] leading-6 text-ink-2">{r.body}</p>
						</li>
					{/each}
				</ol>

				<div class="mt-8 border border-rule bg-ink px-4 py-3.5 text-paper-2">
					<pre class="overflow-x-auto font-mono text-[11.5px] leading-relaxed"><span class="opacity-50">$</span> TELEGRAM_BOT_TOKEN=… TELEGRAM_BOT_USERNAME=… <span class="opacity-50">\</span>
  TELEGRAM_STORAGE_CHAT_ID=… npm run build && node build/index.js</pre>
				</div>
			</div>
		</section>

		<!-- faq -->
		<section id="faq" class="mx-auto w-full max-w-[76rem] px-5 py-20 sm:px-8">
			<div class="grid gap-10 lg:grid-cols-[0.42fr_0.58fr]">
				<div>
					<span class="label">03 — Questions</span>
					<h2 class="display mt-4 text-[clamp(2rem,3.6vw,2.9rem)] text-ink">Answered plainly.</h2>
				</div>
				<div class="border-t border-rule">
					{#each faqs as f, i}
						<details class="group border-b border-rule" open={i === 0}>
							<summary
								class="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14px] font-medium text-ink marker:hidden"
							>
								{f.q}
								<span class="text-ink-3 transition group-open:text-accent">
									{#if i === 0}<Minus size={15} strokeWidth={1.6} />{:else}<Plus size={15} strokeWidth={1.6} />{/if}
								</span>
							</summary>
							<p class="max-w-[38rem] pb-5 text-[13px] leading-7 text-ink-2">{f.a}</p>
						</details>
					{/each}
				</div>
			</div>
		</section>

		<!-- cta -->
		<section class="border-t border-rule">
			<div class="mx-auto flex w-full max-w-[76rem] flex-col gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-end md:justify-between">
				<div>
					<h2 class="display max-w-[30rem] text-[clamp(2.2rem,4.4vw,3.4rem)] text-ink">
						Your files deserve a <em class="italic">quieter</em> home.
					</h2>
					<p class="mt-4 max-w-[30rem] text-sm leading-7 text-ink-2">
						One tap to start. Your first upload takes under a minute.
					</p>
				</div>
				<a href="/login" class="btn btn-primary shrink-0 px-6 py-3.5 text-sm">
					Open my drive
					<ArrowUpRight size={16} strokeWidth={1.8} />
				</a>
			</div>
		</section>
	</main>

	<footer class="border-t border-rule bg-paper-2/60">
		<div class="mx-auto flex w-full max-w-[76rem] flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
			<div class="flex items-center gap-3">
				<Logo size={26} textClass="text-lg" />
				<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
					© {new Date().getFullYear()} {data.siteName}
				</span>
			</div>
			<div class="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
				<span>A Node.js project</span>
				<span class="hidden sm:inline">{formatBytes(47185920)} chunks</span>
				<a href="/login" class="transition-colors hover:text-ink">Sign in</a>
			</div>
		</div>
	</footer>
</div>
