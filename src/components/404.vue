

<template>
  <div class="not-found container center">
    <img src="../assets/img/not-found-icon.svg" alt style="width:25%" />

    <h1>404</h1>
    <hr>
    <h5>Aradığınız sayfa bulunamadı.</h5>
    <p>Sayfa kaldırılmış, değiştirilmiş ya da geçici olarak kullanım dışı olabilir.</p>

    <router-link :to="{name:'Home'}">Anasayfa'ya Geri Dön</router-link>
  </div>
</template>

<script>
export default {
  name: "NotFound",
  data() {
    return {};
  },
};

</script>
 
<style  scoped>
 
.not-found {
  margin-top: 5em;
}
</style>