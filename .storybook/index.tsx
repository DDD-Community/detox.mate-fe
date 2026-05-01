import { view } from './storybook.requires';

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: async () => null,
    setItem: async () => undefined,
  },
});

export default StorybookUIRoot;
