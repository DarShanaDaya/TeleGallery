let seq = 0;

class ToastStore {
	items = $state([]);

	push(message, type = 'info', timeout = 4200) {
		const id = ++seq;
		this.items = [...this.items, { id, message, type }];
		if (timeout) setTimeout(() => this.dismiss(id), timeout);
		return id;
	}
	success(message) {
		return this.push(message, 'success');
	}
	error(message) {
		return this.push(message, 'error', 6000);
	}
	info(message) {
		return this.push(message, 'info');
	}
	dismiss(id) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastStore();
