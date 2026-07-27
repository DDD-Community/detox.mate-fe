const _pokedIds = new Set<string>();

export const pokeStore = {
  add(id: string) {
    _pokedIds.add(id);
  },
  has(id: string) {
    return _pokedIds.has(id);
  },
  getAll(): string[] {
    return [..._pokedIds];
  },
};
