<template>
  <div id="app">
    
    <router-link :to="`/`"></router-link>
    <router-link :to="`/read`"></router-link>
    <router-view>

    </router-view>
  </div>
</template>

<script>


export default {
  name: 'App',
}
</script>

<style>
html,body,ul,li{
  margin: 0;
  padding: 0;
  background-color: rgb(242, 242, 242);
}
a{
  text-decoration: none;
  color:black;

}
ul,li{
  list-style: none;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  color: #2c3e50;

}

</style>
