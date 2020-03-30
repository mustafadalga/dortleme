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
        <p
          class="deep-purple-text font-size-12"
        >Kayıt onayı için kullandığınız email adresinize doğrulama bağlantısı gönderilecektir.</p>
        <p class="deep-purple-text font-size-13"  v-if="feedback">{{ feedback }}</p>
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
      feedback: null,
      statusNo: null
    };
  },
  methods: {
    signUp() {
      this.statusNo = null;
      if (!this.allFieldFull()) {
        this.feedback = "Lütfen tüm alanları giriniz";
      } else if (!this.checkPasswordLength()) {
        this.feedback = "Parolanız en az 6 karakterden oluşmalıdır";
      } else if (!this.isPasswordMatch()) {
        this.feedback = "Parolalarınız eşleşmiyor.";
      } else {
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
                      this.verifyEmail();
                    })
                    .then(() => {
                      this.feedback = "Başarıyla kayıt oldunuz.Kayıt onayı için kullandığınız email adresinize doğrulama bağlantısı gönderildi";
                      setTimeout(() => {
                        this.feedback = "Giriş sayfasına yönlendiriliyorsunuz.";
                      }, 1500);
                        setTimeout(() => {
                          this.$router.push({ name: "Login" });
                        },2500);
                    })
                    .catch(error => {
                      this.feedback = error.message;
                    });
                }
              });
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
    verifyEmail() {
      var user = firebase.auth().currentUser;
      //console.log(user.emailVerified);
      user
        .sendEmailVerification()
        .then(function() {})
        .catch(function(error) {
          this.feedback=error.message
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
.font-size-13{
  font-size: 13px;
}

</style>