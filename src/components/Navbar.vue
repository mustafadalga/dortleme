<template>
  <nav class="deep-purple darken-1">
    <div class="container">
      <router-link :to="{name:'Home'}" class="brand-logo left">
        <font-awesome-icon :icon="['fas', 'home']" />
        <span class="brand-text">Connection 4</span>
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
          <a @click="oyunCikis">
            <font-awesome-icon :icon="['fas', 'times-circle']" class="font-awesome-size" />
          </a>
        </li>
        <li v-if="currentUser" class="rating-logo">
          <router-link
            :to="{name:'Ratings'}"
            style="position:relative;"
            @click.native="bildirimSifirla"
          >
            <img src="../assets/img/rating.png" />
          </router-link>
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
  faSignInAlt,
  faBell,
  faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(
  faHome,
  faUserPlus,
  faSignOutAlt,
  faBell,
  faTimesCircle,
  faSignInAlt
);

import firebase from "firebase";
import db from "@/firebase/init";
export default {
  name: "Navbar",
  data() {
    return {
      isAnimateAdded: false,
      oyunNo: null
    };
  },
  created() {
    this.currentUser = this.$session.get("user");

    if (this.currentUser) {
      if (this.$session.exists("oyunNo")) {
        this.oyunNo = this.$session.get("oyunNo");
      }

      if (this.$route.name === "Notifications") {
        this.updateNotificationsSeenStatus();
      } else {
        this.notificationCount = this.$session.get("notificationCount");
        if (this.$session.get("isNotificationReset")) {
          this.bildirimSifirlamaDurumDegistir();
        }
        this.getNotifications();
        this.deleteRejectedRequest()
      }
    }
  },
  methods: {
    bildirimSifirla() {
      console.log("bildirim sıfırlandı");

      this.$session.set("notificationCount", 0);
      this.notificationCount = this.$session.get("notificationCount");
      console.log(this.notificationCount);
    },
    bildirimSifirlamaDurumDegistir() {
      this.$session.set("isNotificationReset", false);
      this.notificationIdList = [];
      this.bildirimSifirla();
    },
    addNotification(id) {
      let notificationIndex = this.notificationIdList.findIndex(
        notificationId => {
          return notificationId === id;
        }
      );
      if (notificationIndex === -1) {
        console.log("Eklendi");
        this.notificationIdList.push(id);
      } else {
        console.log("eklendmedi:" + id);
      }
      this.$session.set("notificationCount", this.notificationIdList.length);
      this.notificationCount = this.$session.get("notificationCount");
      console.log(this.notificationIdList);
      console.log(this.notificationCount);
    },
    createNotificationAnimation() {
      this.isAnimateAdded = true;
      window.setTimeout(() => {
        this.isAnimateAdded = false;
      }, 2500);
    },
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
          this.getNotifications();
          console.log(this.$session.get("notificationCount"));
        });
    },
    deleteRejectedRequest() {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("seenStatus", "==",true)
        .where("statusCode", "==", 2)
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            db.collection("notifications")
              .doc(doc.id)
              .delete();
          });
        });
    },
    getNotifications() {
      db.collection("notifications").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          let doc = change.doc;
          if (change.type == "added") {
            let receiverEmail = doc.data().receiverEmail;
            let seenStatus = doc.data().seenStatus;
            if (this.currentUser.email === receiverEmail && !seenStatus) {
              this.addNotification(doc.id);
              this.createNotificationAnimation();
              console.log("bildirim geldi");
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
          this.onlineKullaniciSil();
          this.sessionSifirla();
          this.$router.push({ name: "Login" });
        });
    },
    oyunCikis() {
      this.$emit("openExitGameConfirmModal");
    },
    onlineKullaniciSil() {
      db.collection("game_users")
        .doc(this.currentUser.email)
        .delete();
    },
    sessionSifirla() {
      this.$session.clear();
    }
  }
};
</script>
<style >
@import "../assets/css/animate.css";
@import "../assets/css/materialize.min.css";
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
.brand-text {
  margin-left: 8px;
}
.rating-logo,
.rating-logo a {
  max-height: 64px;
}
.rating-logo img {
  margin-top: 20px;
}
@media (max-width: 600px) {
  .brand-text {
    font-size: 0.7em;
  }
  .rating-logo,
  .rating-logo a {
    max-height: 56px;
  }
  .rating-logo img {
    margin-top: 16px;
  }
}
@media (max-width: 320px) {
  .brand-text {
    font-size: 0.5em;
  }
}
</style>

