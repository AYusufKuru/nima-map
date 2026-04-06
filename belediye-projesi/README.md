# Jumbo Market Locator

Bu proje, Jumbo marketler zinciri için geliştirilmiş modern ve interaktif bir mağaza bulucu uygulamasıdır.

## Özellikler
- **İnteraktif Dünya Haritası**: Leaflet.js üzerine kurulu, şık tasarımlı harita.
- **Özel İşaretçiler**: Harita üzerinde ikonik ve özelleştirilmiş mağaza pinleri.
- **Zengin Mağaza Listesi**: Sol tarafta yer alan, tüm mağazaları listeleyen ve detaylı filtreleme sunan yan panel.
- **Akıllı Arama**: Şehir, mağaza adı veya adrese göre anlık arama yapabilme.
- **Detaylı Bilgi Panelleri**: Mağaza üzerine tıklandığında açılan fotoğraf, çalışma saatleri ve durum (açık/kapalı) bilgisi içeren paneller.
- **Akıcı Geçişler**: Bir mağaza seçildiğinde haritanın o konuma yumuşak bir şekilde odaklanması (FlyTo efekti).

## Kurulum ve Çalıştırma
Projeyi yerel bilgisayarınızda bir web sunucusu (örneğin Python `http.server`, `http-server` veya Live Server) ile açarak çalıştırabilirsiniz.

```bash
# Örnek çalıştırma (Python yüklüyse)
python -m http.server 8000
```

Ardından tarayıcınızdan `http://localhost:8000` adresine giderek uygulamayı görüntüleyebilirsiniz.
