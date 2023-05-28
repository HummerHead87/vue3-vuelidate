import { createApp } from 'vue';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
// import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css' 

import App from './App.vue';

const vuetify = createVuetify({
  components,
  directives,
});

createApp(App).use(vuetify).mount('#app');
