<template>
  <nav class="deep-purple darken-1">
    <div class="container">
      <router-link :to="{name:'Home'}" class="brand-logo left">
        <font-awesome-icon :icon="['fas', 'home']" />
        <span style="margin-left:8px">Connection 4</span>
      </router-link>
      <ul class="right">
        <li v-if="!currentUser">
          <router-link :to="{name:'Signup'}">
            <font-awesome-icon :icon="['fas', 'user-plus']" class="font-awesome-size" />
          </router-link>
        </li>
        <li v-if="!currentUser">
          <router-link :to="{name:'Login'}" style="height:100%">
            <font-awesome-icon :icon="['fas', 'sign-in-alt']" class="font-awesome-size" />
          </router-link>
        </li>
        <li v-if="currentUser && this.$route.name=='Game'">
          <a @click="oyundanCik">
            <font-awesome-icon :icon="['fas', 'times-circle']" class="font-awesome-size" />
          </a>
        </li>
        <li v-if="currentUser">
          <router-link
            :to="{name:'Notifications'}"
            style="position:relative;"
            @click.native="bildirimSifirla"
          >
            <font-awesome-icon
              :icon="['fas', 'bell']"
              class="font-awesome-size"
              :class="[notificationCount > 0 ? 'bell-on' : '',isAnimateAdded ? 'animated wobble' : '']"
            />
            {{ notificationCount}}
            <span
              v-if="notificationCount > 0"
              class="bell-badge"
            >{{ notificationCount }}</span>
          </router-link>
        </li>

        <li v-if="currentUser">
          <a @click="logout">
            <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="font-awesome-size" />
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
import {
  faHome,
  faUserPlus,
  faSignOutAlt,
  faBell,
  
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(
  faHome,
  faUserPlus,
  faSignOutAlt,
  faBell
);

import firebase from "firebase";
import db from "@/firebase/init";
export default {
  name: "Navbar",
  data() {
    return {
      isAnimateAdded: false,
    };
  },
  created() {
    this.currentUser = this.$session.get("user");

    if (this.currentUser) {
      if (this.$route.name === "Notifications") {
        this.updateNotificationsSeenStatus();
      } else {
        this.notificationCount=this.$session.get('notificationCount')
        if (this.$session.get("isNotificationReset")) {
          this.bildirimSifirlamaDurumDegistir();
        }
        this.getNotifications()
      }
    }
  },
  methods: {
    updateNotificationsSeenStatus() {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            db.collection("notifications")
              .doc(doc.id)
              .update({
                seenStatus: true
              });
          });
        })
        .then(() => {
          this.$session.set("notificationCount", 0);
          this.notificationIdList = [];
          console.log(this.$session.get("notificationCount"));
          this.getNotifications()
          console.log(this.$session.get("notificationCount"));
          console.log("selam")
        });
    },
    bildirimSifirla() {
      this.$session.set("notificationCount", 0);
      this.notificationCount = this.$session.get("notificationCount");
    },
    bildirimSifirlamaDurumDegistir() {
      this.$session.set("isNotificationReset", false);
      this.notificationIdList = [];
      this.bildirimSifirla();
    },
    addNotification(id) {
      let notificationIndex = this.notificationIdList.findIndex(notificationId => {
        return notificationId == id;
      });
      if (notificationIndex === -1) {
        console.log("Eklendi");
        this.notificationIdList.push(id);
        this.$session.set("notificationCount", this.notificationIdList.length);
        this.notificationCount = this.$session.get("notificationCount");
        console.log(this.notificationIdList);
        console.log(this.notificationCount);
      }
    },
    createNotificationAnimation() {
      this.isAnimateAdded = true;
      window.setTimeout(() => {
        this.isAnimateAdded = false;
      }, 2500);
    },


getNotifications(){

      db.collection("notifications")
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type == "added") {
              let doc = change.doc;
              let receiverEmail = doc.data().receiverEmail;
              let seenStatus = doc.data().seenStatus;
              if (this.currentUser.email == receiverEmail && !seenStatus) {
                this.addNotification(doc.id);
                this.createNotificationAnimation();
              }
            }
          });
        });



},
    logout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
     //   this.aktifOyunKullaniciSil();
          this.sessionSifirla();
          this.$router.push({ name: "Login" });
        });
    },
    oyundanCik() {
      this.kullaniciOyunDurumDegistir();
      this.oyunSessionSil();
      this.$router.push({ name: "Home" });
    },
    oyunSessionSil() {
      this.$session.remove("rakipOyuncu");
      this.$session.remove("oyunNo");
    },
    sessionSifirla() {
      this.$session.remove("rakipOyuncu");
      this.$session.remove("oyunNo");
      this.$session.remove("user");
      this.$session.remove("notificationCount");
      this.$session.remove("isNotificationReset");
    },
    aktifOyunKullaniciSil() {
      let ref = db.collection("game_users");
      if (this.$session.exists("rakipOyuncu")) {
        let rakipOyuncu = this.$session.get("rakipOyuncu");
        ref.doc(rakipOyuncu.email).update({
          is_play: false
        });
      }
      ref.doc(this.currentUser.email).delete();
    },
    kullaniciOyunDurumDegistir() {
      let rakipOyuncu = this.$session.get("rakipOyuncu");
      let ref = db.collection("game_users");
      ref.doc(this.currentUser.email).update({
        is_play: false
      });
      ref.doc(rakipOyuncu.email).update({
        is_play: false
      });
    }
  }
};
</script>
<style >
@import "../../src/assets/css/animate.css";
@import "../../src/assets/css/materialize.min.css";
.brand-logo {
  display: flex !important;
  align-items: center;
}
.brand-logo .material-icons {
  font-size: 1em;
}
.font-awesome-size {
  font-size: 1.5em;
}
.fa-home {
  font-size: 1em;
}
.bell-on {
  color: lime;
}
.bell-badge {
  position: absolute;
  top: 4px;
  right: -5px;
  padding: 0 6px;
  line-height: 22px;
  height: 22px;
  border-radius: 50%;
  background: red;
}
</style>

