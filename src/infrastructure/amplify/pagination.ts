export async function listAll<TItem, TArgs extends Record<string, unknown>>(
  listFn: (args?: TArgs) => Promise<{ data?: TItem[] | null; nextToken?: string | null }>
): Promise<TItem[]> {
  const items: TItem[] = [];
  let nextToken: string | null | undefined;

  do {
    const response = await listFn(
      nextToken ? (({ nextToken } as unknown) as TArgs) : undefined
    );
    if (Array.isArray(response.data)) {
      items.push(...response.data);
    }
    nextToken = response.nextToken;
  } while (nextToken);

  return items;
}
