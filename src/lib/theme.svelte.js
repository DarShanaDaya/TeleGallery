import { browser } from '$app/environment';

/** Theme is toggled on <html data-theme> and remembered in localStorage. */
class Theme {
	current = $state('light');

	init() {
		if (!browser) return;
		const saved = localStorage.getItem('tg_theme');
		this.current = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		this.apply();
	}

	toggle() {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		this.apply();
		if (browser) localStorage.setItem('tg_theme', this.current);
	}

	apply() {
		if (browser) document.documentElement.dataset.theme = this.current;
	}
}

export const theme = new Theme();
