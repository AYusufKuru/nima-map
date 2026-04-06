// JUMBO v4 - GLOBAL EXPANSION & FAST NAVIGATION
const stores = [
    // Türkiye
    { id: 1, name: "Jumbo İstanbul - Nişantaşı", city: "İstanbul", region: "Türkiye", coords: [41.0475, 28.9897], status: "açık", revenue: 145000, expense: 88000, performance: 88, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
    { id: 2, name: "Jumbo İstanbul - Bebek", city: "İstanbul", region: "Türkiye", coords: [41.0772, 29.0436], status: "açık", revenue: 165000, expense: 92000, performance: 91, image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80" },
    { id: 3, name: "Jumbo Ankara - Çankaya", city: "Ankara", region: "Türkiye", coords: [39.8913, 32.8617], status: "açık", revenue: 98000, expense: 65000, performance: 78, image: "https://images.unsplash.com/photo-1543083477-4f7f44ade442?auto=format&fit=crop&w=800&q=80" },
    { id: 4, name: "Jumbo İzmir - Alsancak", city: "İzmir", region: "Türkiye", coords: [38.4357, 27.1395], status: "açık", revenue: 112000, expense: 74000, performance: 82, image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80" },
    
    // Hollanda (Genişletilmiş)
    { id: 101, name: "Jumbo Amsterdam - Dam", city: "Amsterdam", region: "Hollanda", coords: [52.3731, 4.8926], status: "açık", revenue: 250000, expense: 180000, performance: 90, image: "https://images.unsplash.com/photo-1601614217112-70b797086888?auto=format&fit=crop&w=800&q=80" },
    { id: 102, name: "Jumbo Amsterdam - Zuid", city: "Amsterdam", region: "Hollanda", coords: [52.3400, 4.8700], status: "açık", revenue: 210000, expense: 140000, performance: 88, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
    { id: 103, name: "Jumbo Rotterdam - Markthal", city: "Rotterdam", region: "Hollanda", coords: [51.9202, 4.4851], status: "açık", revenue: 220000, expense: 155000, performance: 89, image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80" },
    { id: 104, name: "Jumbo Rotterdam - Kralingen", city: "Rotterdam", region: "Hollanda", coords: [51.9300, 4.5100], status: "açık", revenue: 185000, expense: 125000, performance: 84, image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80" },
    { id: 105, name: "Jumbo Utrecht - Hoog Catharijne", city: "Utrecht", region: "Hollanda", coords: [52.0910, 5.1150], status: "açık", revenue: 195000, expense: 130000, performance: 86, image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80" },
    { id: 106, name: "Jumbo Eindhoven - Center", city: "Eindhoven", region: "Hollanda", coords: [51.4400, 5.4770], status: "açık", revenue: 170000, expense: 110000, performance: 81, image: "https://images.unsplash.com/photo-1543083477-4f7f44ade442?auto=format&fit=crop&w=800&q=80" },
    { id: 107, name: "Jumbo The Hague - Passage", city: "Lahey", region: "Hollanda", coords: [52.0780, 4.3110], status: "açık", revenue: 205000, expense: 145000, performance: 87, image: "https://images.unsplash.com/photo-1601614217112-70b797086888?auto=format&fit=crop&w=800&q=80" },
    { id: 108, name: "Jumbo Groningen - Vismarkt", city: "Groningen", region: "Hollanda", coords: [53.2170, 6.5650], status: "açık", revenue: 155000, expense: 105000, performance: 79, image: "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=800&q=80" },
    { id: 109, name: "Jumbo Leiden - Stadtt", city: "Leiden", region: "Hollanda", coords: [52.1601, 4.4970], status: "açık", revenue: 162000, expense: 112000, performance: 82, image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80" },
    { id: 110, name: "Jumbo Delft - Center", city: "Delft", region: "Hollanda", coords: [52.0116, 4.3571], status: "açık", revenue: 158000, expense: 108000, performance: 80, image: "https://images.unsplash.com/photo-1580913425028-21d743a6d71b?auto=format&fit=crop&w=800&q=80" },
    { id: 111, name: "Jumbo Breda - City", city: "Breda", region: "Hollanda", coords: [51.5891, 4.7743], status: "kapalı", revenue: 140000, expense: 105000, performance: 68, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },

    // Avrupa (Genişletilmiş)
    { id: 201, name: "Jumbo Berlin - Mitte", city: "Berlin", region: "Avrupa", coords: [52.5200, 13.4050], status: "açık", revenue: 190000, expense: 130000, performance: 85, image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80" },
    { id: 202, name: "Jumbo Paris - Rivoli", city: "Paris", region: "Avrupa", coords: [48.8566, 2.3522], status: "açık", revenue: 240000, expense: 170000, performance: 89, image: "https://images.unsplash.com/photo-1512418490979-92798ccc1380?auto=format&fit=crop&w=800&q=80" },
    { id: 203, name: "Jumbo London - Mayfair", city: "Londra", region: "Avrupa", coords: [51.5014, -0.1419], status: "açık", revenue: 280000, expense: 190000, performance: 92, image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80" },
    { id: 204, name: "Jumbo Rome - Center", city: "Roma", region: "Avrupa", coords: [41.9028, 12.4964], status: "açık", revenue: 175000, expense: 120000, performance: 83, image: "https://images.unsplash.com/photo-1573855619003-97b4799dcd8b?auto=format&fit=crop&w=800&q=80" },
    { id: 205, name: "Jumbo Madrid - Sol", city: "Madrid", region: "Avrupa", coords: [40.4168, -3.7038], status: "kapalı", revenue: 160000, expense: 115000, performance: 72, image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80" },
    
    // Orta Doğu & Asya
    { id: 301, name: "Jumbo Dubai - Mall", city: "Dubai", region: "Asya & O.Doğu", coords: [25.2048, 55.2708], status: "açık", revenue: 450000, expense: 320000, performance: 94, image: "https://images.unsplash.com/photo-1580913425028-21d743a6d71b?auto=format&fit=crop&w=800&q=80" },
    { id: 302, name: "Jumbo Tokyo - Shibuya", city: "Tokyo", region: "Asya & O.Doğu", coords: [35.6580, 139.7016], status: "açık", revenue: 380000, expense: 290000, performance: 91, image: "https://images.unsplash.com/photo-1543083477-4f7f44ade442?auto=format&fit=crop&w=800&q=80" },
    { id: 303, name: "Jumbo Riyadh - Center", city: "Riyad", region: "Asya & O.Doğu", coords: [24.7136, 46.6753], status: "açık", revenue: 210000, expense: 150000, performance: 86, image: "https://images.unsplash.com/photo-1590212151175-e58edd96185b?auto=format&fit=crop&w=800&q=80" },
    { id: 304, name: "Jumbo Seoul - Gangnam", city: "Seul", region: "Asya & O.Doğu", coords: [37.5172, 127.0473], status: "açık", revenue: 320000, expense: 240000, performance: 89, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },

    // Amerika
    { id: 401, name: "Jumbo NYC - Times Square", city: "New York", region: "Amerika", coords: [40.7580, -73.9855], status: "açık", revenue: 520000, expense: 410000, performance: 96, image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80" },
    { id: 402, name: "Jumbo LA - Santa Monica", city: "Los Angeles", region: "Amerika", coords: [34.0194, -118.4912], status: "açık", revenue: 390000, expense: 280000, performance: 93, image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80" },
    { id: 403, name: "Jumbo Chicago - Loop", city: "Chicago", region: "Amerika", coords: [41.8781, -87.6298], status: "açık", revenue: 310000, expense: 230000, performance: 87, image: "https://images.unsplash.com/photo-1543083477-4f7f44ade442?auto=format&fit=crop&w=800&q=80" }
];

let map;
let markers = {};
let currentFilter = 'All';

function initMap() {
    const bounds = L.latLngBounds(L.latLng(-85, -179), L.latLng(85, 179));
    
    map = L.map('map', {
        center: [20, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false
    });

    // Minimalist Okyanus Background
    document.getElementById('map').style.backgroundColor = '#f1f5f9';

    // Sade Harita (Renklendirme kaldırıldı)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        noWrap: true,
        bounds: bounds
    }).addTo(map);

    addStoreMarkers();

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 500);
}

function addStoreMarkers() {
    Object.values(markers).forEach(m => map.removeLayer(m));
    
    const filtered = currentFilter === 'All' ? stores : stores.filter(s => s.region === currentFilter);

    filtered.forEach(store => {
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="custom-marker"><i class="fas fa-shopping-cart"></i></div>`,
            iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40]
        });

        const marker = L.marker(store.coords, { icon: icon, zIndexOffset: 1000 }).addTo(map);
        const profit = store.revenue - store.expense;
        
        const content = `
            <div class="crm-popup-v2">
                <div class="crm-header" style="background-image:url('${store.image}')">
                    <div class="crm-overlay">
                        <h4>${store.name}</h4>
                        <span class="status-v2 ${store.status === 'açık' ? 'open' : 'closed'}">${store.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="crm-body">
                    <div class="crm-stats">
                        <div class="crm-stat"><span>GELİR</span><strong>$${store.revenue.toLocaleString()}</strong></div>
                        <div class="crm-stat"><span>GİDER</span><strong>$${store.expense.toLocaleString()}</strong></div>
                        <div class="crm-stat"><span>KAR</span><strong class="${profit > 0 ? 'plus' : 'minus'}">$${profit.toLocaleString()}</strong></div>
                    </div>
                    <div class="crm-perf">
                        <small>VERİMLİLİK: %${store.performance}</small>
                        <div class="crm-bar"><div class="crm-fill" style="width:${store.performance}%"></div></div>
                    </div>
                    <button class="crm-btn" onclick="toggleStatus(${store.id})">DURUMU DEĞİŞTİR</button>
                </div>
            </div>
        `;

        marker.bindPopup(content, { maxWidth: 300 });
        markers[store.id] = marker;
        
        marker.on('click', () => {
            // HIZLI GEÇİŞ (0.6s)
            map.flyTo(store.coords, 15, { duration: 0.6, easeLinearity: 0.1 });
            marker.openPopup();
        });
    });
}

window.toggleStatus = (id) => {
    const s = stores.find(x => x.id === id);
    if(s) {
        s.status = s.status === 'açık' ? 'kapalı' : 'açık';
        addStoreMarkers();
        renderList();
        markers[id].openPopup();
    }
};

function selectRegion(region) {
    currentFilter = region;
    // UI Güncelleme (Tabları Seçme)
    document.querySelectorAll('.tab').forEach(t => {
        if(t.textContent.trim() === region || (region === 'All' && t.textContent.trim() === 'Hepsi')) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    renderList();
    addStoreMarkers();

    // HIZLI BÖLGE ODAKLANMA (0.8s)
    const animOpt = { duration: 0.8, easeLinearity: 0.1 };
    if(region === 'Hollanda') map.flyTo([52.1326, 5.2913], 8, animOpt);
    else if(region === 'Türkiye') map.flyTo([38.9637, 35.2433], 6, animOpt);
    else if(region === 'Asya & O.Doğu') map.flyTo([25.0, 80.0], 4, animOpt);
    else if(region === 'Avrupa') map.flyTo([48.0, 10.0], 5, animOpt);
    else if(region === 'Amerika') map.flyTo([38.0, -97.0], 4, animOpt);
    else if(region === 'All') map.flyTo([20, 0], 3, animOpt);
}

function renderList(data = stores) {
    const filtered = currentFilter === 'All' ? data : data.filter(s => s.region === currentFilter);
    const list = document.getElementById('storeList');
    list.innerHTML = '';
    
    filtered.forEach(s => {
        const div = document.createElement('div');
        div.className = 'store-card-v2';
        div.innerHTML = `
            <img src="${s.image}">
            <div class="sc-info">
                <h4>${s.name}</h4>
                <p>${s.city} | Kar: $${(s.revenue - s.expense).toLocaleString()}</p>
                <span class="status-v2 ${s.status === 'açık' ? 'open' : 'closed'}">${s.status.toUpperCase()}</span>
            </div>
        `;
        div.onclick = () => {
            map.flyTo(s.coords, 15, { duration: 0.6 });
            markers[s.id].openPopup();
        };
        list.appendChild(div);
    });
}

document.getElementById('storeSearch').oninput = (e) => {
    const t = e.target.value.toLowerCase();
    renderList(stores.filter(x => x.name.toLowerCase().includes(t) || x.city.toLowerCase().includes(t)));
};

window.onload = () => { initMap(); renderList(); };
