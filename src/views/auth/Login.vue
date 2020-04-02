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
        <div class="field font-size-12 options">
          <router-link :to="{name:'Signup'}" class="left">Kayıt Ol</router-link>
          <router-link :to="{name:'ResetPassword'}" class="right">Parolanızı mı unuttunuz ?</router-link>
        </div>

        <div class="field deep-purple-text font-size-13" v-if="feedback">
          {{feedback}}
          <a
            class="verify-link"
            v-if="emailVerified===false"
            @click="verifyEmail()"
          >tıklayınız.</a>
        </div>
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
      feedback: null,
      emailVerified: null
    };
  },
  created() {},
  methods: {
    login() {
      this.emailVerified = null;
      if (this.email && this.password) {
        this.feedback = null;
        firebase
          .auth()
          .signInWithEmailAndPassword(this.email, this.password)
          .then(() => {
            if (firebase.auth().currentUser.emailVerified) {
              this.defineCurrentUserData().then(status => {
                if (status) {
                  this.UpdatedUserIsPlayStatus();
                  this.createCurrentUserSession();
                  this.createNotificationSession();
                  this.$router.push({ name: "Home" });
                } else {
                  this.feedback =
                    "Giriş esnasında bir sorunla karşılaşıldı.Tekrar deneyiniz.";
                }
              });
            } else {
              this.emailVerified = false;
              this.feedback =
                "Email adresiniz doğrulanmamış görünüyor.Email adresinize tekrar doğrulama bağlantısı göndermek için";
            }
          })
          .catch(error => {
            if (error.code === "auth/wrong-password") {
              this.feedback = "Email adresi veya parola hatalı";
            } else if (error.code === "auth/user-not-found") {
              this.feedback = "Kayıtlı böyle bir mail adresi bulunamadı.";
            } else {
              this.feedback = error.message;
            }
          });
      } else {
        this.feedback = "Lütfen tüm alanları doldurunuz!";
      }
    },
    isUserOnline() {
      return new Promise((resolve, reject) => {
        db.collection("game_users")
          .doc(this.email)
          .get()
          .then(user => {
            if (user.exists) {
              return true;
            } else {
              return false;
            }
          })
          .then(status => resolve(status))
          .catch(error => reject(error));
      });
    },
    UpdatedUserIsPlayStatus() {
      this.isUserOnline().then(status => {
        if (status === true) {
          db.collection("game_users")
            .doc(this.email)
            .update({
              is_play: false
            });
        }
      });
    },
    verifyEmail() {
      this.emailVerified = null;
      var user = firebase.auth().currentUser;
      var that = this;
      var actionCodeSettings = {
        url: "https://dortleme.firebaseapp.com/login",
        handleCodeInApp: true
      };
      user
        .sendEmailVerification(actionCodeSettings)
        .then(function() {
          that.feedback = "Email adresinize doğrulama bağlantısı gönderildi.";
        })
        .catch(function(error) {
          if (error.code === "auth/too-many-requests") {
            that.feedback =
              "Olağandışı etkinlik nedeniyle bu cihazdan gelen tüm istekleri engelledik. Daha sonra tekrar deneyin.";
          } else {
            that.feedback = error.message;
          }
          //  that.feedback ="Doğrulama bağlantısı gönderilme sırasında hata oluştu.Tekrar deneyiniz";
        });
    },
    defineCurrentUserData() {
      return new Promise((resolve, reject) => {
        db.collection("users")
          .doc(this.email)
          .get()
          .then(doc => {
            this.currentUser["id"] = doc.data().user_id;
            this.currentUser["email"] = this.email;
            this.currentUser["username"] = doc.data().username;
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    createCurrentUserSession() {
      this.$session.set("user", this.currentUser);
    },
    createNotificationSession() {
      this.$session.set("notificationCount", 0);
    }
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
.login .options {
  margin-bottom: 64px !important;
}
.login .field {
  margin-bottom: 16px;
}
.font-size-12 {
  font-size: 12px;
}
.font-size-13 {
  font-size: 13px;
}
.verify-link {
  cursor: pointer;
}
</style>
