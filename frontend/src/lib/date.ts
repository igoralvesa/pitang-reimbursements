import dayjs from 'dayjs';

export function formatDate(value: string) {
  return dayjs(value).format('DD/MM/YYYY');
}

export function formatDateTime(value: string) {
  return dayjs(value).format('DD/MM/YYYY HH:mm');
}
