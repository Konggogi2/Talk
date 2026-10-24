import { render, go, setTab } from './screens.js';
import { store } from './store.js';
import * as data from './data/index.js';
import * as nego from './nego.js';
import * as sim from './sim.js';

render();
window.__app = { store, go, setTab, data, nego, sim };

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
