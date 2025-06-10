<template>
  <div id="app">
    <nav>
      <router-link to="/">Tracker</router-link> |
      <router-link to="/overview">Overview</router-link> |
      <router-link to="/add-plant">Add Plant</router-link> | <router-link to="/add-supplement">Add Supplement</router-link> </nav>
    <router-view/>
  </div>
</template>

<style>
/* Basic global styles */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

nav {
  padding: 30px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

nav a:hover {
  background-color: #e2e2e2;
}

nav a.router-link-exact-active {
  color: #42b983;
  background-color: #e0f2f7;
}
</style>