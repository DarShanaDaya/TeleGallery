/**
 * Media queue shared by the full player page.
 *
 * Kept framework-light: a store that holds the queue, the active index and the
 * per-item playback memory. The <video> element itself lives in the component; this
 * module only decides *what* should play and *where from*.
 */
class PlayerStore {
	items = $state([]);
	index = $state(0);
	autoplay = $state(true);
	loop = $state(false);

	/** fileId → { position, updatedAt } so a reload resumes where you were */
	progress = $state({});

	loaded = $state(false);

	get current() {
		return this.items[this.index] ?? null;
	}
	get hasNext() {
		return this.index < this.items.length - 1;
	}
	get hasPrev() {
		return this.index > 0;
	}

	setQueue(items, activeId = null) {
		this.items = items;
		const found = items.findIndex((item) => item.id === activeId);
		this.index = found >= 0 ? found : 0;
		this.loaded = true;
	}

	select(id) {
		const found = this.items.findIndex((item) => item.id === id);
		if (found >= 0) this.index = found;
	}

	next() {
		if (this.hasNext) this.index += 1;
		else if (this.loop && this.items.length) this.index = 0;
	}

	prev() {
		if (this.hasPrev) this.index -= 1;
		else if (this.loop && this.items.length) this.index = this.items.length - 1;
	}

	remember(fileId, position) {
		this.progress = { ...this.progress, [fileId]: { position, updatedAt: Date.now() } };
		persist(this.progress);
	}

	recall(fileId) {
		return this.progress[fileId]?.position ?? 0;
	}
}

function persist(progress) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem('tg_player_progress', JSON.stringify(progress));
	} catch {
		/* storage full or blocked — resume position is a nicety, not data */
	}
}

function hydrate() {
	if (typeof localStorage === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem('tg_player_progress') || '{}');
	} catch {
		return {};
	}
}

export const player = new PlayerStore();

export function hydratePlayer() {
	player.progress = hydrate();
}

/** mm:ss / h:mm:ss, or empty for a non-finite duration. */
export function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const total = Math.floor(seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
