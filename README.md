# SalaryCalculator

Maaş hesaplama için Angular 9 ile yapılmış kütüphane.

* [Maaş Hesaplama Demo](http://mustapayev.com/maas-hesaplama/)

## Installation

1. Clone the repo

    ```shell
    git clone https://github.com/nuryagdym/maas-hesaplama.git
    ```
2.  Install dependencies

    ```shell
    cd maas-hesaplama
    npm install
    ```
3.  Start serving

    ```shell
    ng serve
    ```
4. Build the library

    ```shell
    ng build --prod --aot
    ```
5. Run tests

    ```shell
    ng test
    ```
## Modules
- Maaş hesaplama
- Maaliyet karşılaştırma - Çalışan türüne göre maaliyetleri karşılaştırabilme.

## Calculation Modes

- Brütten Nete
- Netten Brüte (AGİ dahil ve AGİ hariç)
- Toplam Maliyete göre

## Features

- Standart Çalışan maaş hesaplaması
- 6111 Sayılı Kanun maaş hesaplaması
- 17103 Sayılı Kanun maaş hesaplaması
- 27103 Sayılı Kanun maaş hesaplaması
- Teknokent ve Ar-Ge personeli (4691 ve 5746) maaş hesaplaması
- İşveren/Şirket ortağı maaş hesaplaması
- İşveren Teknokent ve İşveren Ar-Ge personeli (4691 ve 5746) maaş hesaplaması
- Ev Hizmetlerinde Çalışan maaş hesaplaması (10 günden fazla)
- Emekli çalışan maaş hesaplama


- Part time çalışan
- İşveren Bağ-Kur 5 puanlık prim indirimi
- Ar-Ge personeli eğitim durumu indirimi
- Sakatlık durumu
- AGİ
- Vergi ve SGK istisnalar
- Toplam yıllık ve dönemlik maliyetler
- TÜBİTAK dönem ortalama maliyet
- Aylık ortalama maliyetler
- İşveren Maaliyeti
- Excel dosya indirebilme
- Anlık hesaplama, User Input'ların her hangi biri değiştiği zaman hesaplama gerçekleşir
- Ayın TL tutarı girildiğinde bir sonraki ay tutarları otomatik doldurulur

## Notes

- Her yıl için 1 asgari ücret belirelenebilir, dolasıyla asgari ücretin yılda 2 kere zamlandığı durumu desteklemez. Yeterli kadar istek olursa üzerinde çalışabilirim.

- Asgari ücretin altında hesaplama yapmamaktadır, asgari ücretten daha düşük değer girilirse asgari ücrete göre hesaplama yapar.

- hesaplamada Javascript ile alakalı hafif hatalar olabilir. Örneğin JS 29.43 * 3 == 88.28999999999999 olarak hesaplıyor, bu yüzden Toplam Yıllık maaliyetlerde 0-10 kuruş fark gösterebilir.

- Netten brüte hesaplayan bir formül bulamadığım için, netten brüte ve toplam maliyete göre hesaplamaları binary search yöntemiyle hesaplanmaktadır.

## Adding a new year data

- yeni yıla ait parametreler (SGK taven, asgari ücret, vergi dilimler, engelli vergi indirimleri) kolay bir şekilde eklenebilinmesi için build kodlarından ayrı tuttum. 
Yıl parametreleri: [year-parameters.json](src/assets/year-parameters.json). 
Sıralama önemli değildir, kütüphane kendisi yılları büyükten küçüğe sıralıyor, vergi dilimlerin de sıralaması önemli değildir.

## Input Parameters

- Input parametreler [fixtures.json](src/assets/fixtures.json) dosya içindedir, kolayca güncellenebilmesi için bunu da build kodların dışında bıkratım.
- Sıralama JSON dosyada nasılsa o şekilde kullanıcıya gösterilir.

## TODO
1. Netten brüte ve Toplam Maliyete göre hesaplamalarda çalışma gün 30'dan az olduğu durumlarda doğru hesaplayamıyor.
