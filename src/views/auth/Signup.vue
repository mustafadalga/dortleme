<template>
  <div id="signUp">
    <Navbar />
    <div class="signUp container">
      <form class="card-panel" @submit.prevent="signUp">
        <h2 class="center deep-purple-text">Kayıt Ol</h2>
        <div class="field">
          <label for="email">Kullanıcı Adı:</label>
          <input type="text" name="username" v-model="username" />
        </div>
        <div class="field">
          <label for="email">Email:</label>
          <input type="email" name="email" v-model="email" />
        </div>
        <div class="field">
          <label for="password">Parola:</label>
          <input type="password" name="password" v-model="password" autocomplete="off" />
        </div>
        <div class="field">
          <label for="password">Parola Onayla:</label>
          <input type="password" name="password2" v-model="password2" autocomplete="off" />
        </div>
        <p class="deep-purple-text center" v-if="feedback">{{ feedback }}</p>
        <div class="field center">
          <button class="btn deep-purple">Kayıt Ol</button>
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
  name: "signUp",
  components: {
    Navbar
  },
  data() {
    return {
      email: null,
      password: null,
      password2: null,
      username: null,
      feedback: null
    };
  },
  methods: {
    signUp() {
      if (this.allFieldFull()) {
        if (this.password === this.password2) {
          let ref = db.collection("users").doc(this.email);
          ref.get().then(doc => {
            if (doc.exists) {
              this.feedback = "Girdiğiniz email adresi kullanılıyor.";
            } else {
              db.collection("users")
                .where("username", "==", this.username)
                .get()
                .then(doc => {
                  if (doc.size > 0) {
                    this.feedback = "Girdiğiniz kullanıcı adı kullanılıyor.";
                  } else {
                    firebase
                      .auth()
                      .createUserWithEmailAndPassword(this.email, this.password)
                      .then(user => {
                        ref.set({
                          username: this.username,
                          user_id: user.user.uid
                        });
                        this.createUserScoreSystem();
                      })
                      .then(() => {
                        this.feedback =
                          "Başarıyla kayıt oldunuz.Giriş sayfasına yönlendiriliyorsunuz.";
                        setTimeout(() => {
                          this.$router.push({ name: "Login" });
                        }, 3000);
                      })
                      .catch(error => {
                        this.feedback = error.message;
                      });
                  }
                });
            }
          });
        } else {
          this.feedback = "Parolalar eşleşmiyor!";
        }
      } else {
        this.feedback = "Lütfen tüm alanları giriniz";
      }
    },
    createUserScoreSystem() {
      db.collection("scores").add({
        email: this.email,
        username: this.username,
        score: 0
      });
    },
    allFieldFull() {
      if (this.username && this.email && this.password && this.password2) {
        return true;
      } else {
        return false;
      }
    }
  }
};
</script>


<style  lang="css" scoped>
.signUp {
  max-width: 400px !important;
  margin-top: 60px;
}
.signUp h2 {
  font-size: 2.4em;
}
.signUp .field {
  margin-bottom: 16px;
}
</style>