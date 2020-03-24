<template>
  <div id="login">
    <Navbar />
    <div class="login container">
      <form @submit.prevent="login" class="card-panel">
        <h2 class="center deep-purple-text">Giriş Yap</h2>
        <div class="field">
          <label for="email">Email:</label>
          <input type="email" name="email" v-model="email" />
        </div>
        <div class="field">
          <label for="password">Parola:</label>
          <input type="password" name="password" v-model="password" autocomplete="off" />
        </div>
        <p class="deep-purple-text center" v-if="feedback">{{feedback}}</p>
        <div class="field center">
          <button class="btn deep-purple">Giriş Yap</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import firebase from "firebase";
import db from "@/firebase/init";
import Navbar from "@/components/Navbar";

export default {
  name: "Login",
  components: {
    Navbar
  },
  data() {
    return {
      email: null,
      password: null,
      feedback: null
    };
  },
  
  methods: {
    login() {
      if (this.email && this.password) {
        this.feedback = null;
        firebase
          .auth()
          .signInWithEmailAndPassword(this.email, this.password)
          .then(() => {
              this.getCurrentUser();
          })
          .catch(error => {
            if(error.code==="auth/wrong-password"){
              this.feedback="Email adresi veya parola hatalı"
            }else{
              console.log(error)
  this.feedback = error;
            }
          });
      } else {
        this.feedback = "Lütfen tüm alanları doldurunuz!";
      }
    },
    getCurrentUser() {
      db.collection("users")
        .doc(this.email)
        .get()
        .then(doc => {
          this.currentUser["id"] = doc.data().user_id;
          this.currentUser["email"] = this.email;
          this.currentUser["username"] = doc.data().username;
        })
        .then(() => {
          this.createCurrentUserSession();
          this.createNotificationSession()
          this.$router.push({ name: "Home" });
        });
    },
    createCurrentUserSession() {
      this.$session.set("user", this.currentUser);
    },
    createNotificationSession() {
      this.$session.set("notificationCount", 0);
    },
  }
};
</script>

<style lang="css" scoped>
body {
  background: #fff;
}
.login {
  max-width: 400px !important;
  margin-top: 60px;
}
.login h2 {
  font-size: 2.4em;
}
.login .field {
  margin-bottom: 16px;
}
</style>
