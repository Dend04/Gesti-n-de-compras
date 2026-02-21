export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays === 2) return 'antier';

  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 14) return 'hace 1 semana';
  if (diffDays < 21) return 'hace 2 semanas';
  if (diffDays < 28) return 'hace 3 semanas';

  const months = Math.floor(diffDays / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(months / 12);
  if (years === 1) return 'hace 1 año';
  return `hace ${years} años`;
}

export function formatExactTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}