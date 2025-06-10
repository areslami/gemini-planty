import Vue from 'vue' // Vue 2 way to import Vue
import App from './App.vue'
import router from './router' // Imports the router configuration
import store from './store'   // Imports the Vuex store configuration

Vue.config.productionTip = false // Standard Vue 2 config

new Vue({ // Create Vue 2 app instance
  router, // Attach router
  store,  // Attach store
  render: h => h(App) // Render main App.vue component
}).$mount('#app') // Mount the app