import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import PrimeVue from 'primevue/config';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import ProgressBar from 'primevue/progressbar';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import SpeedDial from 'primevue/speeddial';
import Skeleton from 'primevue/skeleton';
import VueClickAway from 'vue3-click-away';

// creating app
const app = createApp(App).use(store).use(router);

// add prime vue
app.use(PrimeVue);
app.use(ToastService, Toast);
app.use(VueClickAway);
app.component('ProgressBar', ProgressBar);
app.component('Dialog', Dialog);
app.component('Divider', Divider);
app.component('SpeedDial', SpeedDial);
app.component('Skeleton', Skeleton);
app.directive('tooltip', Tooltip);

// mount the app
app.mount('#app');
