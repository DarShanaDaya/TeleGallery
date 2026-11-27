<script>
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import UploadPanel from '$lib/components/UploadPanel.svelte';
	import { uploader } from '$lib/uploader.svelte.js';

	let { data, children } = $props();
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar {data} user={data.user} />
	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		{@render children()}
	</main>
	<UploadPanel />
	<Toaster />
</div>
