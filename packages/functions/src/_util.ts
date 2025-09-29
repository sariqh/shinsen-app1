export const toISO = (v: any) =>
  v?.toDate?.()?.toISOString?.() ?? undefined;
