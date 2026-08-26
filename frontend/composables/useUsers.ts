import type { AuthUser } from "~/types/user";

export function useUsers() {
  const { apiFetch } = useApi();

  const listUsers = () => apiFetch<AuthUser[]>("/users");

  const getUser = (id: number) => apiFetch<AuthUser>(`/users/details/${id}`);

  return {
    listUsers,
    getUser,
  };
}
