import Vue from 'vue' // Vue 2 way to import Vue
import Vuex from 'vuex' // Vue 2 Vuex import

Vue.use(Vuex) // Use Vuex with Vue.use() in Vue 2

export default new Vuex.Store({ // Create Vuex 3 store instance
  state: {
    // Any global data your app needs can go here
  },
  mutations: {
    // Functions to change the state
  },
  actions: {
    // Functions to perform asynchronous operations (like API calls) and commit mutations
  },
  modules: {
    // For organizing larger stores into smaller pieces
  }
})