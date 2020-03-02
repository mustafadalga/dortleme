<template>
  <div id="signup">
    <Navbar />
    <div class="signup container">
      <form class="card-panel" @submit.prevent="SignUp">
        <h2 class="center deep-purple-text">Signup</h2>
          <div class="field">
          <label for="email">Username:</label>
          <input type="text" name="username" v-model="username" />
        </div>
        <div class="field">
          <label for="email">Email:</label>
          <input type="email" name="email" v-model="email" />
        </div>
        <div class="field">
          <label for="password">Password:</label>
          <input type="password" name="password" v-model="password" />
        </div>
        <p class="red-text center" v-if="feedback">{{ feedback }}</p>
        <div class="field center">
          <button class="btn deep-purple">Signup</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import db from "@/firebase/init";
import firebase from "firebase";
import Navbar from "@/components/Navbar";
export default {
  name: "Signup",
  components: {
    Navbar
  },
  data() {
    return {
      email: null,
      password: null,
      username: null,
      feedback: null
    };
  },
  methods:{
        SignUp() {
      if (this.username && this.email && this.password) {
        let ref = db.collection("users").doc(this.email); //slug'a id olarak gönderilip böyle bir id var mı yok mu kontrol yapılıyor.
        ref.get().then(doc => {
          if (doc.exists) {
            this.feedback = "This is already exists";
          } else {
            firebase
              .auth()
              .createUserWithEmailAndPassword(this.email, this.password)
              .then(user => {
                ref.set({
                  username: this.username,
                  user_id: user.user.uid,
                  online_status:false,
                });
              })
              .then(() => {
                this.$router.push({ name: "Login" });
              })
              .catch(error => {
                console.log(error);
                this.feedback = error.message;
              });
            //  this.feedback='This alias is free to use'
          }
        });
        this.feedback = null;
      } else {
        this.feedback = "You must enter all fields";
      }
    }
  }
};
</script>


<style  lang="css" scoped>
.signup {
  max-width: 400px !important;
  margin-top: 60px;
}
.signup h2 {
  font-size: 2.4em;
}
.signup .field {
  margin-bottom: 16px;
}
</style>