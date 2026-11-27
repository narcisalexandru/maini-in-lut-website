export type CartHolder =
  | { type: 'user'; userId: number }
  | { type: 'guest'; guestId: string };

export function toHolderColumns(holder: CartHolder): {
  holderType: 'user' | 'guest';
  holderId: string;
} {
  if (holder.type === 'user') {
    return { holderType: 'user', holderId: String(holder.userId) };
  }
  return { holderType: 'guest', holderId: holder.guestId };
}
