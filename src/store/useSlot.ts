import { create } from 'zustand';

export const useSlot = create((set) => ({
    id: 0,
    theme: '',
    rewards: [],
    init: () =>
        set((state: any) => ({
            id: state.id,
            theme: state.theme,
            rewards: state.rewards,
        })),
}));
