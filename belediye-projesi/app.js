// Jumbo Market Mock Data with Financial Metrics
const stores = [
    {
        id: 1,
        name: "Jumbo İstanbul - Nişantaşı",
        city: "İstanbul",
        country: "Türkiye",
        address: "Teşvikiye Mah. Vali Konağı Cad. No:12, Şişli",
        phone: "+90 212 555 1234",
        coords: [41.0475, 28.9897],
        hours: "08:00 - 22:00",
        status: "açık",
        revenue: 125000,
        expense: 82000,
        performance: 85,
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Jumbo Ankara - Çankaya",
        city: "Ankara",
        country: "Türkiye",
        address: "Arjantin Cd. No:18, Gaziosmanpaşa",
        phone: "+90 312 444 0987",
        coords: [39.8913, 32.8617],
        hours: "09:00 - 22:00",
        status: "açık",
        revenue: 98000,
        expense: 65000,
        performance: 78,
        image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Jumbo Berlin - Mitte",
        city: "Berlin",
        country: "Almanya",
        address: "Friedrichstraße 67, 10117 Berlin",
        phone: "+49 30 888 9900",
        coords: [52.5200, 13.4050],
        hours: "07:00 - 21:00",
        status: "açık",
        revenue: 150000,
        expense: 110000,
        performance: 92,
        image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "Jumbo Paris - Le Marais",
        city: "Paris",
        country: "Fransa",
        address: "15 Rue de Rivoli, 75004 Paris",
        phone: "+33 1 42 77 00 11",
        coords: [48.8566, 2.3522],
        hours: "08:30 - 22:30",
        status: "kapalı",
        revenue: 110000,
        expense: 95000,
        performance: 64,
        image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "Jumbo London - Mayfair",
        city: "Londra",
        country: "İngiltere",
        address: "87-135 Brompton Rd, SW1X 7XL",
        phone: "+44 20 7730 1234",
        coords: [51.5014, -0.1419],
        hours: "09:00 - 21:00",
        status: "açık",
        revenue: 210000,
        expense: 145000,
        performance: 95,
        image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 6,
        name: "Jumbo New York - Soho",
        city: "New York",
        country: "ABD",
        address: "524 Broadway, NY 10012",
        phone: "+1 212 555 7890",
        coords: [40.7233, -73.9992],
        hours: "06:00 - 00:00",
        status: "açık",
        revenue: 350000,
        expense: 280000,
        performance: 88,
        image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80"
    }
];

let map;
let markers = {};

function initMap() {
    // HARİTA TEK DÜNYA AYARI
    map = L.map('map', {
        center: [20, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: false,
        crs: L.CRS.EPSG3857 // Standart CRS
    });

    const southWest = L.latLng(-85, -179);
    const northEast = L.latLng(85, 179);
    const bounds = L.latLngBounds(southWest, northEast);

    map.setMaxBounds(bounds);
    map.on('drag', function() {
        map.panInsideBounds(bounds, { animate: false });
    });

    // Okyanus Rengi
    document.getElementById('map').style.backgroundColor = '#e0f2fe';

    // Tile Layer - noWrap: true ÇOK ÖNEMLİ
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        noWrap: true,
        bounds: bounds,
        minZoom: 2,
        maxZoom: 18
    }).addTo(map);

    // Ülkeleri Renklendir
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(res => res.json())
        .then(data => {
            const colors = ['#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#fed7aa'];
            L.geoJson(data, {
                style: (f) => ({
                    fillColor: colors[Math.abs(f.properties.name.length) % colors.length],
                    weight: 1,
                    opacity: 1,
                    color: '#fff',
                    fillOpacity: 0.6
                }),
                onEachFeature: (f, layer) => {
                    layer.on('mouseover', (e) => e.target.setStyle({ fillOpacity: 0.8 }));
                    layer.on('mouseout', (e) => e.target.setStyle({ fillOpacity: 0.6 }));
                }
            }).addTo(map);
            addStoreMarkers();
        });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Loader Gizle
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 1000);
}

function createCustomIcon() {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker"><i class="fas fa-shopping-cart"></i></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
}

function addStoreMarkers() {
    Object.values(markers).forEach(m => map.removeLayer(m));
    stores.forEach(store => {
        const profit = store.revenue - store.expense;
        const marker = L.marker(store.coords, { 
            icon: createCustomIcon(),
            zIndexOffset: 1000 
        }).addTo(map);
        
        const popupContent = `
            <div class="popup-card crm-style">
                <div class="popup-header" style="background-image: url('${store.image}')">
                    <div class="header-overlay">
                        <h3>${store.name}</h3>
                        <span class="status-badge ${store.status === 'açık' ? 'status-open' : 'status-closed'}">${store.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="popup-details">
                    <div class="stats-grid">
                        <div class="stat-box">
                            <i class="fas fa-chart-line green"></i>
                            <div>
                                <small>Gelir</small>
                                <strong>$${store.revenue.toLocaleString()}</strong>
                            </div>
                        </div>
                        <div class="stat-box">
                            <i class="fas fa-wallet red"></i>
                            <div>
                                <small>Gider</small>
                                <strong>$${store.expense.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="profit-highlight ${profit > 0 ? 'pos' : 'neg'}">
                        <span>Net Kar:</span>
                        <strong>$${profit.toLocaleString()}</strong>
                    </div>
                    <div class="perf-bar">
                        <div class="bar-label">
                            <small>Verimlilik</small>
                            <small>%${store.performance}</small>
                        </div>
                        <div class="bar-bg"><div class="bar-fill" style="width: ${store.performance}%"></div></div>
                    </div>
                    <div class="popup-actions">
                        <button onclick="changeStatus(${store.id})" class="btn-action">Durumu Değiştir</button>
                    </div>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300, className: 'crm-popup' });
        markers[store.id] = marker;
        marker.on('click', () => focusStore(store.id, false));
    });
}

window.changeStatus = (id) => {
    const store = stores.find(s => s.id === id);
    if (store) {
        store.status = store.status === 'açık' ? 'kapalı' : 'açık';
        addStoreMarkers();
        renderStoreList();
        markers[id].openPopup();
    }
};

function renderStoreList(filteredStores = stores) {
    const listContainer = document.getElementById('storeList');
    listContainer.innerHTML = '';
    filteredStores.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.id = `card-${store.id}`;
        card.innerHTML = `
            <img src="${store.image}" class="store-image-small" alt="${store.name}">
            <div class="store-info">
                <h3>${store.name}</h3>
                <p><i class="fas fa-coins"></i> Kar: $${(store.revenue - store.expense).toLocaleString()}</p>
                <div class="status-badge ${store.status === 'açık' ? 'status-open' : 'status-closed'}">${store.status.toUpperCase()}</div>
            </div>
        `;
        card.addEventListener('click', () => focusStore(store.id, true));
        listContainer.appendChild(card);
    });
}

function focusStore(id, openPopup = true) {
    const store = stores.find(s => s.id === id);
    if (!store) return;
    map.flyTo(store.coords, 14, { duration: 1.5 });
    if (openPopup) markers[id].openPopup();
    document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.getElementById(`card-${id}`);
    if (activeCard) {
        activeCard.classList.add('active');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

document.getElementById('storeSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = stores.filter(s => s.name.toLowerCase().includes(term) || s.city.toLowerCase().includes(term));
    renderStoreList(filtered);
});

window.onload = () => {
    initMap();
    renderStoreList();
};
