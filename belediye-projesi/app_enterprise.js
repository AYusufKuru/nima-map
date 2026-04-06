/**
 * SARFEA BELEDİYE ANALYTICS v11
 */

let allItems = []; // Kullanıcı eklendikçe dolacak
let map;
let markerCluster;
let currentView = 'Global'; 
let selectedBelediye = 'All';
let selectedItem = null;
let addingMode = null; // 'Elektrik Panosu' | 'Görsel' | null

// Herhangi bir yere tıklandığında açık dropdownları kapat
document.addEventListener('click', () => {
    document.querySelectorAll('.v11-dropdown-menu').forEach(m => m.style.display = 'none');
});

const MUNICIPALITIES = [
    { id: 'kadikoy', name: 'Kadıköy Belediyesi', province: 'İstanbul', query: 'Kadıköy, İstanbul, Türkiye', coords: [40.990, 29.020] },
    { id: 'besiktas', name: 'Beşiktaş Belediyesi', province: 'İstanbul', query: 'Beşiktaş, İstanbul, Türkiye', coords: [41.045, 28.995] },
    { id: 'sisli', name: 'Şişli Belediyesi', province: 'İstanbul', query: 'Şişli, İstanbul, Türkiye', coords: [41.060, 28.980] },
    { id: 'uskudar', name: 'Üsküdar Belediyesi', province: 'İstanbul', query: 'Üsküdar, İstanbul, Türkiye', coords: [41.020, 29.020] },
    { id: 'pendik', name: 'Pendik Belediyesi', province: 'İstanbul', query: 'Pendik, İstanbul, Türkiye', coords: [40.870, 29.250] },
    { id: 'cankaya', name: 'Çankaya Belediyesi', province: 'Ankara', query: 'Çankaya, Ankara, Türkiye', coords: [39.900, 32.880] },
    { id: 'kecioren', name: 'Keçiören Belediyesi', province: 'Ankara', query: 'Keçiören, Ankara, Türkiye', coords: [39.980, 32.860] },
    { id: 'nilufer', name: 'Nilüfer Belediyesi', province: 'Bursa', query: 'Nilüfer, Bursa, Türkiye', coords: [40.200, 28.950] },
    { id: 'konak', name: 'Konak Belediyesi', province: 'İzmir', query: 'Konak, İzmir, Türkiye', coords: [38.420, 27.130] },
    { id: 'muratpasa', name: 'Muratpaşa Belediyesi', province: 'Antalya', query: 'Muratpaşa, Antalya, Türkiye', coords: [36.880, 30.700] },
    { id: 'meram', name: 'Meram Belediyesi', province: 'Konya', query: 'Meram, Konya, Türkiye', coords: [37.850, 32.460] },
    { id: 'seyhan', name: 'Seyhan Belediyesi', province: 'Adana', query: 'Seyhan, Adana, Türkiye', coords: [37.000, 35.320] }
];

const ITEM_TYPES = ['Menhol', 'Kabin', 'Baz İstasyonu', 'Elektrik Direği', 'Elektrik Panosu', 'Doğalgaz'];

function getIconForType(type) {
    switch(type) {
        case 'Menhol': return 'fa-dot-circle';
        case 'Kabin': return 'fa-server';
        case 'Baz İstasyonu': return 'fa-broadcast-tower';
        case 'Elektrik Direği': return 'fa-lightbulb';
        case 'Elektrik Panosu': return 'fa-bolt';
        case 'Doğalgaz': return 'fa-fire';
        default: return 'fa-map-marker-alt';
    }
}

// Varsayılan Örnek Veriler (Yayına Alındığında Herkeste Görünecek Olanlar)
const DEFAULT_SAMPLES = [
    {
        id: 'ITM-SAMP-1',
        title: 'Yozgat Bulvarı Saha Kontrolü',
        type: 'Elektrik Panosu',
        belediyeId: 'kecioren',
        belediyeName: 'Keçiören Belediyesi',
        coords: [40.002350, 32.823990],
        status: 'Aktif',
        perf: 100,
        kurulumTarihi: '2026-03-07',
        image: './assets/sample-survey.jpg'
    },
    {
        id: 'ITM-SAMP-2',
        title: 'Keçiören Merkez Denetim',
        type: 'Menhol',
        belediyeId: 'kecioren',
        belediyeName: 'Keçiören Belediyesi',
        coords: [40.003, 32.825],
        status: 'Aktif',
        perf: 95,
        kurulumTarihi: '2026-03-07',
        image: './assets/sample-survey.jpg'
    },
    {
        id: 'ITM-SAMP-3',
        title: 'Bulvar Bölgesi Enerji Hattı',
        type: 'Kabin',
        belediyeId: 'kecioren',
        belediyeName: 'Keçiören Belediyesi',
        coords: [40.0019, 32.822],
        status: 'Aktif',
        perf: 98,
        kurulumTarihi: '2026-03-07',
        image: './assets/sample-survey.jpg'
    }
];

// Veritabanı gibi kullanıcının kaydettiği verileri LocalStorage'dan yüklemek isterseniz:
function loadDataFromStorage() {
    const saved = localStorage.getItem('sarfea_belediye_items');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Eğer kaydedilmiş veri varsa onu döndür, yoksa (ilk kez açılıyorsa) örnekleri ver
            return data.length > 0 ? data : [...DEFAULT_SAMPLES];
        } catch(e) {}
    }
    return [...DEFAULT_SAMPLES];
}

function saveDataToStorage() {
    try {
        localStorage.setItem('sarfea_belediye_items', JSON.stringify(allItems));
    } catch (e) {
        console.error("Storage Error:", e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert("⚠️ Depolama Alanı Dolu! Çok fazla veya çok büyük görseller yüklendiği için bu görsel kaydedilemedi. Lütfen bazı öğeleri silin veya daha küçük görseller deneyin.");
        }
    }
}

/**
 * System Init
 */
function initv11System() {
    try {
        allItems = loadDataFromStorage(); // Boş olarak başlar veya önceki eklenenleri yükler
        setupMap();
        drawRealMunicipalityBoundaries();
        renderSidebar();
        updateGlobalKPIs();
        startActivityStream();
        setupMobileBottomSheet();
        setupDesktopResizer();
        
        const loader = document.getElementById('loader');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 800);
        }
    } catch(e) {
        console.error("System Boot Error:", e);
        document.getElementById('loader').style.display = 'none';
    }
}

function setupDesktopResizer() {
    const resizer = document.getElementById('desktopResizer');
    const sidebar = document.querySelector('.sidebar');
    if(!resizer || !sidebar || window.innerWidth <= 900) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        resizer.classList.add('active');
        
        // Metin seçimini engelleme (Sürükleme sırasındaki o çirkin mavi seçimi önler)
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        requestAnimationFrame(() => {
            let newWidth = e.clientX;
            
            // Limitler
            if(newWidth < 300) newWidth = 300; // Minimum 300px
            if(newWidth > window.innerWidth - 300) newWidth = window.innerWidth - 300; // Haritaya sadece 300px bırakana kadar panel genişleyebilir
            
            sidebar.style.flex = `0 0 ${newWidth}px`; // Flex box kullanıyorduks
            sidebar.style.width = `${newWidth}px`;
            
            // Eğer varsa harita kütüphanesini tazele (Harita boyutunda yırtılma olmasın)
            if(typeof map !== 'undefined' && map.invalidateSize) {
                map.invalidateSize();
            }
        });
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            resizer.classList.remove('active');
            document.body.style.userSelect = '';
        }
    });
}

function setupMobileBottomSheet() {
    const sidebar = document.querySelector('.sidebar');
    const mapFrame = document.querySelector('.map-frame');
    const header = document.querySelector('.sidebar-header');
    
    let startY = 0;
    let currentHeight = 0;
    let isDragging = false;
    
    const startDrag = (e) => {
        if(window.innerWidth > 900) return;
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const vh = window.innerHeight;
        currentHeight = (sidebar.getBoundingClientRect().height / vh) * 100;
        isDragging = true;
        
        sidebar.style.transition = 'none';
        mapFrame.style.transition = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const doDrag = (e) => {
        if(!isDragging || window.innerWidth > 900) return;
        e.preventDefault(); // Sayfanın kaymasını önler
        
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const deltaY = startY - clientY;
        const vh = window.innerHeight;
        const deltaVh = (deltaY / vh) * 100;
        
        let newHeight = currentHeight + deltaVh;
        
        if(newHeight > 85) newHeight = 85; 
        if(newHeight < 15) newHeight = 15;
        
        sidebar.style.height = `${newHeight}vh`;
        mapFrame.style.height = `${100 - newHeight + 3}vh`; 
    };

    const stopDrag = () => {
        if(!isDragging || window.innerWidth > 900) return;
        isDragging = false;
        document.body.style.cursor = 'default';
        
        // Bırakıldığında yumuşak geçiş
        sidebar.style.transition = 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        mapFrame.style.transition = 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        const endHeight = parseFloat(sidebar.style.height);
        
        // Kullanıcının bıraktığı yerde kalma oranını arttırdım. En uçlarda manyetizma olsun:
        if (endHeight > 75) {
            sidebar.style.height = '85vh'; // Tam sayfa menü
            mapFrame.style.height = '18vh'; 
        } else if (endHeight < 25) {
            sidebar.style.height = '20vh'; // Minik menü
            mapFrame.style.height = '85vh';
        } else {
            // Arada bir yere bırakıldıysa olduğu yerde "esnek" kalsın veya tam yarıda dursun!
            // Kullanıcı "oynatılabilir olsun" dediği için bıraktığı yerde durmasına izin verebiliriz, 
            // ama en güvenlisi ortaya yaslamak. Ortada Snap:
            if(endHeight > 40 && endHeight < 60) {
                sidebar.style.height = '56vh';
                mapFrame.style.height = '48vh';
            }
        }
    };

    // Touch Eventleri (Gerçek Telefonlar)
    header.addEventListener('touchstart', startDrag, {passive: true});
    header.addEventListener('touchmove', doDrag, {passive: false});
    header.addEventListener('touchend', stopDrag);
    
    // Mouse Eventleri (Bilgisayarda test veya fare bağlayanlar için!)
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag); // document'e atandı ki fare hızlı çekilirse dışarı çıkmasın
    document.addEventListener('mouseup', stopDrag);
    
    // Header Mouse ikonu
    header.style.cursor = 'grab';
    header.addEventListener('mousedown', () => header.style.cursor = 'grabbing');
    header.addEventListener('mouseup', () => header.style.cursor = 'grab');
}

function setupMap() {
    const bounds = L.latLngBounds(L.latLng(35.0, 25.0), L.latLng(42.5, 45.0));
    map = L.map('map', {
        center: [39.0, 35.0], zoom: 6, minZoom: 5, maxZoom: 18,
        zoomControl: false, attributionControl: false, maxBounds: bounds
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { noWrap: true }).addTo(map);

    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 14,
        iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            const sizeClass = count < 10 ? 'v11-sm' : (count < 30 ? 'v11-md' : 'v11-lg');
            return L.divIcon({
                html: `<div class="v11-cluster ${sizeClass}"><span>${count}</span></div>`,
                className: 'v11-cluster-wrap',
                iconSize: [45, 45]
            });
        }
    });

    map.on('click', function(e) {
        if (addingMode && selectedBelediye !== 'All') {
            const bel = MUNICIPALITIES.find(b => b.id === selectedBelediye);
            if (!bel) return;
            
            const titleInput = prompt(`Eklemek istediğiniz ${addingMode} için bir başlık (veya numara) giriniz:`, `YENİ ${addingMode.toUpperCase()}`);
            if (titleInput === null) return; // İptal edilirse ekleme
            
            const newItem = {
                id: `ITM-NEW-${Date.now().toString().slice(-4)}`,
                title: titleInput || `Yeni ${addingMode}`,
                type: addingMode,
                belediyeId: bel.id,
                belediyeName: bel.name,
                coords: [e.latlng.lat, e.latlng.lng],
                status: 'Aktif',
                perf: 100,
                kurulumTarihi: new Date().toISOString().split('T')[0]
            };
            
            allItems.push(newItem);
            saveDataToStorage(); // Kaydet
            cancelAddMode();
            syncMarkers(selectedBelediye);
            renderSidebar(); 
            updateGlobalKPIs();
            
        } else if (addingMode && selectedBelediye === 'All') {
            alert('Lütfen haritada nereye ekleyeceğinizi seçmeden önce sol menüden bir bölgeye (Belediye) girin.');
            cancelAddMode();
        }
    });
    
    syncMarkers('All');
    map.addLayer(markerCluster);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

// Gerçekçi Kesik Çizgili Belediye Sınırları
async function drawRealMunicipalityBoundaries() {
    for (const bel of MUNICIPALITIES) {
        // Önbellekten okuma:
        const cacheKey = `geo_bounary_${bel.id}`;
        let geoData = localStorage.getItem(cacheKey);

        if (!geoData) {
            try {
                // Nominatim API'sinden İlçe Sınırlarını Çek
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(bel.query)}&format=jsonv2&polygon_geojson=1&limit=1`);
                const data = await res.json();
                
                if (data && data[0] && data[0].geojson) {
                    geoData = JSON.stringify(data[0].geojson);
                    localStorage.setItem(cacheKey, geoData);
                }
            } catch(e) {
                console.warn(bel.name + " lokasyon detayı çekilemedi.");
            }
            // 1 İstek/saniye kuralı için ufak bir bekleme
            await new Promise(r => setTimeout(r, 1000));
        }

        if (geoData) {
            try {
                const parsedGeo = JSON.parse(geoData);
                const boundaryLayer = L.geoJSON(parsedGeo, {
                    style: {
                        color: '#ef4444',     // Kırmızı
                        weight: 3,            // Çizgi kalınlığı
                        dashArray: '5, 8',    // Kesik çizgi deseni
                        opacity: 0.9,
                        fillColor: '#ef4444',
                        fillOpacity: 0.05
                    },
                    interactive: false
                }); // HARİTAYA HEMEN EKLENMİYOR
                
                bel.boundaryLayer = boundaryLayer; // Belediyeye kaydediyoruz
                
                // Koordinatları, OpenStreetMap verisine göre daha merkeze oturt
                const actualBounds = boundaryLayer.getBounds();
                const actualCenter = actualBounds.getCenter();
                bel.osmBounds = actualBounds;
                bel.coords = [actualCenter.lat, actualCenter.lng];
                
            } catch(e) { }
        }
    }
}

window.currentFilterType = window.currentFilterType || 'All';

function syncMarkers(belId = 'All') {
    markerCluster.clearLayers();
    let filtered = belId === 'All' ? allItems : allItems.filter(s => s.belediyeId === belId);
    
    if (window.currentFilterType && window.currentFilterType !== 'All') {
        filtered = filtered.filter(s => s.type === window.currentFilterType);
    }
    
    filtered.forEach(s => {
        let statusColor = s.status === 'Aktif' ? '#10b981' : '#f59e0b';
        let iconClass = getIconForType(s.type);
        
        const icon = L.divIcon({
            className: 'v11-node-marker',
            html: `<div class="v11-pin" style="background:${statusColor}"><i class="fas ${iconClass}"></i></div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
        });

        const m = L.marker(s.coords, { icon: icon });
        
        m.bindTooltip(`
            <div class="v11-map-tip">
                <div class="tip-id"><i class="fas ${getIconForType(s.type)}" style="margin-right: 5px;"></i>${s.type}</div>
                <div class="tip-rev">Birim: <b>${s.belediyeName}</b></div>
                <div class="tip-perf">Durum: <b style="color:${statusColor}">${s.status}</b></div>
            </div>
        `, { direction: 'top', offset: [0, -10], opacity: 1, sticky: true });

        m.on('click', () => zoomToItem(s));
        markerCluster.addLayer(m);
    });

    const avgElem = document.getElementById('mapPerfAvg');
    if(avgElem) avgElem.textContent = `%${filtered.length > 0 ? 100 : 0}`;
}

window.enableAddMode = function(type) {
    addingMode = type;
    document.getElementById('map').style.cursor = 'crosshair';
    document.getElementById('app').classList.add('app-adding-mode'); // CSS'i tetikler
    
    let hint = document.getElementById('add-hint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'add-hint';
        hint.style.position = 'fixed';
        hint.style.bottom = '100px'; // mobilde panelden kurtarmak için biraz yukarı
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.background = 'var(--v11-dark, #0f172a)';
        hint.style.color = '#fff';
        hint.style.padding = '12px 24px';
        hint.style.borderRadius = '30px';
        hint.style.zIndex = '10000';
        hint.style.fontWeight = '800';
        hint.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
        hint.style.pointerEvents = 'none';
        hint.style.fontFamily = "'Outfit', sans-serif";
        hint.style.fontSize = "0.85rem";
        hint.style.textAlign = "center";
        hint.style.border = "2px solid #3b82f6";
        document.body.appendChild(hint);
    }
    hint.innerHTML = `<i class="fas fa-magic" style="color:#3b82f6; margin-right:5px;"></i> Haritada eklenecek yere tıklayın <br><small style="font-weight:400; opacity:0.8;">İptal için ESC'ye basın</small>`;

    const escListener = (e) => {
        if(e.key === 'Escape') {
            cancelAddMode();
            window.removeEventListener('keydown', escListener);
        }
    };
    window.addEventListener('keydown', escListener);
}

window.cancelAddMode = function() {
    addingMode = null;
    document.getElementById('map').style.cursor = '';
    document.getElementById('app').classList.remove('app-adding-mode');
    const hint = document.getElementById('add-hint');
    if(hint) hint.remove();
}

/**
 * Sidebar Tiered Engine
 */
window.selectedProvince = null;

function renderSidebar() {
    const box = document.getElementById('sidebarContent');
    box.style.opacity = '0';
    
    setTimeout(() => {
        box.innerHTML = '';
        if (currentView === 'Global') renderProvinces(box);
        else if (currentView === 'Province') renderMunicipalities(box, window.selectedProvince);
        else if (currentView === 'Region') renderRegion(box, selectedBelediye);
        else if (currentView === 'Item') renderItem(box, selectedItem);
        box.style.opacity = '1';
    }, 200);
}

window.drillToProvince = function(provinceName) {
    currentView = 'Province';
    window.selectedProvince = provinceName;
    renderSidebar();
    
    const provinceMuns = MUNICIPALITIES.filter(m => m.province === provinceName);
    if(provinceMuns.length > 0) {
        let alat = 0, alng = 0;
        provinceMuns.forEach(m => { alat += m.coords[0]; alng += m.coords[1]; });
        alat /= provinceMuns.length;
        alng /= provinceMuns.length;
        map.flyTo([alat, alng], 9, { duration: 2.0 });
    }
};

function renderProvinces(box) {
    const provinces = [...new Set(MUNICIPALITIES.map(m => m.province))];
    const gridContainer = document.createElement('div');
    gridContainer.className = 'v11-grid-container';
    
    provinces.forEach(prov => {
        const provMuns = MUNICIPALITIES.filter(m => m.province === prov).map(m => m.id);
        const items = allItems.filter(s => provMuns.includes(s.belediyeId));
        const activeCount = items.filter(s => s.status === 'Aktif').length;
        const avgEff = items.length > 0 ? Math.round((activeCount / items.length) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'v11-region-card';
        card.innerHTML = `
            <div class="v11-card-top">
                <h3>${prov} İli</h3>
                <span class="v11-count">${provMuns.length} Belediye / ${items.length} Öğe</span>
            </div>
            <div class="v11-card-metrics">
                <div class="v11-m-item"><small>AKTİF ÖĞE</small><strong>${activeCount}</strong></div>
                <div class="v11-m-item"><small>SİSTEM SAĞLIĞI</small><strong class="${avgEff > 80 ? 'green' : (avgEff > 50 ? 'orange' : 'red')}">%${avgEff}</strong></div>
            </div>
            <div class="v11-prog-bg"><div class="v11-prog-fill" style="width:${avgEff}%"></div></div>
            <button onclick="drillToProvince('${prov}')" class="v11-btn-drill">BELEDİYELERİ GÖR <i class="fas fa-arrow-right"></i></button>
        `;
        gridContainer.appendChild(card);
    });
    box.appendChild(gridContainer);
}

function renderMunicipalities(box, provinceName) {
    const header = document.createElement('div');
    header.className = 'v11-header-nav';
    header.innerHTML = `
        <button onclick="goBack()" class="v11-back-btn" style="margin-bottom:15px;"><i class="fas fa-chevron-left"></i> İLLERE DÖN</button>
        <h2 style="font-size:1.5rem; margin-bottom:15px;">${provinceName} Belediyeleri</h2>
    `;
    box.appendChild(header);

    const muns = MUNICIPALITIES.filter(m => m.province === provinceName);
    const gridContainer = document.createElement('div');
    gridContainer.className = 'v11-grid-container';
    
    muns.forEach(bel => {
        const items = allItems.filter(s => s.belediyeId === bel.id);
        const activeCount = items.filter(s => s.status === 'Aktif').length;
        const avgEff = items.length > 0 ? Math.round((activeCount / items.length) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'v11-region-card';
        card.innerHTML = `
            <div class="v11-card-top">
                <h3>${bel.name}</h3>
                <span class="v11-count">${items.length} Öğe</span>
            </div>
            <div class="v11-card-metrics">
                <div class="v11-m-item"><small>AKTİF BAĞLANTI</small><strong>${activeCount}</strong></div>
                <div class="v11-m-item"><small>SİSTEM SAĞLIĞI</small><strong class="${avgEff > 80 ? 'green' : (avgEff > 50 ? 'orange' : 'red')}">%${avgEff}</strong></div>
            </div>
            <div class="v11-prog-bg"><div class="v11-prog-fill" style="width:${avgEff}%"></div></div>
            <button onclick="drillToBelediye('${bel.id}')" class="v11-btn-drill">BÖLGEYİ AÇ <i class="fas fa-arrow-right"></i></button>
        `;
        gridContainer.appendChild(card);
    });
    box.appendChild(gridContainer);
}

window.setFilterType = function(type, belId) {
    window.currentFilterType = type;
    syncMarkers(belId);
    renderSidebar(); // Yeniden listeyi ve butonların aktif/pasif durumunu render eder
};

function renderRegion(box, belId) {
    const bel = MUNICIPALITIES.find(b => b.id === belId);
    if (!bel) return;
    
    let list = allItems.filter(s => s.belediyeId === belId);
    if (window.currentFilterType && window.currentFilterType !== 'All') {
        list = list.filter(s => s.type === window.currentFilterType);
    }
    
    box.innerHTML = `
        <div class="v11-header-nav" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <button onclick="goBack()" class="v11-back-btn" style="margin-bottom:8px;"><i class="fas fa-chevron-left"></i> BÖLGELERE DÖN</button>
                <h2 style="font-size: 1.4rem;">${bel.name}</h2>
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="document.getElementById('addTypeDropdown').style.display='flex'" style="padding: 10px 15px; background:var(--v11-primary); color:white; border-radius:12px; border:none; font-weight:800; cursor:pointer; height:fit-content; box-shadow: 0 5px 15px rgba(26, 188, 156, 0.3);">
                    <i class="fas fa-plus"></i> EKLE
                </button>
            </div>
        </div>
        
        <!-- Gizli yeni ekleme paneli -->
        <div id="addTypeDropdown" style="display:none; flex-direction:column; background:#f8fafc; padding:15px; border-radius:15px; margin-bottom:20px; border:1px solid #e2e8f0; animation: v11FadeIn 0.2s ease-out;">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items:center;">
                <span style="font-size:0.8rem; font-weight:800; color:#64748b;">NE EKLEMEK İSTİYORSUNUZ?</span>
                <i class="fas fa-times" style="cursor:pointer; color:#ef4444; font-size:1.2rem; padding:4px;" onclick="document.getElementById('addTypeDropdown').style.display='none'"></i>
            </div>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                ${ITEM_TYPES.map(type => `
                    <button style="display:flex; align-items:center; justify-content:center; gap:6px; padding:10px; border-radius:12px; background:rgba(59, 130, 246, 0.08); border:1px solid rgba(59, 130, 246, 0.2); color:#1e293b; font-size:11px; font-weight:700; cursor:pointer;"
                            onmouseover="this.style.background='#3b82f6'; this.style.color='#fff';"
                            onmouseout="this.style.background='rgba(59, 130, 246, 0.08)'; this.style.color='#1e293b';"
                            onclick="enableAddMode('${type}')" title="Haritaya ${type} Ekle">
                        <i class="fas fa-plus" style="font-size:8px; opacity:0.6;"></i> <i class="fas ${getIconForType(type)}"></i> ${type}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- Premium Özel Dropdown Filtreleme -->
        <style>
            .v11-filter-wrapper { padding: 0 0 20px 0; position: relative; }
            .v11-custom-select {
                width: 100%; padding: 14px 18px; border-radius: 16px; background: white; border: 1px solid #e2e8f0; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); color: #1e293b; font-size: 0.95rem; font-weight: 800;
                cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;
            }
            .v11-custom-select:hover { border-color: #3b82f6; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1); }
            
            .v11-dropdown-menu {
                display: none; position: absolute; top: calc(100% - 10px); left: 0; right: 0; background: white; 
                border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; 
                z-index: 100; overflow: hidden; padding: 8px; animation: v11FadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .v11-dropdown-item {
                padding: 12px 16px; border-radius: 10px; color: #64748b; font-weight: 600; font-size: 0.9rem; 
                cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 10px;
            }
            .v11-dropdown-item:hover { background: #f8fafc; color: #0f172a; transform: translateX(3px); }
            .v11-dropdown-item.active { background: #eff6ff; color: #2563eb; }
        </style>
        
        <div class="v11-filter-wrapper">
            <div class="v11-custom-select" onclick="const m = this.nextElementSibling; document.querySelectorAll('.v11-dropdown-menu').forEach(x => {if(x!==m) x.style.display='none'}); m.style.display = m.style.display === 'block' ? 'none' : 'block'; event.stopPropagation();">
                <span><i class="fas fa-filter" style="color:#94a3b8; margin-right:8px;"></i> ${(!window.currentFilterType || window.currentFilterType === 'All') ? 'Tüm Kategorileri Göster' : window.currentFilterType}</span>
                <i class="fas fa-chevron-down" style="color:#94a3b8;"></i>
            </div>
            
            <div class="v11-dropdown-menu">
                <div class="v11-dropdown-item ${(!window.currentFilterType || window.currentFilterType === 'All') ? 'active' : ''}" onclick="setFilterType('All', '${belId}')">
                    <i class="fas fa-layer-group"></i> Tümü
                </div>
                ${ITEM_TYPES.map(type => `
                    <div class="v11-dropdown-item ${window.currentFilterType === type ? 'active' : ''}" onclick="setFilterType('${type}', '${belId}')">
                        <i class="fas ${getIconForType(type)}"></i> ${type}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="v11-node-list v11-grid-container">
            ${list.length === 0 ? `<div style="text-align:center; padding: 30px 20px; color:#64748b; font-size: 0.8rem; border: 2px dashed #e2e8f0; border-radius: 15px; grid-column: 1 / -1;">Bu kategoride henüz öğe yok. Yukarıdan 'Ekle'ye basarak ekleyebilirsiniz.</div>` : ''}
            ${list.map(s => `
                <div class="v11-list-row" style="display:flex; flex-direction:column; padding:0; overflow:hidden; gap:0;" onclick="showItemById('${s.id}')">
                    <div style="width: 100%; height: 160px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #cbd5e1; border-bottom: 1px solid #e2e8f0;">
                        ${s.image 
                            ? `<img src="${s.image}" style="width:100%; height:100%; object-fit:cover;" />` 
                            : `<i class="fas ${getIconForType(s.type)}"></i>`
                        }
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 15px;">
                        <div class="v11-row-main">
                            <strong style="font-size: 0.95rem; display:block; margin-bottom: 4px;">${s.title}</strong>
                            <p style="margin:0; font-size:0.75rem;">${s.type} &nbsp;|&nbsp; <span style="color:${s.status === 'Aktif' ? '#10b981' : '#f59e0b'}; font-weight:700;">${s.status}</span></p>
                        </div>
                        
                        <div class="v11-row-data">
                            <button onclick="event.stopPropagation(); deleteItem('${s.id}')" style="background:none; border:none; color:#ef4444; font-size:18px; cursor:pointer; padding:5px;" title="Sil">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <!-- PREMIUM EXPORT PANEL -->
        <div style="margin-top: 40px; margin-bottom: 20px; padding: 25px; background: linear-gradient(145deg, #ffffff, #f8fafc); border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.03); text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; left: -50px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0) 70%); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(244,63,94,0.05) 0%, rgba(255,255,255,0) 70%); border-radius: 50%;"></div>
            
            <p style="font-weight: 800; color: #1e293b; margin-bottom: 20px; font-size: 1.05rem; letter-spacing: 0.5px; position:relative; z-index:2;">
                <i class="fas fa-layer-group" style="padding:8px; background:#eff6ff; color:#3b82f6; border-radius:10px; margin-right:8px; font-size:14px;"></i> 
                ŞU ANKİ LİSTEYİ DIŞA AKTAR
            </p>
            
            <div class="export-panel-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; position:relative; z-index:2;">
                <!-- Word Button -->
                <button onclick="alert('Seçili olan tüm liste topluca Word formatında indiriliyor...')" style="flex-direction: column; padding: 16px 10px; background: white; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; gap: 8px; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.05); transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 15px rgba(37, 99, 235, 0.15)';" onmouseout="this.style.boxShadow='0 4px 10px rgba(37, 99, 235, 0.05)';">
                    <i class="fas fa-file-word" style="font-size: 22px;"></i> Word İndir
                </button>
                
                <!-- PDF Button -->
                <button onclick="alert('Seçili olan tüm liste topluca PDF formatında indiriliyor...')" style="flex-direction: column; padding: 16px 10px; background: white; color: #dc2626; border: 1px solid #fecaca; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; gap: 8px; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.05); transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 15px rgba(220, 38, 38, 0.15)';" onmouseout="this.style.boxShadow='0 4px 10px rgba(220, 38, 38, 0.05)';">
                    <i class="fas fa-file-pdf" style="font-size: 22px;"></i> PDF İndir
                </button>
                
                <!-- Edit Button -->
                <button onclick="alert('Düzenleme modu aktifleştiriliyor...')" style="flex-direction: column; padding: 16px 10px; background: white; color: #d97706; border: 1px solid #fde68a; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; gap: 8px; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.05); transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 15px rgba(217, 119, 6, 0.15)';" onmouseout="this.style.boxShadow='0 4px 10px rgba(217, 119, 6, 0.05)';">
                    <i class="fas fa-pen" style="font-size: 22px;"></i> Düzenle
                </button>

                <!-- Advanced Images Button -->
                <button onclick="downloadCurrentListImages('${belId}')" style="flex-direction: column; padding: 16px 10px; background: white; color: #0284c7; border: 1px solid #bae6fd; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; display: flex; gap: 8px; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.05); transition: all 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 15px rgba(2, 132, 199, 0.15)';" onmouseout="this.style.boxShadow='0 4px 10px rgba(2, 132, 199, 0.05)';">
                    <i class="fas fa-images" style="font-size: 22px;"></i> Görseller
                </button>
            </div>
        </div>
    `;
}

window.downloadCurrentListImages = function(belId) {
    let list = allItems.filter(s => s.belediyeId === belId);
    if (window.currentFilterType && window.currentFilterType !== 'All') {
        list = list.filter(s => s.type === window.currentFilterType);
    }
    
    // Yalnızca resmi olan öğeleri al
    const itemsWithImages = list.filter(s => s.image && s.image.trim() !== '');
    
    if(itemsWithImages.length === 0) {
        alert("Seçili kategoride indirilebilecek herhangi bir fotoğraf bulunamadı.");
        return;
    }

    // Modern Progress Overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; inset:0; background:rgba(15, 23, 42, 0.9); z-index:99999; display:flex; align-items:center; justify-content:center; flex-direction:column; color:white; backdrop-filter:blur(5px); animation:v11FadeIn 0.3s;";
    overlay.innerHTML = `
        <style>@keyframes bounceSoft { 0%, 100% {transform:translateY(0);} 50% {transform:translateY(-10px);} }</style>
        <i class="fas fa-cloud-download-alt" style="font-size:54px; color:#f43f5e; margin-bottom:24px; animation: bounceSoft 1.5s infinite"></i>
        <h2 style="margin-bottom:12px; font-weight:800;">Görseller Çekiliyor...</h2>
        <p style="color:#94a3b8; margin-bottom:25px; font-size:0.9rem;">Toplam <b style="color:white">${itemsWithImages.length}</b> adet fotoğraf indirilecek.</p>
        <div style="width: 320px; height: 12px; background: #334155; border-radius: 10px; overflow:hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
            <div id="dl-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #f43f5e, #fb7185); transition: width 0.3s ease-out;"></div>
        </div>
        <p id="dl-status-text" style="font-size:13px; font-weight:700; margin-top:20px; color:#cbd5e1;">0 / ${itemsWithImages.length} Tamamlandı</p>
    `;
    document.body.appendChild(overlay);

    let downloadedCount = 0;
    
    itemsWithImages.forEach((item, index) => {
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = item.image;
            const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `sarfea_${item.type}_${safeTitle}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadedCount++;
            const percent = Math.round((downloadedCount / itemsWithImages.length) * 100);
            document.getElementById('dl-progress-bar').style.width = percent + '%';
            document.getElementById('dl-status-text').textContent = `${downloadedCount} / ${itemsWithImages.length} Tamamlandı`;
            
            if(downloadedCount === itemsWithImages.length) {
                document.querySelector('#dl-status-text').textContent = 'İndirme Tamamlandı!';
                document.querySelector('#dl-status-text').style.color = '#10b981';
                document.querySelector('.fa-cloud-download-alt').className = 'fas fa-check-circle';
                document.querySelector('.fa-cloud-download-alt, .fa-check-circle').style.color = '#10b981';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 1500);
            }
        }, index * 450); // Tarayıcı bloklanmasını önlemek için 450ms tolerans
    });
}

function getFakeMetrics(type) {
    let m = '';
    if (type === 'Doğalgaz') {
        m = `<div class="v11-info-row"><span class="v11-info-label">Hat Basıncı (Bar):</span> <span class="v11-info-value text-green">2.4 Bar</span></div>
             <div class="v11-info-row"><span class="v11-info-label">Sızıntı Tespiti:</span> <span class="v11-info-value text-green">Negatif (Güvenli)</span></div>`;
    } else if (type === 'Elektrik Panosu' || type === 'Elektrik Direği') {
        m = `<div class="v11-info-row"><span class="v11-info-label">Çalışma Voltajı:</span> <span class="v11-info-value">225 V</span></div>
             <div class="v11-info-row"><span class="v11-info-label">Anlık Akım:</span> <span class="v11-info-value">4.2 A</span></div>`;
    } else if (type === 'Baz İstasyonu') {
        m = `<div class="v11-info-row"><span class="v11-info-label">Sinyal Kazancı:</span> <span class="v11-info-value text-blue">87 dBm</span></div>
             <div class="v11-info-row"><span class="v11-info-label">Veri Trafiği:</span> <span class="v11-info-value">450 Mbps</span></div>`;
    } else if (type === 'Kabin') {
        m = `<div class="v11-info-row"><span class="v11-info-label">İç Ortam Sıcaklığı:</span> <span class="v11-info-value text-orange">28 °C</span></div>
             <div class="v11-info-row"><span class="v11-info-label">İç Ortam Nemi:</span> <span class="v11-info-value">%45</span></div>`;
    } else { // Menhol vs
        m = `<div class="v11-info-row"><span class="v11-info-label">Kapak Durumu:</span> <span class="v11-info-value text-green">Kapalı & Sensör Aktif</span></div>
             <div class="v11-info-row"><span class="v11-info-label">Su/Nem Algılaması:</span> <span class="v11-info-value">Yok</span></div>`;
    }
    m += `<div class="v11-info-row" style="border-bottom:none; padding-bottom:0;"><span class="v11-info-label">Telemetri Senkronu:</span> <span class="v11-info-value">5 dk. önce</span></div>`;
    return m;
}

// Görsel Büyütme (Lightbox) Fonksiyonu - Detayları Göstermek İçin Optimize Edildi
window.openLightbox = function(src) {
    if (!src) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; inset:0; background:rgba(7, 10, 15, 0.98); z-index:100000; display:flex; align-items:center; justify-content:center; cursor:zoom-out; backdrop-filter:blur(15px); animation:v11FadeIn 0.3s;";
    overlay.innerHTML = `
        <div style="position:relative; width:92vw; height:92vh; display:flex; align-items:center; justify-content:center; pointer-events:none;">
             <img src="${src}" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; border-radius:8px; box-shadow:0 30px 100px rgba(0,0,0,0.8); pointer-events:auto; cursor:zoom-in; transition: transform 0.3s ease; animation:zoomSoft 0.4s cubic-bezier(0.16, 1, 0.3, 1);" 
                  onclick="event.stopPropagation(); this.style.transform = (this.style.transform === 'scale(1.5)') ? 'scale(1)' : 'scale(1.5)'; this.style.cursor = (this.style.transform === 'scale(1.5)') ? 'zoom-out' : 'zoom-in';">
             <div style="position:absolute; bottom: -40px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.6); font-size:12px; font-weight:600; font-family:sans-serif; pointer-events:none;">
                <i class="fas fa-search-plus" style="margin-right:5px;"></i> Detaylar için fotoğrafa tıklayın
             </div>
             <i class="fas fa-times" style="position:absolute; top:10px; right:10px; color:white; font-size:28px; cursor:pointer; padding:15px; opacity:0.6; transition:opacity 0.2s; pointer-events:auto; z-index:10;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" onclick="this.parentElement.parentElement.remove()"></i>
        </div>
        <style>@keyframes zoomSoft { from {transform: scale(0.95); opacity:0;} to {transform: scale(1); opacity:1;} }</style>
    `;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function renderItem(box, item) {
    box.innerHTML = `
        <style>
            .v11-element-viewer {
                display: flex;
                flex-direction: column;
                height: calc(100vh - 120px);
                padding-bottom: 20px;
                overflow-y: auto;
            }
            .v11-element-viewer::-webkit-scrollbar { display: none; }
            
            /* Premium Image Uploader */
            .v11-element-image {
                position: relative;
                width: 100%;
                height: 240px;
                flex-shrink: 0;
                background: linear-gradient(145deg, #f8fafc, #f1f5f9);
                border-radius: 20px;
                margin-bottom: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #64748b;
                overflow: hidden;
                border: 2px dashed #cbd5e1;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
            }
            .v11-element-image:hover {
                border-color: #3b82f6;
                background: #eff6ff;
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
            }
            .v11-element-image.has-image {
                border-style: solid;
                border-color: #e2e8f0;
                background: #fff;
            }
            .v11-element-image img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                transition: transform 0.5s ease;
            }
            .v11-element-image:hover img {
                transform: scale(1.03);
            }
            .v11-image-overlay {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, 0.5);
                backdrop-filter: blur(3px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                opacity: 0;
                transition: all 0.3s ease;
            }
            .v11-element-image:hover .v11-image-overlay {
                opacity: 1;
            }
            .v11-upload-icon {
                font-size: 32px;
                margin-bottom: 12px;
                background: linear-gradient(135deg, #3b82f6, #06b6d4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                transition: transform 0.3s ease;
            }
            .v11-element-image:hover .v11-upload-icon {
                transform: scale(1.1);
            }
            .v11-upload-text {
                font-size: 13px;
                font-weight: 700;
                color: #475569;
            }
            .v11-element-image:hover .v11-upload-text {
                color: #2563eb;
            }
            .v11-overlay-text {
                font-size: 14px;
                font-weight: 700;
                margin-top: 10px;
                letter-spacing: 0.5px;
            }

            /* Premium Info Card */
            .v11-element-info {
                margin-bottom: 24px;
                background: white;
                padding: 20px;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                position: relative;
                overflow: hidden;
            }
            .v11-element-info::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 4px; height: 100%;
                background: linear-gradient(to bottom, #3b82f6, #06b6d4);
            }
            .v11-info-title {
                font-size: 10px;
                color: #64748b;
                margin-bottom: 16px;
                font-weight: 800;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .v11-info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            .v11-info-label {
                font-weight: 600;
                color: #475569;
                font-size: 12px;
            }
            .v11-info-value {
                font-weight: 800;
                font-size: 13px;
                color: #1e293b;
            }
            .text-green { color: #10b981; }
            .text-blue { color: #3b82f6; }
            .text-orange { color: #f59e0b; }

            /* Premium Action Buttons */
            .v11-action-row {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                margin-top: 24px;
            }
            .v11-action-btn {
                position: relative;
                padding: 14px 10px;
                border: none;
                border-radius: 14px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                background: white;
                border: 1px solid;
                z-index: 1;
            }
            .v11-action-btn::before {
                content: '';
                position: absolute;
                inset: 0;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: -1;
            }
            .v11-action-btn:hover {
                transform: translateY(-3px);
                color: white;
            }
            .v11-action-btn:hover::before {
                opacity: 1;
            }
            .v11-action-btn i {
                font-size: 16px;
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .v11-action-btn:hover i {
                transform: scale(1.15) rotate(-5deg);
            }

            .btn-word {
                color: #2563eb;
                border-color: #bfdbfe;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
            }
            .btn-word::before { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .btn-word:hover { border-color: transparent; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }

            .btn-pdf {
                color: #dc2626;
                border-color: #fecaca;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.05);
            }
            .btn-pdf::before { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .btn-pdf:hover { border-color: transparent; box-shadow: 0 10px 20px rgba(220, 38, 38, 0.2); }

            .btn-edit {
                color: #d97706;
                border-color: #fde68a;
                box-shadow: 0 4px 12px rgba(217, 119, 6, 0.05);
            }
            .btn-edit::before { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .btn-edit:hover { border-color: transparent; box-shadow: 0 10px 20px rgba(217, 119, 6, 0.2); }

            .btn-location {
                color: #059669;
                border-color: #a7f3d0;
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.05);
            }
            .btn-location::before { background: linear-gradient(135deg, #10b981, #059669); }
            .btn-location:hover { border-color: transparent; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.2); }

            @media (min-width: 480px) {
                .v11-action-row {
                    grid-template-columns: repeat(4, 1fr);
                }
                .v11-action-btn {
                    font-size: 11px;
                    flex-direction: column;
                    padding: 12px 5px;
                    gap: 6px;
                }
                .v11-action-btn i {
                    font-size: 20px;
                }
            }
        </style>
        <div class="v11-header-nav">
            <button onclick="goBack()" class="v11-back-btn"><i class="fas fa-chevron-left"></i> ${item.belediyeName.toUpperCase()}</button>
            <h2><i class="fas ${getIconForType(item.type)}" style="color: #64748b; margin-right: 8px;"></i>${item.title}</h2>
        </div>
        
        <div class="v11-element-viewer">
            <!-- Ana Görsel Alanı -->
            <div class="v11-element-image ${item.image ? 'has-image' : ''}" onclick="${item.image ? `openLightbox('${item.image}')` : `triggerImageUpload('${item.id}')`}" title="${item.image ? 'Büyütmek için tıklayın' : 'Görsel yüklemek için tıklayın'}">
                ${item.image 
                    ? `<img src="${item.image}" alt="Öğe Görseli" />
                       <div class="v11-image-overlay">
                           <i class="fas fa-search-plus" style="font-size:32px;"></i>
                           <span class="v11-overlay-text">Görseli Büyüt</span>
                       </div>` 
                    : `<i class="fas fa-image v11-upload-icon"></i>
                       <span class="v11-upload-text">Görsel Yüklemek İçin Tıklayın</span>`
                }
            </div>

            <!-- 4'lü Alt Butonlar -->
            <div class="v11-action-row">
                <button class="v11-action-btn btn-word" onclick="alert('Word formatında indiriliyor...')"><i class="fas fa-file-word"></i> Word</button>
                <button class="v11-action-btn btn-pdf" onclick="alert('PDF formatında indiriliyor...')"><i class="fas fa-file-pdf"></i> PDF</button>
                <button class="v11-action-btn btn-edit" onclick="triggerImageUpload('${item.id}')"><i class="fas fa-camera"></i> Düzenle</button>
                <button class="v11-action-btn btn-location" onclick="zoomToItemCenter(${item.coords[0]}, ${item.coords[1]})"><i class="fas fa-map-marker-alt"></i> Konum</button>
            </div>
        </div>
    `;
}

// Görsel Yükleme İşlemi (Görseli Küçülterek Kaydetme - LocalStorage Dostu)
window.triggerImageUpload = function(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                // Görseli max 1200px olacak şekilde oranla küçültelim (Performans ve Kota yönetimi için)
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 1200;

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Kaliteyi %70'e düşürerek Base64 boyutunu devasa ölçüde (yaklaşık 1/10) küçültürüz
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                
                const item = allItems.find(x => x.id === id);
                if(item) {
                    item.image = compressedBase64;
                    // Eğer şu an bu item detayındaysak selectedItem'ı da tazeleyelim
                    if(selectedItem && selectedItem.id === id) selectedItem.image = compressedBase64;
                    
                    saveDataToStorage(); 
                    
                    if (currentView === 'Item' && selectedItem && selectedItem.id === id) {
                        renderItem(document.getElementById('sidebarContent'), item);
                    }
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Silme İşlemi
window.deleteItem = function(id) {
    if(confirm("Bu öğeyi sistemden kaldırmak istediğinize emin misiniz?")) {
        allItems = allItems.filter(x => x.id !== id);
        saveDataToStorage();
        syncMarkers(selectedBelediye);
        renderSidebar();
        updateGlobalKPIs();
    }
}

/**
 * Navigation Logic
 */
function drillToBelediye(belId) {
    currentView = 'Region'; selectedBelediye = belId;
    const bel = MUNICIPALITIES.find(b => b.id === belId);
    if(bel) window.selectedProvince = bel.province;
    
    renderSidebar(); syncMarkers(belId);
    
    // Tüm sınırları haritadan kaldır:
    MUNICIPALITIES.forEach(b => {
        if (b.boundaryLayer && map.hasLayer(b.boundaryLayer)) {
            map.removeLayer(b.boundaryLayer);
        }
    });

    if(bel) {
        // Seçili sınırı haritaya ekle:
        if (bel.boundaryLayer && !map.hasLayer(bel.boundaryLayer)) {
            map.addLayer(bel.boundaryLayer);
        }

        if(bel.osmBounds) {
            // Eğer gerçek sınır var ise o sınıra tam oturacak şekilde yakınlaştır (Çok havalı!)
            map.flyToBounds(bel.osmBounds, { padding: [20, 20], duration: 2.5 });
        } else {
            map.flyTo(bel.coords, 12, { duration: 2.5 });
        }
    }
}

function zoomToItem(item) {
    currentView = 'Item'; 
    selectedItem = item;
    selectedBelediye = item.belediyeId;
    
    // Tüm sınırları haritadan kaldır:
    MUNICIPALITIES.forEach(b => {
        if (b.boundaryLayer && map.hasLayer(b.boundaryLayer)) {
            map.removeLayer(b.boundaryLayer);
        }
    });

    // Seçili öğenin belediyesini bul ve sınırını ekle
    const bel = MUNICIPALITIES.find(b => b.id === item.belediyeId);
    if(bel) {
        window.selectedProvince = bel.province;
        if(bel.boundaryLayer && !map.hasLayer(bel.boundaryLayer)) {
            map.addLayer(bel.boundaryLayer);
        }
    }
    
    syncMarkers(item.belediyeId); // Markörleri de sadece o bölgeye indirge

    renderSidebar();
    map.flyTo(item.coords, 17, { duration: 2.0 });
}

function zoomToItemCenter(lat, lng) {
    if (map) {
        map.flyTo([lat, lng], 18, { duration: 2.0 });
    }
}

function showItemById(id) {
    const s = allItems.find(x => x.id === id);
    if(s) zoomToItem(s);
}

function goBack() {
    if (currentView === 'Item') {
        currentView = 'Region'; 
        const bel = MUNICIPALITIES.find(b => b.id === selectedBelediye);
        if(bel) {
            window.selectedProvince = bel.province;
            if(bel.osmBounds) {
                map.flyToBounds(bel.osmBounds, { padding: [20, 20], duration: 2.0 });
            } else {
                map.flyTo(bel.coords, 12, { duration: 2.0 });
            }
        } else {
            // Tedbir amaçlı, eğer belediye bulunamazsa globale dön
            currentView = 'Global';
            selectedBelediye = 'All';
            window.selectedProvince = null;
            syncMarkers('All');
            map.flyTo([39.0, 35.0], 6, { duration: 3 });
        }
    }
    else if (currentView === 'Region') { 
        currentView = 'Province'; 
        selectedBelediye = 'All'; 
        syncMarkers('All'); 
        
        // Tüm sınırları haritadan kaldır:
        MUNICIPALITIES.forEach(b => {
            if (b.boundaryLayer && map.hasLayer(b.boundaryLayer)) {
                map.removeLayer(b.boundaryLayer);
            }
        });

        const provinceMuns = MUNICIPALITIES.filter(m => m.province === window.selectedProvince);
        if(provinceMuns.length > 0) {
            let alat = 0, alng = 0;
            provinceMuns.forEach(m => { alat += m.coords[0]; alng += m.coords[1]; });
            alat /= provinceMuns.length;
            alng /= provinceMuns.length;
            map.flyTo([alat, alng], 9, { duration: 2.0 });
        } else {
            currentView = 'Global';
            window.selectedProvince = null;
            map.flyTo([39.0, 35.0], 6, { duration: 3 }); 
        }
    }
    else if (currentView === 'Province') {
        currentView = 'Global'; 
        selectedBelediye = 'All';
        window.selectedProvince = null;
        syncMarkers('All'); 
        
        map.flyTo([39.0, 35.0], 6, { duration: 3 }); 
    }
    renderSidebar();
}

function updateGlobalKPIs() {
    // Mobil/Masaüstü optimizasyonu sebebiyle "CANLI SİSTEM METRİKLERİ" kaldırıldığı için 
    // çalışması durduruldu. Eski çağrımların hata vermemesi için fonksiyon burada boş bekliyor.
}

function startActivityStream() {
    const statusText = document.querySelector('.system-status span:last-child');
    if(!statusText) return;
    const scenarios = ["Harita Sınırları OpenStreetMap'ten Alınıyor...", "Bağlantı Bekleniyor...", "Bölge Analizi Güncel.", "Görsel Taraması Yapılıyor..."];
    setInterval(() => {
        statusText.style.opacity = '0';
        setTimeout(() => {
            statusText.textContent = scenarios[Math.floor(Math.random()*scenarios.length)];
            statusText.style.opacity = '1';
        }, 500);
    }, 4000);
}

// Global Search
document.getElementById('masterSearch').oninput = (e) => {
    const t = e.target.value.toLowerCase();
    if(!t) { renderSidebar(); return; }
    
    // İl, Belediye ve Öğe içerisinde ara
    const filtered = allItems.filter(s => 
        (s.type && s.type.toLowerCase().includes(t)) || 
        (s.belediyeName && s.belediyeName.toLowerCase().includes(t)) || 
        (s.title && s.title.toLowerCase().includes(t))
    );
    
    // İl (Province) veya Belediyelerden eşleşen olursa onlara ait kayıtları da çıkar
    const matchingMuns = MUNICIPALITIES.filter(m => 
        (m.name && m.name.toLowerCase().includes(t)) || 
        (m.province && m.province.toLowerCase().includes(t))
    );
    
    // Eğer bir belediye veya il adıyla arama yapıldıysa o belediyedeki tüm itemları da listeye ekle
    let finalResults = [...filtered];
    matchingMuns.forEach(m => {
        const mItems = allItems.filter(item => item.belediyeId === m.id);
        mItems.forEach(mi => {
            if(!finalResults.find(fr => fr.id === mi.id)) {
                finalResults.push(mi);
            }
        });
    });
    
    finalResults = finalResults.slice(0, 30);
    
    const box = document.getElementById('sidebarContent');
    box.innerHTML = `<h5 style="color:#94a3b8; font-size:0.75rem; margin-bottom:15px; letter-spacing:0.5px; text-transform:uppercase;">ARAMA SONUÇLARI (${finalResults.length})</h5>`;
    
    if (finalResults.length === 0) {
        box.innerHTML += `<div style="text-align:center; padding:30px; color:#94a3b8; font-size:0.85rem;">Sonuç Bulunamadı</div>`;
    }
    
    finalResults.forEach(s => {
        const item = document.createElement('div');
        item.className = 'v11-list-row';
        item.innerHTML = `
            <div class="v11-row-main" style="width:100%;">
                <strong style="color:#3b82f6; font-size:0.95rem;">${s.title}</strong>
                <p style="margin-top:4px;"><i class="fas fa-map-marker-alt"></i> ${s.belediyeName} &nbsp;|&nbsp; <b>${s.type}</b></p>
            </div>
        `;
        item.onclick = () => zoomToItem(s);
        box.appendChild(item);
    });
};

window.startFastAddProcess = function() {
    if (!navigator.geolocation) {
        alert("Tarayıcınız konum özelliğini desteklemiyor.");
        return;
    }

    const btn = document.querySelector('.fast-add-btn');
    if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Konum Bekleniyor...</span>';

    const proceedWithCoords = (lat, lng) => {
        if(btn) btn.innerHTML = '<i class="fas fa-camera"></i> <span>Hızlı Ekle</span>';
        
        window.openCameraModal((base64Image) => {
            if (!base64Image) return;

            window.showCustomTypeModal((selectedType) => {
                if(!selectedType) return;
                
                let bName = 'Bilinmeyen Bölge';
                let bId = 'kadikoy';
                
                // Seçili Belediyeyi her zaman en yakın GPS'e göre tespit et (Hatalı Bölgeye atanmasını engeller)
                let minDist = Infinity;
                const userLatLng = L.latLng(lat, lng);
                
                MUNICIPALITIES.forEach(b => {
                    const dist = userLatLng.distanceTo(L.latLng(b.coords[0], b.coords[1]));
                    if(dist < minDist) {
                        minDist = dist;
                        bName = b.name;
                        bId = b.id;
                    }
                });

                const rId = Math.random().toString(36).substring(2, 6).toUpperCase();
                const newItem = {
                    id: `ITM-FAST-${rId}`,
                    title: `Yeni ${selectedType} ${rId}`,
                    type: selectedType,
                    belediyeId: bId,
                    belediyeName: bName,
                    coords: [lat, lng],
                    status: 'Aktif',
                    perf: 100,
                    kurulumTarihi: new Date().toISOString().split('T')[0],
                    image: base64Image
                };
                
                allItems.push(newItem);
                saveDataToStorage();
                
                if (selectedBelediye === 'All' || selectedBelediye === bId) {
                    syncMarkers(selectedBelediye);
                    renderSidebar();
                }
                updateGlobalKPIs();
                
                map.flyTo([lat, lng], 18, { duration: 1.5 });
                setTimeout(() => showItemById(newItem.id), 1600);
            });
        });
    };

    navigator.geolocation.getCurrentPosition((pos) => {
        proceedWithCoords(pos.coords.latitude, pos.coords.longitude);
    }, (err) => {
        alert("GPS Konumu alınamadı. Haritada baktığınız merkez nokta kullanılacak.");
        const center = map.getCenter();
        proceedWithCoords(center.lat, center.lng);
    }, { enableHighAccuracy: true });
};

window.openCameraModal = function(callback) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
    modal.style.zIndex = '12000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backdropFilter = 'blur(15px)';
    
    // UI Elements
    modal.innerHTML = `
        <div style="background:white; padding:20px; border-radius:24px; width:90%; max-width:400px; box-shadow:0 25px 50px rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center;">
            <h3 style="margin-bottom:15px; font-size:1.3rem; color:#0f172a; font-weight:800; font-family:'Outfit',sans-serif;">Kamera</h3>
            <div style="width:100%; aspect-ratio:3/4; background:#1e293b; border-radius:16px; overflow:hidden; position:relative; margin-bottom:20px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
                <video id="cameraVideo" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
            </div>
            
            <div style="display:flex; gap:10px; width:100%;">
                <button id="cancelCamBtn" style="flex:1; padding:15px; border-radius:16px; border:none; background:#f1f5f9; color:#64748b; font-weight:800; font-size:1rem; cursor:pointer;">İptal</button>
                <button id="captureCamBtn" style="flex:2; padding:15px; border-radius:16px; border:none; background:linear-gradient(135deg, #3b82f6, #2563eb); color:white; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 10px 20px rgba(37,99,235,0.3); display:flex; justify-content:center; align-items:center; gap:8px;">
                    <i class="fas fa-camera"></i> Fotoğraf Çek
                </button>
            </div>
            
            <button id="fallbackUploadBtn" style="margin-top:15px; background:none; border:none; color:#3b82f6; font-size:0.85rem; font-weight:700; cursor:pointer; text-decoration:underline;">Kamera çalışmıyorsa dosyadan seç</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const cancelBtn = document.getElementById('cancelCamBtn');
    const captureBtn = document.getElementById('captureCamBtn');
    const fallbackBtn = document.getElementById('fallbackUploadBtn');
    let stream = null;

    // Kamerayı Başlat
    const startCamera = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            video.srcObject = stream;
        } catch (err) {
            console.warn("Kamera açılamadı:", err);
            // Fallback'i vurgula
            fallbackBtn.style.color = '#ef4444';
            fallbackBtn.style.fontSize = '1rem';
            fallbackBtn.textContent = 'Kamera bulunamadı. Lütfen dosyadan seçiniz.';
        }
    };
    
    startCamera();

    const stopCameraAndClose = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        modal.remove();
    };

    cancelBtn.onclick = () => {
        stopCameraAndClose();
        callback(null);
    };

    captureBtn.onclick = () => {
        if(!stream) {
            alert("Kamera hazır değil!");
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Resmi base64 olarak al
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        stopCameraAndClose();
        callback(dataUrl);
    };
    
    fallbackBtn.onclick = () => {
        stopCameraAndClose();
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return callback(null);
            const reader = new FileReader();
            reader.onload = (event) => callback(event.target.result);
            reader.readAsDataURL(file);
        };
        input.click();
    };
};

window.showCustomTypeModal = function(callback) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
    modal.style.zIndex = '11000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backdropFilter = 'blur(10px)';
    
    const content = document.createElement('div');
    content.style.background = 'white';
    content.style.padding = '30px';
    content.style.borderRadius = '24px';
    content.style.width = '90%';
    content.style.maxWidth = '400px';
    content.style.fontFamily = "'Outfit', sans-serif";
    content.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
    content.style.animation = 'v11FadeIn 0.3s ease-out';
    
    content.innerHTML = `
        <h3 style="margin-bottom:10px; text-align:center; font-size:1.4rem; color:#0f172a; font-weight:800;">Ne İşaretlediniz?</h3>
        <p style="text-align:center; color:#64748b; font-size:0.9rem; margin-bottom:20px;">Konumunuz alındı ve fotoğraf başarıyla eşleştirildi. Lütfen öğe türünü seçin.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom: 24px;">
            ${ITEM_TYPES.map(t => `
            <button style="padding:15px 10px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:16px; cursor:pointer; font-weight:700; color:#334155; transition:0.2s; font-size:0.9rem;" 
                    onmouseover="this.style.borderColor='#3b82f6'; this.style.color='#3b82f6'" 
                    onmouseout="this.style.borderColor='#e2e8f0'; this.style.color='#334155'"
                    onclick="window.selectTypeFromModal('${t}')">
                <i class="fas ${getIconForType(t)}" style="margin-right:8px; opacity:0.7"></i>${t}
            </button>`).join('')}
        </div>
        <button onclick="window.cancelTypeModal()" style="width:100%; padding:16px; border-radius:16px; border:none; background:#f1f5f9; color:#ef4444; font-weight:800; font-size:1rem; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#f1f5f9'">İptal Et</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    window.selectTypeFromModal = (type) => {
        modal.remove();
        callback(type);
    };
    window.cancelTypeModal = () => {
        modal.remove();
        callback(null);
    };
};

window.onload = initv11System;
