import { toasts } from './toast.svelte.js';

let seq = 0;
/** Raw File objects are kept outside reactive state (File instances shouldn't be proxied). */
const sources = new Map();

class Uploader {
	items = $state([]);
	open = $state(false);
	#onComplete = null;

	get active() {
		return this.items.filter((i) => i.status === 'uploading' || i.status === 'queued').length;
	}
	get totalProgress() {
		const total = this.items.reduce((s, i) => s + i.size, 0);
		const loaded = this.items.reduce((s, i) => s + i.loaded, 0);
		return total ? Math.round((loaded / total) * 100) : 0;
	}

	onComplete(fn) {
		this.#onComplete = fn;
	}

	clearFinished() {
		for (const item of this.items) {
			if (item.status !== 'uploading' && item.status !== 'queued') sources.delete(item.id);
		}
		this.items = this.items.filter((i) => i.status === 'uploading' || i.status === 'queued');
		if (!this.items.length) this.open = false;
	}

	/** Queue files for chunked upload into the given folder. */
	async add(fileList, parentId = null) {
		const files = Array.from(fileList || []);
		if (!files.length) return;

		const batch = files.map((file) => {
			const id = ++seq;
			sources.set(id, file);
			return { id, name: file.name, size: file.size, loaded: 0, status: 'queued', error: '' };
		});
		this.items = [...this.items, ...batch];
		this.open = true;

		for (const item of batch) {
			await this.#uploadOne(item, parentId);
		}
		if (this.items.every((i) => i.status === 'done' || i.status === 'error')) this.#onComplete?.();
	}

	async #uploadOne(item, parentId) {
		const file = sources.get(item.id);
		const patch = (data) => {
			this.items = this.items.map((i) => (i.id === item.id ? { ...i, ...data } : i));
		};
		try {
			patch({ status: 'uploading' });
			const initRes = await fetch('/api/upload/init', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: item.name,
					size: item.size,
					mime: file.type || 'application/octet-stream',
					parentId
				})
			});
			const init = await initRes.json();
			if (!initRes.ok) throw new Error(init.error || 'Could not start upload');

			const { id: fileId, chunkSize } = init;
			const total = Math.max(1, Math.ceil(item.size / chunkSize));

			for (let index = 0; index < total; index++) {
				const start = index * chunkSize;
				const blob = file.slice(start, Math.min(start + chunkSize, item.size));
				await this.#sendChunk(fileId, index, blob, (sent) => patch({ loaded: start + sent }));
				patch({ loaded: Math.min(item.size, start + blob.size) });
			}

			const finishRes = await fetch('/api/upload/finish', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ fileId })
			});
			const done = await finishRes.json();
			if (!finishRes.ok) throw new Error(done.error || 'Could not finish upload');

			patch({ status: 'done', loaded: item.size, fileId, name: done.file?.name || item.name });
			toasts.success(`${done.file?.name || item.name} uploaded`);
		} catch (err) {
			patch({ status: 'error', error: err.message || 'Upload failed' });
			toasts.error(`${item.name}: ${err.message || 'Upload failed'}`);
		}
	}

	#sendChunk(fileId, index, blob, onProgress) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `/api/upload/chunk?fileId=${fileId}&index=${index}`);
			xhr.setRequestHeader('content-type', 'application/octet-stream');
			xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) return resolve();
				let message = `Chunk ${index + 1} failed (${xhr.status})`;
				try {
					message = JSON.parse(xhr.responseText).error || message;
				} catch {
					/* keep default */
				}
				reject(new Error(message));
			};
			xhr.onerror = () => reject(new Error('Network error while uploading'));
			xhr.send(blob);
		});
	}
}

export const uploader = new Uploader();
