import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { UserState } from "../types/user";

const useStore = create<UserState>()(
	persist(
		(set) => ({
			user: null,
			token: null,
			setUser: (user) => set((state) => ({ ...state, user })),
			setToken: (token) => set({ token }),
			logout: () => {
				localStorage.clear();
				set({ user: null, token: null });
			},
		}),
		{
			name: "userData",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export default useStore;
