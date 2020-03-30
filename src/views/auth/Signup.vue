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

        <div
          class="field deep-purple-text font-size-12"
        >Kayıt onayı için kullandığınız email adresinize doğrulama bağlantısı gönderilecektir.</div>

        <div class="field deep-purple-text font-size-13" v-if="feedback">{{ feedback }}</div>

        <div class="field center">
          <button class="btn deep-purple">Kayıt Ol</button>
        </div>

        <div class="field font-size-12 options">
          <router-link :to="{name:'Login'}" class="left">Giriş Yap</router-link>
          <router-link :to="{name:'ResetPassword'}" class="right">Parolanızı mı unuttunuz ?</router-link>
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
      feedback: null,
    };
  },
  methods: {
    signUp() {
      if (!this.allFieldFull()) {
        this.feedback = "Lütfen tüm alanları giriniz";
      } else if (!this.checkPasswordLength()) {
        this.feedback = "Parolanız en az 6 karakterden oluşmalıdır";
      } else if (!this.isPasswordMatch()) {
        this.feedback = "Parolalarınız eşleşmiyor.";
      } else {
        this.isUsernameExists().then(userStatus => {
          if (userStatus === true) {
            this.feedback = `${this.username} kullanıcı adı kullanılıyor.`;
          } else if (userStatus === false) {
            let ref = db.collection("users").doc(this.email);
            firebase
              .auth()
              .createUserWithEmailAndPassword(this.email, this.password)
              .then(user => {
                ref.set({
                  username: this.username,
                  user_id: user.user.uid
                });
                this.createUserScoreSystem();
                this.verifyEmail();
              })
              .then(() => {
                this.feedback =
                  "Başarıyla kayıt oldunuz.Kayıt onayı için kullandığınız email adresinize doğrulama bağlantısı gönderildi.";
                setTimeout(() => {
                  this.feedback = "Giriş sayfasına yönlendiriliyorsunuz.";
                }, 1500);
                setTimeout(() => {
                  this.$router.push({ name: "Login" });
                }, 2500);
              })
              .catch(error => {
                switch (error.code) {
                  case "auth/email-already-in-use":
                    this.feedback = `${this.email} email adresi  kullanılıyor.`;
                    break;
                  case "auth/invalid-email":
                    this.feedback = `${this.email} geçersiz bir email adresidir.`;
                    break;
                  default:
                    this.feedback = error.message;
                    break;
                }
              });
          } else {
            this.feedback = userStatus.message;
          }
        });
      }
    },
    createUserScoreSystem() {
      db.collection("scores").add({
        email: this.email,
        username: this.username,
        score: 0
      });
    },
    isUsernameExists() {
      return new Promise((resolve, reject) => {
        db.collection("users")
          .where("username", "==", this.username)
          .get()
          .then(doc => {
            if (doc.size > 0) {
              return true;
            } else {
              return false;
            }
          })
          .then(value => resolve(value))
          .catch(error => reject(error));
      });
    },
    verifyEmail() {
      var user = firebase.auth().currentUser;
      var that = this;

      var actionCodeSettings = {
        url: "https://dortleme.firebaseapp.com/login",
        handleCodeInApp: true
      };
      user
        .sendEmailVerification(actionCodeSettings)
        .then(function() {})
        .catch(function(error) {
          that.feedback = error.message;
        });
    },
    allFieldFull() {
      if (this.username && this.email && this.password && this.password2) {
        return true;
      } else {
        return false;
      }
    },
    checkPasswordLength() {
      if (this.password > 5) {
        return true;
      } else {
        return false;
      }
    },
    isPasswordMatch() {
      if (this.password === this.password2) {
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
  position: relative;
}
.signUp h2 {
  font-size: 2.4em;
}
.signUp .field {
  margin-bottom: 16px;
}
.font-size-12 {
  font-size: 12px;
}
.font-size-13 {
  font-size: 13px;
}
</style>