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
      this.changeTitle();
      if (to.name === "Game") {
        document.body.style.background = "none";
        document.getElementById("root").style.backgroundImage =
          "url('assets/img/zemin.png')";
      } else {
        document.body.style.background = "#ede7f6";
        document.getElementById("root").style.backgroundImage = "none";
      }
    }
  },
  methods: {
    changeTitle() {
      let routeName = this.$route.name;
      let title = "Connection 4 | ";
      if (routeName === "Signup") {
        title += "Kayıt Ol";
      } else if (routeName === "Login") {
        title += "Giriş Yap";
      } else if (routeName === "ResetPassword") {
        title += "Parolamı Unuttum";
      } else if (routeName === "Home") {
        title += "Anasayfa";
      } else if (routeName === "Notifications") {
        title += "Bildirimler";
      } else if (routeName === "Ratings") {
        title += "Skor Durumu";
      } else if (routeName === "Game") {
        title += "Oyun";
      }
      document.title = title;
    }
  }
};
</script>