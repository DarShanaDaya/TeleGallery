export function formatBytes(bytes, decimals = 1) {
	const n = Number(bytes) || 0;
	if (n <= 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
	const value = n / Math.pow(1024, i);
	return `${value.toFixed(i === 0 ? 0 : decimals).replace(/\.0$/, '')} ${units[i]}`;
}

export function formatDate(iso) {
	if (!iso) return '';
	const date = new Date(iso);
	const diff = (Date.now() - date.getTime()) / 1000;
	if (diff < 60) return 'Just now';
	if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`;
	return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fileCategory(mime, name = '') {
	const m = (mime || '').toLowerCase();
	const ext = name.split('.').pop()?.toLowerCase() || '';
	if (m.startsWith('image/')) return 'image';
	if (m.startsWith('video/')) return 'video';
	if (m.startsWith('audio/')) return 'audio';
	if (m.includes('pdf')) return 'pdf';
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
	if (m.includes('text') || ['md', 'txt', 'json', 'js', 'ts', 'css', 'html', 'yml', 'yaml'].includes(ext)) return 'text';
	return 'file';
}

export const categoryStyles = {
	folder: { bg: 'from-amber-400/25 to-amber-500/5', text: 'text-amber-300', label: 'Folder' },
	image: { bg: 'from-emerald-400/25 to-emerald-500/5', text: 'text-emerald-300', label: 'Image' },
	video: { bg: 'from-rose-400/25 to-rose-500/5', text: 'text-rose-300', label: 'Video' },
	audio: { bg: 'from-violet-400/25 to-violet-500/5', text: 'text-violet-300', label: 'Audio' },
	pdf: { bg: 'from-red-400/25 to-red-500/5', text: 'text-red-300', label: 'PDF' },
	archive: { bg: 'from-sky-400/25 to-sky-500/5', text: 'text-sky-300', label: 'Archive' },
	text: { bg: 'from-teal-400/25 to-teal-500/5', text: 'text-teal-300', label: 'Document' },
	file: { bg: 'from-slate-400/20 to-slate-500/5', text: 'text-slate-300', label: 'File' }
};
