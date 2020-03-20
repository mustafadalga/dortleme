<template>
  <div id="app">
    <router-view />
  </div>
</template>


<script>
export default {
  mounted() {
    if (this.$route.name === "Game") {
      document.body.style.background = "none";
      document.getElementById("root").style.backgroundImage =
        "url('assets/img/zemin.png')";
    } else {
      document.body.style.background = "#ede7f6";
      document.getElementById("root").style.backgroundImage = "none";
    }
  },
  watch: {
    $route(to) {
      if (to.name === "Game") {
        document.body.style.background = "none";
        document.getElementById("root").style.backgroundImage =
          "url('assets/img/zemin.png')";
      } else {
        document.body.style.background = "#ede7f6";
        document.getElementById("root").style.backgroundImage = "none";
      }
    }
  }
};
</script>