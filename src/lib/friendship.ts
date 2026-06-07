export function normalizeFriendPair(
  userIdA: string,
  userIdB: string,
): { userAId: string; userBId: string } {
  return userIdA < userIdB
    ? { userAId: userIdA, userBId: userIdB }
    : { userAId: userIdB, userBId: userIdA };
}
