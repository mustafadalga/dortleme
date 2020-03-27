<template>
  <div id="game">
    <Navbar @openExitGameConfirmModal="openExitGameConfirmModal" />
    <button @click="dbreset">Sıfırla</button>
    <div class="container center">
      <div class="row">
        <div class="col s6 m3">
          <div
            class="z-depth-1 white-text bg-red card-red-team"
            :class="hamleSirasi==baslayanOyuncu ? 'aktif-takim-border' : ''"
          >
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="player-name"
            >{{ baslayanOyuncu==currentUser.email ? currentUser.username : rakip.username }}</span>

            <span
              class="btn-floating waves-effect waves-light skor skor-bg-red"
            >{{ baslayanOyuncu==currentUser.email ? currentUserSkor : rakipSkor }}</span>
          </div>
        </div>

        <div class="col s6 m3 offset-m6">
          <div
            class="z-depth-1 white-text bg-green card-green-team"
            :class="hamleSirasi!=baslayanOyuncu ? 'aktif-takim-border' : ''"
          >
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="player-name"
            >{{ baslayanOyuncu==currentUser.email ? rakip.username : currentUser.username }}</span>
            <span
              class="btn-floating waves-effect waves-light bg-green skor"
            >{{ baslayanOyuncu==currentUser.email ? rakipSkor: currentUserSkor }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="dortleme-container">
      <div class="dortleme">
        <div v-for="row in 6" :key="row" class="row-container">
          <div v-for="col in 8" :key="col" :style="zIndexStyle ? 'z-index:-2' : null">
            <div @click="hamle" :class="renkYerlestir(row,col)" class="hucre" :row="row" :col="col"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="alert-bottom-container">
      <div class="alert-bottom scale-transition" :class="gameStartScaleCSS">
        <div class="msg msg-info z-depth-2" v-if="isOpenGameStartCountDownAlert">
          <span v-if="!oyunBeklemeSuresiDolduMu">Rakip oyuncu bekleniliyor...</span>
          <span>{{ gameStartCountDown>0 ? ("00:"+(gameStartCountDown>9 ? gameStartCountDown : "0"+gameStartCountDown)) : gameStartCountDown==null ? "": "Süre Doldu!" }}</span>
        </div>
      </div>
    </div>

    <div class="alert-bottom-container">
      <div class="alert-bottom scale-transition" :class="moveScaleCSS">
        <div class="msg msg-info z-depth-2" v-if="isOpenMoveCountDownAlert">
          <span
            v-if="!hamleBeklemeSuresiDolduMu"
          >{{ moveCountDown>0 ? "Hamle yapmak için kalan süre:"+("00:"+(moveCountDown>9 ? moveCountDown : "0"+moveCountDown)) : "Süre Doldu!"}}</span>
          <span
            v-else
          >Hamle sırası gelen oyuncu:{{ hamleSirasi==currentUser.email ? currentUser.username : rakip.username }}</span>
        </div>
      </div>
    </div>

    <notifications position="bottom center" group="alert" />

    <div v-if="oyunDurumNo===1 || oyunDurumNo===2">
      <ExitGameConfirmModal
        @oyunCikis="oyunCikis"
        :oyunDurumNo="oyunDurumNo"
        @modalClose="modalClose"
      />
    </div>
    <div v-else-if="oyunDurumNo>2 && oyunDurumNo<8">
      <GameOverModal
        @yeniOyun="yeniOyun"
        @oyunCikis="oyunCikis"
        :kazananOyuncu="kazananOyuncu"
        :currentUserSkor="currentUserSkor"
        :rakipSkor="rakipSkor"
        :oyunDurumNo="oyunDurumNo"
      />
    </div>
  </div>
</template>


<script>
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faUser);

import db from "@/firebase/init";
import Navbar from "@/components/Navbar";
import GameOverModal from "@/components/GameOverModal";
import ExitGameConfirmModal from "@/components/ExitGameConfirmModal";
import HamleSoundFile from "@/assets/sound/hamle.mp3";
import WinnerSoundFile from "@/assets/sound/winner.mp3";

export default {
  name: "Game",
  components: {
    Navbar,
    GameOverModal,
    ExitGameConfirmModal
  },
  data() {
    return {
      aktifTakim: null,
      takimNo: null,
      hamleler: [],
      yesilHamleSayisi: 0,
      kirmiziHamleSayisi: 0,
      row: null,
      col: null,
      renk: null,
      rakip: null,
      oyunNo: null,
      gameStartScaleCSS: "scale-out",
      moveScaleCSS: "scale-out",
      baslayanOyuncu: null,
      hamleSirasi: null,
      kazananOyuncu: null,
      rakipSkor: null,
      currentUserSkor: null,
      isOpenGameStartCountDownAlert: true,
      isOpenMoveCountDownAlert: false,
      oyuncuKadroTamamMi: false,
      oyunBittiMi: false,
      timeoutHandleGameStart: null,
      timeoutHandleMove: null,
      gameStartCountDown: null,
      moveCountDown: null,
      oyunDurumNo: null,
      oyunBeklemeSuresiDolduMu: false,
      hamleBeklemeSuresiDolduMu: false,
      zIndexStyle: false,
      dortluKonumlar: []
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.updatePlayersPlayingStatus(true);
    this.oyunNo = this.$session.get("oyunNo");
    this.whichPlayerStart();
    this.rakip = this.$session.get("rakipOyuncu");
    this.hamlelerListele();
    this.kazananOyuncuGetir();
    this.skorGetir();
    this.oyuncuKadroTamamlandiMi();
    this.rakipOyuncuBeklemeSuresiGoster();
    this.hamleBeklemeSuresiGoster();
    console.log()
  },
  methods: {
    updatePlayersPlayingStatus(status) {
      let ref = db.collection("game_users");
      ref.doc(this.currentUser.email).update({
        is_play: status
      });
    },
    hamleSoundEfeck() {
      var snd = new Audio(HamleSoundFile);
      snd.play();
    },
    WinnerSoundEfeck() {
      var snd = new Audio(WinnerSoundFile);
      snd.play();
    },

    hamleBeklemeSuresiOlustur() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("oyunNo", "==", this.oyunNo)
          .where("hamleYapanOyuncu", "in", [
            this.currentUser.email,
            this.rakip.email
          ])
          .get()
          .then(querySnapshot => {
            if (querySnapshot.size === 0) {
              //       this.hamleBeklemeSuresiDolduMu = false;
              let simdikiZaman = new Date();
              let beklemeSuresi = 60 * 1000;
              let bitisTarih = new Date(simdikiZaman.getTime() + beklemeSuresi);
              db.collection("game_waits")
                .add({
                  oyunNo: this.oyunNo,
                  hamleYapanOyuncu: this.currentUser.email,
                  simdikiZaman: simdikiZaman,
                  bitisTarih: bitisTarih
                })
                .then(() => resolve(true))
                .catch(() => reject(false));
            }
          })
          .then(() => {
            /*
            console.log(this.takimNo);
            console.log(this.aktifTakim);
            console.log(this.hamleSirasi);
            */
          });
      });
    },
    hamleBeklemeSuresiGuncelle(moveCountDownId) {
      return new Promise((resolve, reject) => {
        let ref = db.collection("game_waits");
        ref
          .doc(moveCountDownId)
          .get()
          .then(doc => {
            if (doc.exists) {
              ref
                .doc(moveCountDownId)
                .update({
                  simdikiZaman: new Date()
                })
                .then(() => resolve(true))
                .catch(() => {
                  this.hamleBeklemeSuresiGuncelle(moveCountDownId);
                  reject(false);
                });
            }
          });
      });
    },
    kalanSuresiGetir(datetime) {
      let simdikiZaman = datetime.simdikiZaman.seconds;
      let bitisTarih = datetime.bitisTarih.seconds;
      return bitisTarih - simdikiZaman;
    },
    hamleBeklemeSuresiGoster() {
      window.clearTimeout(this.timeoutHandleMove);
      let ref = db.collection("game_waits");
      ref.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.data().oyunNo == this.oyunNo &&
            change.doc.data().hamleYapanOyuncu &&
            !this.hamleBeklemeSuresiDolduMu
          ) {
            this.moveScaleCSS = "scale-in";
            this.hamleBeklemeSuresiDolduMu = false;
            this.moveCountDown = this.kalanSuresiGetir(change.doc.data());
            //   console.log(this.kazananOyuncu)
            if (this.moveCountDown >= 0) {
              let moveCountDownId = change.doc.id;
              if (
                change.doc.data().hamleYapanOyuncu === this.currentUser.email &&
                this.kazananOyuncu === null
              ) {
                this.timeoutHandleMove = setTimeout(() => {
                  this.hamleBeklemeSuresiGuncelle(moveCountDownId);
                }, 1000);
                this.moveCountDown <= 60
                  ? (this.isOpenMoveCountDownAlert = true)
                  : null;
              }
            } else {
              window.clearTimeout(this.timeoutHandleMove);
              if (!this.hamleBeklemeSuresiDolduMu) {
                this.hamleBeklemeSuresiDolduMu = true;
                this.hamleBeklemeSuresiSil();
                this.takimDegistir();
                if (this.hamleSirasi === this.currentUser.email) {
                  this.hamleSirasiDegistir();
                  setTimeout(() => {
                    console.log("yeni oluşturuluyor 23");
                    this.hamleBeklemeSuresiOlustur();
                  }, 2000);
                }
                setTimeout(() => {
                  (this.moveScaleCSS = "scale-out"),
                    (this.isOpenMoveCountDownAlert = false);
                  this.hamleBeklemeSuresiDolduMu = false;
                }, 3000);
              }
            }
          }
        });
      });
    },
    hamleBeklemeSuresiSil() {
      db.collection("game_waits")
        .where("oyunNo", "==", this.oyunNo)
        .where("hamleYapanOyuncu", "in", [
          this.currentUser.email,
          this.rakip.email
        ])
        .get()
        .then(docs => {
          docs.forEach(doc => {
            db.collection("game_waits")
              .doc(doc.id)
              .delete();
            console.log("silindi");
          });
        });
    },
    hamleBeklemeSuresiYenidenBaslat() {
      db.collection("game_waits")
        .where("oyunNo", "==", this.oyunNo)
        .where("hamleYapanOyuncu", "in", [
          this.currentUser.email,
          this.rakip.email
        ])
        .get()
        .then(docs => {
          docs.forEach(doc => {
            db.collection("game_waits")
              .doc(doc.id)
              .delete();
            console.log("silindi");
          });
        })
        .then(() => {
          this.hamleBeklemeSuresiOlustur();
        });
    },
    rakipOyuncuBeklemeSuresiGoster() {
      window.clearTimeout(this.timeoutHandleGameStart);
      let ref = db.collection("game_waits");
      ref.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.data().oyunNo == this.oyunNo
          ) {
            if (!this.oyuncuKadroTamamMi && this.oyunDurumNo == null) {
              let simdikiZaman = change.doc.data().simdikiZaman.seconds;
              let bitisTarih = change.doc.data().bitisTarih.seconds;
              let kalanSure = bitisTarih - simdikiZaman;
              if (kalanSure > 0) {
                this.gameStartCountDown = kalanSure <= 45 ? kalanSure : null;
                let gameStartCountDownTimerId = change.doc.id;
                this.timeoutHandleGameStart = setTimeout(() => {
                  db.collection("game_waits")
                    .doc(gameStartCountDownTimerId)
                    .get()
                    .then(doc => {
                      if (doc.exists) {
                        db.collection("game_waits")
                          .doc(gameStartCountDownTimerId)
                          .update({
                            simdikiZaman: new Date()
                          });
                      }
                    });
                }, 1000);
              } else {
                this.oyunBeklemeSuresiDolduMu = true;
                window.clearTimeout(this.timeoutHandleGameStart);
                this.oyunBeklemeSuresiSil();
                this.kazananOyuncuEkle(this.currentUser.email);
                this.skorArtir(this.rakip.email);
                setTimeout(() => {
                  this.oyunDurumNo = 4;
                }, 2000);
              }
            }
          }
        });
      });
    },
    oyunBeklemeSuresiSil() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("oyunNo", "==", this.oyunNo)
          .where("waitingPlayer", "in", [
            this.currentUser.email,
            this.rakip.email
          ])
          .get()
          .then(docs => {
            docs.forEach(doc => {
              db.collection("game_waits")
                .doc(doc.id)
                .delete();
            });
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    hamleBeklemeSuresiVarmi() {
      var durum = false;
      db.collection("game_waits")
        .where("oyunNo", "==", this.oyunNo)
        .where("hamleYapanOyuncu", "in", [
          this.currentUser.email,
          this.rakip.email
        ])
        .get()
        .then(querySnapshot => {
          if (querySnapshot.size > 0) {
            durum = true;
          } else {
            durum = false;
          }
        })
        .then(() => {
          if (!durum) {
            this.hamleBeklemeSuresiOlustur();
          }
        });
    },
    oyunKadroTamamlanmaDurumAlert(){
    if (this.$session.get("oyunKadroTamamMi") === undefined || this.$session.get('oyunKadroTamamMi')===false) {
                this.notificationAlert(
                  "success",
                  "Kadro Tamamlandı",
                  "Rakip oyuncu oyuna dahil oldu.Oyun başladı."
                );
              }
    },
    oyuncuKadroTamamlandiMi() {
      db.collection("game_rooms")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (
              (change.type == "modified" || change.type == "added") &&
              change.doc.data().oyuncuKadroTamamMi &&
              change.doc.data().kazananOyuncu === null
            ) {
              this.oyunKadroTamamlanmaDurumAlert()
              this.oyunDurumNo = 0;
              window.clearTimeout(this.timeoutHandleGameStart);
              if (!this.oyuncuKadroTamamMi) {
                this.isOpenGameStartCountDownAlert = false;
                this.isOpenMoveCountDownAlert = true;
                this.oyuncuKadroTamamMi = true;
                this.$session.set("oyunKadroTamamMi", true);
                this.oyunBeklemeSuresiSil();
                if (
                  change.doc.data().oyunuBaslatanEmail ===
                  this.currentUser.email
                ) {
                  setTimeout(() => {
                    console.log("yeni oyun başlatıldı");
                    this.hamleBeklemeSuresiOlustur();
                  }, 3000);
                }
              }

              if (!this.$session.get("oyunKadroTamamMi")) {
                window.setTimeout(() => {
                  this.gameStartScaleCSS = "scale-out";
                }, 2000);
              }


            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().oyuncuKadroTamamMi === false &&
              change.doc.data().oyunDurumNo === 0
            ) {
              if (this.oyunDurumNo !== 0) {
                this.gameStartScaleCSS = "scale-in";
                this.$session.set("oyunKadroTamamMi", false);
                console.log(this.$session.get('oyunKadroTamamMi'))
              }
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().oyunDurumNo == 1
            ) {
              this.oyunDurumNo = 3;
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().oyunDurumNo === 7
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
            }

            if (
              (change.type == "added" || change.type == "modified") &&
              change.doc.data().oyunDurumNo == 5
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
            } else if (
              (change.type == "added" || change.type == "modified") &&
              change.doc.data().oyunDurumNo == 6
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
            }
          });
        });
    },
    notificationAlert(messageType, title, text) {
      this.$notify({
        group: "alert",
        title: title,
        text: text,
        type: messageType
      });
    },
    openExitGameConfirmModal() {
      if (this.oyuncuKadroTamamMi) {
        this.oyunDurumNo = 1;
      } else {
        this.oyunDurumNo = 2;
      }
    },
    modalClose() {
      this.oyunDurumNo = null;
    },
    oyunCikis() {
      this.updatePlayersPlayingStatus(false);
      if (this.oyunDurumNo == 1) {
        this.oyuncuKadroDegistir(false);
        this.hamleBeklemeSuresiSil();
        this.oyuncuDurumNoDegistir(1);
        this.bildirimSil();
        this.kazananOyuncuEkle(this.rakip.email);
        this.skorArtir(this.rakip.email);
      } else if (this.oyunDurumNo === 2) {
        this.oyunDurumNo = 0;
        this.bildirimSil();
        this.oyunSil();
        this.oyunBeklemeSuresiSil();
      } else if (this.oyunDurumNo === 3) {
        this.oyunHamleSil();
        this.oyunSil();
      } else if (this.oyunDurumNo === 4) {
        this.bildirimSil();
        this.oyunHamleSil();
        this.oyunSil();
      } else if (this.oyunDurumNo === 5 || this.oyunDurumNo === 6) {
        this.oyuncuKadroDegistir(false);
        this.oyuncuDurumNoDegistir(7);
        this.bildirimSil();
      } else if (this.oyunDurumNo === 7) {
        this.oyunHamleSil();
        this.bildirimSil();
        this.oyunSil();
      }
      this.oyunSessionSil();
      this.$router.push({ name: "Home" });
    },
    bildirimSil() {
      let rakip = this.$session.get("rakipOyuncu");
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("senderEmail", "==", rakip.email)
        .get()
        .then(notifications => {
          notifications.forEach(notification => {
            db.collection("notifications")
              .doc(notification.id)
              .delete();
          });
        })
        .then(() => {
          db.collection("notifications")
            .where("receiverEmail", "==", rakip.email)
            .where("senderEmail", "==", this.currentUser.email)
            .get()
            .then(notifications => {
              notifications.forEach(notification => {
                db.collection("notifications")
                  .doc(notification.id)
                  .delete();
              });
            });
        });
    },

    oyuncuKadroDegistir(status) {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          oyuncuKadroTamamMi: status
        });
    },
    oyuncuDurumNoDegistir(no) {
      return new Promise((resolve, reject) => {
        db.collection("game_rooms")
          .doc(this.oyunNo)
          .update({
            oyunDurumNo: no
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    oyunSil() {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .delete();
    },
    oyunSessionSil() {
      this.$session.remove("rakipOyuncu");
      this.$session.remove("oyunNo");
      this.$session.remove("oyunKadroTamamMi");
    },
    oyunHamleSil() {
      db.collection("hamleler")
        .where("oyunNo", "==", this.oyunNo)
        .get()
        .then(hamleler => {
          hamleler.forEach(doc => {
            db.collection("hamleler")
              .doc(doc.id)
              .delete();
          });
        });
    },
    yeniOyun() {
      db.collection("hamleler")
        .where("oyunNo", "==", this.oyunNo)
        .get()
        .then(hamleler => {
          hamleler.forEach(doc => {
            db.collection("hamleler")
              .doc(doc.id)
              .delete();
          });
        });
      this.kazananOyuncuSifirla();
      this.oyuncuDurumNoDegistir(0);
      setTimeout(() => {
        this.hamleBeklemeSuresiOlustur();
      }, 1500);
    },
    oyunVerileriSifirla() {
      this.moveCountDown = null;
      this.hamleBeklemeSuresiDolduMu = false;
      this.isOpenMoveCountDownAlert = true;
      this.oyunBittiMi = false;
      this.oyunDurumNo = null;
      this.hamleler = [];
    },
    whichPlayerStart() {
      let ref = db.collection("game_rooms").doc(this.oyunNo);
      ref
        .get()
        .then(doc => {
          this.baslayanOyuncu = doc.data().oyunuBaslatanEmail;
          this.hamleSirasi = doc.data().oyunuBaslatanEmail;
        })
        .then(() => {
          if (this.hamleSirasi == this.currentUser.email) {
            this.aktifTakim = 1;
          } else {
            this.aktifTakim = 2;
          }
        })
        .then(() => {
          this.hamleSırasiGetir();
        });
    },
    hamleSirasiBendeMi() {
      if (this.hamleSirasi === this.currentUser.email) {
        return true;
      } else {
        return false;
      }
    },
    oyunBasladiMi() {
      if (this.oyuncuKadroTamamMi) {
        return true;
      } else {
        return false;
      }
    },
    hamleYapilsinMi() {
      if (this.oyunBasladiMi()) {
        if (this.hamleSirasiBendeMi()) {
          return true;
        } else {
          this.notificationAlert(
            "error",
            "Hamle Sırası",
            "Hamle sırası rakip oyuncuda.Hamle yapamazsınız!"
          );
          return false;
        }
      } else {
        this.notificationAlert(
          "error",
          "Rakip Bekleniliyor...",
          "Rakip oyuncu " + this.rakip.username + " oyuna dahil olmadı."
        );
        return false;
      }
    },
    hamle(event) {
      if (this.hamleYapilsinMi()) {
        this.zIndexStyle = true;
        setTimeout(() => {
          this.zIndexStyle = false;
        }, 1500);
        this.hamleSoundEfeck();
        const col = parseInt(event.target.attributes.col.value);
        let enAltSatir = this.altSatirBul(col);
        if (enAltSatir) {
          this.row = enAltSatir;
          this.col = col;
          this.renk = this.takimRenkGetir();
          this.takimNo = this.aktifTakim;
          this.takimDegistir();
          this.hamleKaydet();
          this.hamleSirasiDegistir();

          window.clearTimeout(this.timeoutHandleMove);
          setTimeout(() => {
            if (
              !this.hamleBeklemeSuresiDolduMu &&
              this.kazananOyuncu === null
            ) {
              this.hamleBeklemeSuresiDolduMu = true;
              console.log("oluşturuldu");
              this.hamleBeklemeSuresiYenidenBaslat();
            }
          }, 2000);
        } else {
          this.notificationAlert(
            "error",
            "Uyarı",
            "Hamle yapmak istediğiniz satir dolu."
          );
        }
      }
    },
    hamlelerListele() {
      db.collection("hamleler")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === "added" || change.type === "modified") {
              let doc = change.doc.data();

              let hamleIndex = this.hamleIndexGetir(doc.row, doc.col);
              if (!this.hamleVarmi(hamleIndex)) {
                this.hamleler.push({
                  row: doc.row,
                  col: doc.col,
                  renk: doc.renk
                });
                this.aktifTakim = doc.aktifTakim;
                this.takimNo = doc.takimNo;
                this.takimHamleSayisiArtir();
              } else {
          //      this.hamleler[hamleIndex].row = doc.row;
            //    this.hamleler[hamleIndex].col = doc.col;
                this.hamleler[hamleIndex].renk = doc.renk;
              }
            }
          });
        });
    },
    hamleSirasiDegistir() {
      var ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.update({
        hamleSirasi: this.rakip.email
      });
    },
    hamleSırasiGetir() {
      db.collection("game_rooms")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type == "modified" || change.type == "added") {
              this.hamleSirasi = change.doc.data().hamleSirasi;
            }
          });
        });
    },
    sonHamleGetir() {
      db.collection("hamleler")
        .orderBy("timestamp")
        .limitToLast(1)
        .get()
        .then(() => {
          this.oyunuKazandiMi(this.row, this.col);
        });
    },
    hamleIndexGetir(row, col) {
      return this.hamleler.findIndex(hamle => {
        return hamle.row === row && hamle.col === col;
      });
    },
    hamleVarmi(hamleIndex) {
      if (hamleIndex === -1) {
        return false;
      } else {
        return true;
      }
    },
    hamleKaydet() {
      let hamleIndex = this.hamleIndexGetir(this.row, this.col);
      if (!this.hamleVarmi(hamleIndex)) {
        db.collection("hamleler")
          .add({
            row: this.row,
            col: this.col,
            renk: this.renk,
            takimNo: this.takimNo,
            aktifTakim: this.aktifTakim,
            oyunNo: this.oyunNo,
            timestamp: Date.now()
          })
          .then(() => {
            this.sonHamleGetir();
          });
      }
    },
    dbreset() {
      this.hamleler = [];
      var jobskill_query = db
        .collection("hamleler")
        .where("oyunNo", "==", this.oyunNo);
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    },
    caprazKontrol(satirNo, sutunNo) {
      this.dortluKonumlar = [];
      let hucreSayisi = 0;

      hucreSayisi = this.caprazAsagiSolKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }

      hucreSayisi = this.caprazYukariSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }

      hucreSayisi = 0;
      this.dortluKonumlar = [];
      hucreSayisi = this.caprazAsagiSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }

      hucreSayisi = this.caprazYukariSolKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }
    },
    caprazYukariSolKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      satirNo--;
      for (let sutun = sutunNo - 1; sutun > 0; sutun--) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({ row: satirNo, col: sutun });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        satirNo--;
      }
      return hucreSayisi;
    },
    caprazAsagiSagKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      for (let sutun = sutunNo; sutun < 9; sutun++) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({ row: satirNo, col: sutun });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo < 7) {
          satirNo++;
        }
      }
      return hucreSayisi;
    },
    caprazAsagiSolKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      for (let sutun = sutunNo; sutun > 0; sutun--) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({ row: satirNo, col: sutun });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo < 7) {
          satirNo++;
        }
      }
      return hucreSayisi;
    },
    caprazYukariSagKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      satirNo--;
      for (let sutun = sutunNo + 1; sutun < 9; sutun++) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({ row: satirNo, col: sutun });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo > 0) {
          satirNo--;
        }
      }
      return hucreSayisi;
    },
    dikeyKontrol(satirNo, sutunNo) {
      let hucreSayisi = this.dikeyYukaridanKontrol(satirNo, sutunNo);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }
    },
    dikeyYukaridanKontrol(satirNo, sutunNo) {
      let hucreSayisi = 0,
        renkKodu = 0;
      for (let index = satirNo; index < 7; index++) {
        renkKodu = this.hucreRenginiGetir(index, sutunNo);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({
            row: index,
            col: sutunNo
          });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
      return hucreSayisi;
    },
    yatayKontrol(satirNo, sutunNo) {
      this.dortluKonumlar = [];
      let hucreSayisi = this.yataySoldanKontrol(satirNo, sutunNo);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      } else {
        hucreSayisi = this.yataySagdanKontrol(hucreSayisi, satirNo, sutunNo);
        if (this.dortluTamamlandimi(hucreSayisi)) {
          this.oyunTamamlandi();
        }
      }
    },

    yataySagdanKontrol(hucreSayisi, satirNo, sutunNo) {
      let renkKodu = 0;
      for (let index = sutunNo + 1; index < 9; index++) {
        renkKodu = this.hucreRenginiGetir(satirNo, index);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({
            row: satirNo,
            col: index
          });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
    },
    yataySoldanKontrol(satirNo, sutunNo) {
      let hucreSayisi = 0,
        renkKodu = 0;
      for (let index = sutunNo; index > 0; index--) {
        renkKodu = this.hucreRenginiGetir(satirNo, index);
        if (renkKodu == this.takimNo) {
          this.dortluKonumlar.push({
            row: satirNo,
            col: index
          });
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
      return hucreSayisi;
    },
    takimRenkGetir() {
      if (this.aktifTakim == 1) {
        return "bg-red animated bounceInDown";
      } else if (this.aktifTakim == 2) {
        return "bg-green  animated bounceInDown";
      }
    },
    dortluTamamlandimi(hucreSayisi) {
      if (hucreSayisi == 4) {
        return true;
      } else {
        return false;
      }
    },
    kazananOyuncuEkle(oyuncu) {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          kazananOyuncu: oyuncu
        });
    },
    kazananOyuncuSifirla() {
      return new Promise((resolve, reject) => {
        if (this.kazananOyuncu) {
          db.collection("game_rooms")
            .doc(this.oyunNo)
            .update({
              kazananOyuncu: null,
              hamleSirasi: this.currentUser.email
            })
            .then(() => resolve(true))
            .catch(() => reject(false));
        }
      });
    },
    kazananOyuncuGetir() {
      db.collection("game_rooms").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.oyunNo &&
            change.doc.data().kazananOyuncu &&
            change.doc.data().oyunDurumNo === 5
          ) {
            this.kazananOyuncu = change.doc.data().kazananOyuncu;
            console.log("kazanan oyuncu getir");
            if (change.doc.data().oyuncuKadroTamamMi) {
              this.WinnerSoundEfeck();
              this.oyunBittiMi = true;
              this.isOpenMoveCountDownAlert = false;
            }
          } else if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.oyunNo &&
            change.doc.data().kazananOyuncu === null &&
            change.doc.data().oyunDurumNo === 0 &&
            this.oyunBittiMi
          ) {
            console.log("Yeni oyun veri sıfırla");
            //console.log(change.doc.data().kazananOyuncu);
            this.kazananOyuncu = null;
            this.notificationAlert(
              "success",
              "Yeni Oyun",
              "Yeni oyun başladı."
            );
            this.oyunVerileriSifirla();
            this.whichPlayerStart();
          }
        });
      });
    },
    skorArtir(oyuncuEmail) {
      db.collection("scores")
        .where("email", "==", oyuncuEmail)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            db.collection("scores")
              .doc(doc.id)
              .update({
                score: doc.data().score + 10
              });
          });
        });
    },
    skorGetir() {
      db.collection("scores").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.currentUser.email
          ) {
            this.currentUserSkor = change.doc.data().score;
          } else if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.rakip.email
          ) {
            this.rakipSkor = change.doc.data().score;
          }
        });
      });
    },
    altSatirBul(sutun) {
      for (let index = 6; index > 0; index--) {
        let hucreKullanilmaDurumu = this.hucreKullanildiMi(index, sutun);
        if (!hucreKullanilmaDurumu) {
          return index;
        }
      }
      return false;
    },
    hucreKullanildiMi(index, sutunNo) {
      if (this.hucreRenginiGetir(index, sutunNo) > 0) {
        return true;
      } else {
        return false;
      }
    },
    hucreRenginiGetir(row, col) {
      const hucre = this.hamleler.find(
        element => element.row == row && element.col == col
      );
      if (hucre) {
        if (hucre.renk.includes("bg-red")) {
          return 1;
        } else if (hucre.renk.includes("bg-green")) {
          return 2;
        } else {
          return 0;
        }
      }
    },
    renkYerlestir(row, col) {
      const hucre = this.hamleler.find(
        element => element.row == row && element.col == col
      );
      if (hucre) {
        return hucre.renk;
      }
      return "";
    },
    takimDegistir() {
      if (this.aktifTakim == 1) {
        this.aktifTakim = 2;
      } else if (this.aktifTakim == 2) {
        this.aktifTakim = 1;
      }
    },
    takimHamleSayisiArtir() {
      if (this.takimNo == 1) {
        this.kirmiziHamleSayisi++;
      } else if (this.takimNo == 2) {
        this.yesilHamleSayisi++;
      }
    },
    dortleyenAnimasyonBaslat() {
      this.dortluKonumlar.forEach(hucre => {
        db.collection("hamleler")
          .where("oyunNo", "==", this.oyunNo)
          .where("row", "==", hucre.row)
          .where("col", "==", hucre.col)
          .get()
          .then(querySnapshot =>
            querySnapshot.forEach(doc => {
              db.collection("hamleler")
                .doc(doc.id)
                .update({
                  renk: "dortluAnimasyon"
                });
            })
          );
      });
    },
    oyunTamamlandi() {
      this.dortleyenAnimasyonBaslat();
      this.oyunBittiMi = true;
      this.hamleBeklemeSuresiDolduMu = true;
      this.isOpenMoveCountDownAlert = false;
      this.yesilHamleSayisi = 0;
      this.kirmiziHamleSayisi = 0;
      this.aktifTakim = null;
      this.takimNo = null;
      this.hamleSirasi = null;
      this.moveCountDown = null;

      setTimeout(() => {
        this.oyuncuDurumNoDegistir(5);
      }, 3000);
      this.kazananOyuncuEkle(this.currentUser.email);
      this.skorArtir(this.currentUser.email);
      this.hamleBeklemeSuresiSil();
    },

    oyunuKazandiMi(satir, sutun) {
      var kontrolYapilsinmi = false;
      if (this.takimNo == 1) {
        if (this.kirmiziHamleSayisi >= 4) {
          kontrolYapilsinmi = true;
        }
      } else if (this.takimNo == 2) {
        if (this.yesilHamleSayisi >= 4) {
          kontrolYapilsinmi = true;
        }
      }
      if (kontrolYapilsinmi) {
        this.dikeyKontrol(satir, sutun);
        if (!this.oyunBittiMi) this.yatayKontrol(satir, sutun);
        if (!this.oyunBittiMi) this.caprazKontrol(satir, sutun);
      }
      if (this.kazananOyuncu === null && this.hamleler.length === 48) {
        this.kazananOyuncuEkle(false);
        this.oyunBittiMi = true;
        this.oyuncuDurumNoDegistir(6);
      }
    }
  }
};
</script>


<style >
</style>
<style lang="css" scoped >
@import "../assets/css/dortleme.css";
</style>