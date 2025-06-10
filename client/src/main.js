import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from 'jalali-moment' // <<< ADD THIS LINE

Vue.config.productionTip = false

// <<< ADD THESE GLOBAL UTILITY FUNCTIONS
Vue.prototype.$formatShamsiDate = function(gregorianDateString, format = 'YYYY/MM/DD') {
  if (!gregorianDateString) return 'N/A';
  return moment(gregorianDateString, 'YYYY-MM-DD').locale('fa').format(format);
};

Vue.prototype.$toGregorianDate = function(shamsiDateString) {
  if (!shamsiDateString) return null;
  // This function assumes the input will already be Gregorian from the native date picker
  // but is here for completeness if you ever manually convert.
  // For now, it just returns the input as is for direct assignment to recordDate.
  return shamsiDateString;
};
// END GLOBAL UTILITY FUNCTIONS >>>

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')