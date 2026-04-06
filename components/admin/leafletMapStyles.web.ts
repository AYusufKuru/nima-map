/**
 * Yalnızca stiller — Metro CSS grafiği; Leaflet JS çalıştırmaz (window gerekmez).
 * AdminBelediyeMap.web.tsx bu dosyayı import eder.
 * Leaflet ana CSS: `url(images/...)` Metro’da desteklenmediği için `app/+html.tsx` içinde CDN’den yükleniyor.
 */
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
