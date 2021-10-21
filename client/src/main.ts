import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import PrimeVue from 'primevue/config';
import ProgressBar from 'primevue/progressbar';

// creating app
const app = createApp(App).use(store).use(router);

// add prime vue
app.use(PrimeVue);
app.component('ProgressBar', ProgressBar);

// mount the app
app.mount('#app');
