<script>
	import Logo from '$lib/components/Logo.svelte';
	import {
		Infinity as InfinityIcon,
		ShieldCheck,
		Zap,
		Smartphone,
		FolderTree,
		CloudUpload,
		ArrowRight,
		Code2 as Github	} from 'lucide-svelte';

	let { data } = $props();

	const features = [
		{
			icon: InfinityIcon,
			title: 'Unlimited Storage',
			body: 'Your files live in your own Telegram account. No quotas, no tiers, no monthly bill.'
		},
		{
			icon: ShieldCheck,
			title: 'Private by Design',
			body: 'Files never touch a third-party bucket. They stay in your chat, encrypted in transit.'
		},
		{
			icon: Zap,
			title: 'Blazing Fast',
			body: 'Chunked uploads and streamed downloads mean big files move without a sweat.'
		},
		{
			icon: FolderTree,
			title: 'Real File Manager',
			body: 'Folders, rename, move, star, trash and restore — everything you expect from a drive.'
		},
		{
			icon: Smartphone,
			title: 'Works Everywhere',
			body: 'A responsive interface that feels native on desktop, tablet and phone.'
		},
		{
			icon: CloudUpload,
			title: 'One Tap Login',
			body: 'Sign in with the Telegram account you already have. No passwords to remember.'
		}
	];
</script>

<div class="relative min-h-screen overflow-hidden">
	<!-- ambient glow -->
	<div class="pointer-events-none absolute inset-0 -z-10">
		<div class="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[120px]"></div>
		<div class="animate-float absolute right-[-8rem] top-40 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]"></div>
		<div class="absolute bottom-[-10rem] left-[-6rem] h-80 w-80 rounded-full bg-violet-600/15 blur-[110px]"></div>
	</div>

	<header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
		<Logo />
		<nav class="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
			<a class="transition hover:text-white" href="#features">Features</a>
			<a class="transition hover:text-white" href="#how">How it works</a>
			<a class="transition hover:text-white" href="#faq">FAQ</a>
		</nav>
		<a href="/login" class="btn-primary">
			Log in
			<ArrowRight size={16} />
		</a>
	</header>

	<main>
		<!-- Hero -->
		<section class="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-16 pt-10 md:grid-cols-[1.05fr_0.95fr] md:pt-16">
			<div class="fade-up">
				<span class="chip mb-6">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
					</span>
					Powered by your Telegram account
				</span>
				<h1 class="text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
					Your Unlimited<br />
					<span class="bg-gradient-to-r from-brand-300 via-brand-400 to-cyan-300 bg-clip-text text-transparent">Personal Cloud</span>
				</h1>
				<p class="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
					Store, manage, and access your files securely from anywhere. TeleDrive turns the storage you already
					have on Telegram into a beautiful drive — free, private and truly unlimited.
				</p>
				<div class="mt-9 flex flex-wrap items-center gap-3">
					<a href="/login" class="btn-primary px-6 py-3 text-base">
						Get started free
						<ArrowRight size={18} />
					</a>
					<a href="#features" class="btn-ghost px-6 py-3 text-base">Explore features</a>
				</div>
				<div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
					<span class="flex items-center gap-2"><ShieldCheck size={16} class="text-emerald-400" /> No credit card</span>
					<span class="flex items-center gap-2"><InfinityIcon size={16} class="text-brand-400" /> No storage limit</span>
					<span class="flex items-center gap-2"><Zap size={16} class="text-amber-400" /> Setup in 60 seconds</span>
				</div>
			</div>

			<!-- Product preview -->
			<div class="fade-up relative" style="animation-delay:.12s">
				<div class="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/25 to-cyan-400/10 blur-2xl"></div>
				<div class="card overflow-hidden shadow-2xl shadow-black/50">
					<div class="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
						<span class="h-2.5 w-2.5 rounded-full bg-rose-400/80"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-amber-400/80"></span>
						<span class="h-2.5 w-2.5 rounded-full bg-emerald-400/80"></span>
						<span class="ml-3 flex-1 truncate rounded-md bg-black/30 px-3 py-1 text-[11px] text-slate-500">
							{data.siteName.toLowerCase()}.app/drive
						</span>
					</div>
					<div class="grid grid-cols-[104px_1fr]">
						<div class="space-y-1 border-r border-white/10 p-3">
							{#each ['My Drive', 'Starred', 'Recent', 'Trash'] as item, i}
								<div
									class="rounded-lg px-2.5 py-2 text-[11px] font-medium {i === 0
										? 'bg-brand-500/20 text-brand-200'
										: 'text-slate-500'}"
								>
									{item}
								</div>
							{/each}
						</div>
						<div class="p-3">
							<div class="mb-3 flex items-center justify-between">
								<span class="text-xs font-semibold text-white">My Drive</span>
								<span class="rounded-md bg-brand-500 px-2 py-1 text-[10px] font-semibold text-white">Upload</span>
							</div>
							<div class="grid grid-cols-3 gap-2">
								{#each [{ n: 'Photos', c: 'from-amber-400/30' }, { n: 'Projects', c: 'from-brand-400/30' }, { n: 'Backups', c: 'from-emerald-400/30' }, { n: 'video.mp4', c: 'from-rose-400/25' }, { n: 'notes.md', c: 'from-sky-400/25' }, { n: 'archive.zip', c: 'from-violet-400/25' }] as f}
									<div class="rounded-lg border border-white/10 bg-gradient-to-br {f.c} to-transparent p-2">
										<div class="mb-4 h-6 w-6 rounded bg-white/15"></div>
										<p class="truncate text-[10px] text-slate-300">{f.n}</p>
									</div>
								{/each}
							</div>
							<div class="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
								<span class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
									<span class="block h-full w-2/3 rounded-full bg-brand-400"></span>
								</span>
								<span class="text-[10px] text-slate-400">uploading… 68%</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features -->
		<section id="features" class="mx-auto w-full max-w-6xl px-6 py-20">
			<div class="mx-auto max-w-2xl text-center">
				<p class="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Everything included</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
					A drive that feels premium. For free.
				</h2>
			</div>
			<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<div class="card group p-6 transition hover:border-brand-400/40 hover:bg-white/[0.06]">
						<div class="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300 transition group-hover:bg-brand-500/25">
							<feature.icon size={20} />
						</div>
						<h3 class="text-base font-semibold text-white">{feature.title}</h3>
						<p class="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- How it works -->
		<section id="how" class="mx-auto w-full max-w-6xl px-6 py-16">
			<div class="card overflow-hidden">
				<div class="grid gap-10 p-8 md:grid-cols-3 md:p-12">
					{#each [{ n: '01', t: 'Connect Telegram', d: 'Scan once and authorise the bot. We only ever see the chat we store files in.' }, { n: '02', t: 'Upload anything', d: 'Drag a file in. It is split into safe chunks and stored as documents in your account.' }, { n: '03', t: 'Access anytime', d: 'Browse, preview, share and restore from any device, forever.' }] as step}
						<div>
							<span class="text-4xl font-black text-brand-500/30">{step.n}</span>
							<h3 class="mt-3 text-lg font-semibold text-white">{step.t}</h3>
							<p class="mt-2 text-sm leading-relaxed text-slate-400">{step.d}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section id="faq" class="mx-auto w-full max-w-3xl px-6 py-16">
			<h2 class="text-center text-3xl font-bold tracking-tight text-white">Questions, answered</h2>
			<div class="mt-8 space-y-3">
				{#each [{ q: 'Is storage really unlimited?', a: 'TeleDrive stores your files inside your own Telegram account rather than a rented bucket, so there is no plan or quota to hit. Telegram Premium accounts can hold files up to 4 GB each.' }, { q: 'Can anyone else see my files?', a: 'No. Files are kept in a private chat with your storage bot and only your signed-in session can request them.' }, { q: 'What happens to large files?', a: 'Uploads are split into 45 MB chunks automatically and reassembled on download, so large files stream reliably.' }] as item}
					<details class="card group p-5 open:border-brand-400/30">
						<summary class="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white">
							{item.q}
							<span class="text-brand-400 transition group-open:rotate-45">+</span>
						</summary>
						<p class="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
					</details>
				{/each}
			</div>
		</section>

		<!-- CTA -->
		<section class="mx-auto w-full max-w-6xl px-6 pb-20">
			<div class="relative overflow-hidden rounded-3xl border border-brand-400/25 bg-gradient-to-br from-brand-600/25 via-[#0b1220] to-cyan-500/10 p-10 text-center md:p-14">
				<h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Your files deserve a better home</h2>
				<p class="mx-auto mt-4 max-w-xl text-slate-300">
					Join in a single tap. Your first upload takes less than a minute.
				</p>
				<a href="/login" class="btn-primary mx-auto mt-8 px-7 py-3 text-base">
					Log in with Telegram
					<ArrowRight size={18} />
				</a>
			</div>
		</section>
	</main>

	<footer class="border-t border-white/5">
		<div class="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
			<div class="flex items-center gap-2">
				<Logo size={28} textClass="text-base" />
			</div>
			<p>© {new Date().getFullYear()} {data.siteName}. All rights reserved.</p>
			<a class="flex items-center gap-2 transition hover:text-white" href="https://github.com" target="_blank" rel="noreferrer">
				<Github size={16} /> Source
			</a>
		</div>
	</footer>
</div>
