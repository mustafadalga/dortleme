  <template>
  <div id="notifications">
    <Navbar />
    <div class="ratings container">
      <div class="card">
<h2 class="center deep-purple-text" style="padding:.5em">Ratings</h2>
     
           
      <ul class="collection">
        <li class="collection-item row font-bold">
          <div class="collection-number col s2 m1">Sıralama</div>
          <div class="collection-username col s7 m4 offset-m1">
            <span>Kullanıcı</span>
          </div>
          <div class="collection-rating col s3 m1 offset-m1">Puan</div>
        </li>
        <li class="collection-item row" v-for="(score,index) in sortedScores" :key="index">
          <div class="collection-number col s2 m1 font-bold" >{{ index+1 }}</div>
          <div class="collection-username col s7 m4 offset-m1">
            <span>{{ score.username }}</span>
          </div>
          <div class="collection-rating col s3 m1 offset-m1">{{ score.score }}</div>
        </li>
      </ul>
    </div>
     </div>
  </div>
</template>

<script>
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faUser);
import db from "@/firebase/init";
//import firebase from "firebase";
import Navbar from "@/components/Navbar";

export default {
  name: "Ratings",
  components: {
    Navbar
  },
  data() {
    return {
      scores: []
    };
  },
  created() {
    this.getUsersScore();
  },
  computed: {
    sortedScores: function() {
      return this.scores.slice().sort(function(a, b) {
        return a.score < b.score ? 1 : -1;
      });
    }
  },
  methods: {
  
    getUsersScore() {
      db.collection("scores").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          let doc = change.doc;
          var score = {
            username: doc.data().username,
            score: doc.data().score
          };
          if (change.type === "added") {
            let scoreIndex = this.scores.findIndex(
              element => element.username === score.username
            );
            if (scoreIndex === -1) {
              this.scores.push(score);
            }
          } else if (change.type == "modified") {
            this.scores = this.scores.filter(element => {
              return element.username !== score.username;
            });
            this.scores.push(score);
          }
        });
      });
    }
  }
};
</script>

<style lang="css" scoped>
.collection-item {
  display: flex;
  align-items: center;
}
.font-bold {
  font-weight: bold;
}
.collection-number {
  text-align: center;
  margin-left: 0px !important;
}
.collection-username {
  text-align: center;
}
.collection-username span {
  margin-left: 1em;
}
.collection-rating {
  text-align: center;
}
</style>
