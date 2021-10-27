import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import PrimeVue from 'primevue/config';
import ProgressBar from 'primevue/progressbar';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';

// creating app
const app = createApp(App).use(store).use(router);

// add prime vue
app.use(PrimeVue);
app.use(ToastService, Toast);
app.component('ProgressBar', ProgressBar);

// mount the app
app.mount('#app');
