import { registerRootComponent } from 'expo';

import RootEntry from './RootEntry';

// registerRootComponent calls AppRegistry.registerComponent('main', () => RootEntry);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(RootEntry);
