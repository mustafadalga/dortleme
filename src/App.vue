<template>
  <div id="app">
    <router-view />
  </div>
</template>


<script>
export default {
  data() {
    return {
      routeName: null
    };
  },
  mounted() {
    this.changeBodyCSS();
  },
  watch: {
    $route(to) {
      this.routeName = to.name;
      this.changeTitle();
      this.changeBodyCSS(to.name);
    }
  },
  methods: {
    changeTitle() {
      let title = "Dörtleme Zeka Oyunu | ";
      if (this.routeName === "Signup") {
        title += "Kayıt Ol";
      } else if (this.routeName === "Login") {
        title += "Giriş Yap";
      } else if (this.routeName === "ResetPassword") {
        title += "Parolamı Unuttum";
      } else if (this.routeName === "Home") {
        title += "Anasayfa";
      } else if (this.routeName === "Notifications") {
        title += "Bildirimler";
      } else if (this.routeName === "Ratings") {
        title += "Skor Durumu";
      } else if (this.routeName === "Game") {
        title += "Oyun";
      }
      document.title = title;
    },
    changeBodyCSS() {
      if (this.routeName === "Game") {
        document.body.style.height = "100vh";
        document.body.style.background = "none";
        document.getElementById("root").style.backgroundImage ="url('assets/img/zemin.png')";
      } else {
        document.body.style.height = "auto";
        document.body.style.background = "#ede7f6";
        document.getElementById("root").style.backgroundImage = "none";
      }
    }
  }
};
</script>