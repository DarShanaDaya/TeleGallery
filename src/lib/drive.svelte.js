import { toasts } from './toast.svelte.js';

/**
 * Shared drive state: the folder currently being viewed, refresh signalling and the
 * state of the small dialogs (new folder / rename / move / preview).
 */
class DriveStore {
	folderId = $state(null);
	refreshKey = $state(0);
	prompt = $state(null);
	preview = $state(null);
	move = $state(null);
	share = $state(null);
	sidebarOpen = $state(false);

	refresh() {
		this.refreshKey++;
	}

	newFolder(parentId = this.folderId) {
		this.prompt = {
			mode: 'create-folder',
			parentId,
			title: 'New folder',
			label: 'Folder name',
			value: '',
			confirmLabel: 'Create'
		};
	}

	rename(file) {
		this.prompt = {
			mode: 'rename',
			file,
			title: 'Rename',
			label: 'New name',
			value: file.name,
			confirmLabel: 'Save'
		};
	}

	openPreview(file) {
		this.preview = file;
	}

	openMove(file) {
		this.move = file;
	}

	openShare(file) {
		this.share = file;
	}
}

export const drive = new DriveStore();

export async function api(path, options = {}) {
	const res = await fetch(path, {
		...options,
		headers: { 'content-type': 'application/json', ...(options.headers || {}) }
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
	return data;
}

export async function submitPrompt() {
	const p = drive.prompt;
	if (!p) return;
	const value = (p.value || '').trim();
	if (!value) {
		toasts.error('Please enter a name');
		return;
	}
	try {
		if (p.mode === 'create-folder') {
			await api('/api/files', {
				method: 'POST',
				body: JSON.stringify({ parentId: p.parentId ?? null, name: value })
			});
			toasts.success('Folder created');
		} else if (p.mode === 'rename') {
			await api(`/api/files/${p.file.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: value })
			});
			toasts.success('Renamed');
		}
		drive.prompt = null;
		drive.refresh();
	} catch (err) {
		toasts.error(err.message);
	}
}
