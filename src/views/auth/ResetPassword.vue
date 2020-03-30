<template>
  <div id="signUp">
    <Navbar />
    <div class="signUp container">
      <form class="card-panel" @submit.prevent="resetPassword">
        <h2 class="center deep-purple-text">Parolamı Unuttum</h2>

        <div class="field">
          <label for="email">Email:</label>
          <input type="email" name="email" v-model="email" />
        </div>

        <p class="deep-purple-text font-size-13" v-if="feedback">{{ feedback }}</p>
        <div class="field center">
          <button class="btn deep-purple">Parolamı Sıfırla</button>
        </div>

        <div class="field font-size-12 options">
          <router-link :to="{name:'Login'}" class="left">Giriş Yap</router-link>
          <router-link :to="{name:'Signup'}" class="right">Kayıt Ol</router-link>
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
      feedback: null
    };
  },
  methods: {
    resetPassword() {
      if (this.email) {
        this.isEmailExists().then(emailStatus => {
          if (emailStatus === true) {
            this.sendPasswordResetEmail();
          } else if (emailStatus === false) {
            this.feedback = "Kayıtlı böyle bir mail adresi bulunamadı.";
          }
        });
      } else {
        this.feedback = "Lütfen bir email adresi giriniz.";
      }
    },
    sendPasswordResetEmail() {
      var auth = firebase.auth();
      var that = this;
      var actionCodeSettings = {
        url: "https://dortleme.firebaseapp.com/login",
        handleCodeInApp: false
      };
      auth
        .sendPasswordResetEmail(that.email, actionCodeSettings)
        .then(function() {
          that.feedback = `${that.email} mail adresine parola sıfırlama bağlantısı gönderildi.`;
        })
        .catch(function(error) {
          that.feedback = error.message;
        });
    },
    isEmailExists() {
      return new Promise((resolve, reject) => {
        db.collection("users")
          .doc(this.email)
          .get()
          .then(doc => {
            if (doc.exists) {
              return true;
            } else {
              return false;
            }
          })
          .then(value => resolve(value))
          .catch(error => reject(error));
      });
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