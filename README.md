 # Dörtleme Zeka Oyunu

**Dörtleme, Vue Js ile geliştirilen 2 kişilik online bir zeka oyunudur.**

![dortleme](https://user-images.githubusercontent.com/25087769/78579093-19d3c780-7839-11ea-8c0f-b89b60e39aea.PNG)


## Tanıtım
* İlk olarak 1974 yılında **Milton Bradley** tarafından **Connect Four** ( Dörtleme ) ticari markası altında satılmıştır.
* Farklı ebattaki versiyonları bulunmaktadır.
* Bu oyun ise 6 X 8 ebattaki versiyonuna göre geliştirilmiştir.
* 2 kişilik bir zeka oyunudur.


## Amaç
 * 4 taşınızı ardışık olarak yatay , dikey veya çapraz olacak şekilde ardışık olarak sıralamaktır.
 
 ## Özellikler
* Oyuncu renkleri kırmızı ve yeşil olarak 2 renkten oluşmaktadır.
* Oyuna ilk giriş yapan oyuncu kırmızı , diğer oyuncu ise yeşil renk olarak belirlenmiştir.
* Oyun tahtası, 6 satır ve 8 sütundan oluşan 6 X 8 bir oyun tahtasıdır.
* Toplam yapılabilecek hamle sayısı 6 X 8 = 48 hamledir.

## Nasıl Oynanır ? 
* Yapılan hamlelerde taşlar, oyun tahtası üzerinden seçilen sütundan içeri bırakılır.
* Taşlar sütundan inebilecek en aşağı satıra düşerler. Bu şekilde yapılan hamleler ile satır ve sütunlar aşağıdan yukarıya doğru dolmaya başlar.

![dortleme](https://user-images.githubusercontent.com/25087769/78575291-d3c83500-7833-11ea-8450-a1475eb6ab98.gif)


## Nasıl Kazanılır ? 
* Aynı renkte 4 taşını yatay , dikey veya çaprak olarak ardışık olarak bir araya getiren ilk oyuncu oyunu kazanır.
* Her kazanılan oyun için oyuncu 10 puan kazanır.
* Tüm taşlar yerlerine yerleştirilmelerine rağmen oyuncular kendi renklerinden 4 taşı ardışık olarak sıralayamamış iseler hiçbir takım puan alamaz ve oyun berabere biter.

## Stratejiler 
* Oyunu kazanabilmek için karşınızdaki rakibinizin hamlelerini de düşünerek kendinize oyun planı belirlenemiz gerekir.
* Kendi planımızı uygularken , rakibin hamlelerine de dikkat etmek gerekir.
* Rakibimizin oyununu bozacak şekilde stratejiler üretilmelidir.


## Kısıtlamalar 
* Oyun'a ilk giriş için kullanıcı için , rakibini beklemesi için 1 dakikalık bir bekleme süresi belirlenmiştir.1 dakikalık süre içerisinde rakip oyuncu oyuna dahil olmaz ise , oyuna ilk giriş yapan oyuncu oyunu kazanır.
* Oyuncuların hamle yapmaları için 2 dakikalık bir bekleme süresi belirlenmiştir.2 dakikalık bekleme süresi sonunda aktif oyuncu hamle yapmaz ise , hamle sırası rakip oyuncuya geçer.
* Bir oyun süresince , hamle sırası gelmesine rağmen , yapılmayan hamle sayısı 3 olan oyuncu oyunu kaybeder ve oyun biter.
* Oyun esnasında oyundan çıkan oyuncu, hükmen mağlup olup oyunu kaybeder.
* Oyuna giriş yapan ilk oyuncu , rakip oyuncu gelmeden oyundan çıkış yaparsa aktif oyun iki taraftan silinir ve oyun biter.

 ## Kazanımlar
  * Dikkat geliştirme
  * Soyut düşünme
  * Strateji geliştirme
  * Düşünme becerisi geliştirme.
  * Farklı bakış açıları kazanma.


## Kullanılan Teknolojiler
* Vue JS
* Firebase
* Materialize CSS
* HTML 5
* CSS 3
* Animate CSS
* Vue Notification  
* Font Awesome

## Notlar 
* Oyun (Responsive) Mobil uyumludur.
* Oyun eksikleri geliştirilip ,hataların giderilmesi için çalışmalar devam ediliyor.

## Oyun Bağlantı Adresi
* [Dörtleme](https://dortleme.firebaseapp.com)

<br>
<br>
 
## Kurulum

#### Proje kurulumu
```
npm install
```

#### Projeyi çalıştırma
```
npm run serve
```
<br>
<br>


## Oyun Görüntüleri

#### Online Kullanıcılar
![home](https://user-images.githubusercontent.com/25087769/78578278-f78d7a00-7837-11ea-9556-4d7e517dfeed.png)

#### Puan Durumu
![puan-durumu](https://user-images.githubusercontent.com/25087769/78578274-f65c4d00-7837-11ea-826f-28da0983447f.png)

#### Oyun
![game](https://user-images.githubusercontent.com/25087769/78578280-f8261080-7837-11ea-8158-69a9eef96879.png)






