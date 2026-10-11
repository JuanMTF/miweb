document.addEventListener('DOMContentLoaded', () => {
    // 1. Desplazamiento suave (smooth scroll)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });

    // 2. Efecto de navbar al hacer scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // 3. Animación de aparición al hacer scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));

    // ==========================================
    // 4. API TIEMPO: MULTICIUDAD
    // ==========================================
    const cities = {
        valencia: { lat: 39.4699, lon: -0.3763, name: 'Valencia' },
        alzira: { lat: 39.1514, lon: -0.4407, name: 'Alzira' },
        xativa: { lat: 38.9908, lon: -0.5150, name: 'Xàtiva' },
        carcagente: { lat: 39.1214, lon: -0.4530, name: 'Carcagente' },
        madrid: { lat: 40.4168, lon: -3.7038, name: 'Madrid' },
        barcelona: { lat: 41.3874, lon: 2.1686, name: 'Barcelona' },
        albacete: { lat: 38.9942, lon: -1.8624, name: 'Albacete' }
    };

    async function fetchWeather(cityKey = 'valencia') {
        const container = document.getElementById('weather-hourly');
        const city = cities[cityKey];
        container.innerHTML = '<p style="padding: 1rem;">Cargando datos de ' + city.name + '...</p>';
        
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&hourly=temperature_2m,weathercode&forecast_hours=12&timezone=Europe/Madrid`);
            const data = await response.json();
            
            const times = data.hourly.time;
            const temps = data.hourly.temperature_2m;
            const codes = data.hourly.weathercode;
            
            let html = '';
            for (let i = 0; i < 12; i++) {
                const date = new Date(times[i]);
                const hour = date.getHours().toString().padStart(2, '0') + ':00';
                const temp = Math.round(temps[i]);
                const emoji = getWeatherEmoji(codes[i]);
                
                html += `
                    <div class="weather-hour-item">
                        <div class="hour-time">${hour}</div>
                        <div class="hour-emoji">${emoji}</div>
                        <div class="hour-temp">${temp}°</div>
                    </div>
                `;
            }
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<p style="color: var(--color-accent-red); padding: 1rem;">Error al cargar el tiempo.</p>';
            console.error('Error fetching weather:', error);
        }
    }

    function getWeatherEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 48) return '🌫️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        return '⛈️';
    }

    // Event Listeners para las ciudades
    document.getElementById('city-selector').addEventListener('click', (e) => {
        if (e.target.classList.contains('city-btn')) {
            document.querySelectorAll('.city-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            fetchWeather(e.target.dataset.city);
        }
    });

    // ==========================================
    // 5. API NOTICIAS: FAVICONS Y DISEÑO COMPACTO
    // ==========================================
    let rawNews = [];
    let currentLang = 'es';

    async function fetchNews() {
        try {
            const response = await fetch('https://hn.algolia.com/api/v1/search?query=AI+technology&tags=story&hitsPerPage=6');
            const data = await response.json();
            rawNews = data.hits;
            renderNews();
        } catch (error) {
            document.getElementById('news-grid').innerHTML = '<p style="color: var(--color-accent-red);">Error al cargar las noticias.</p>';
            console.error('Error fetching news:', error);
        }
    }

    function getDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'news';
        }
    }

    async function renderNews() {
        const grid = document.getElementById('news-grid');
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Traduciendo noticias...</p>';
        
        const langpair = currentLang === 'es' ? 'en|es' : 'en|ca';
        
        const translatedNews = await Promise.all(rawNews.map(async (hit) => {
            let translatedTitle = hit.title;
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(hit.title)}&langpair=${langpair}`);
                const data = await res.json();
                if (data.responseData && data.responseData.translatedText) {
                    translatedTitle = data.responseData.translatedText;
                }
            } catch (e) { /* Fallback to English */ }
            
            const domain = getDomain(hit.url);
            const faviconUrl = hit.url 
                ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` 
                : 'https://via.placeholder.com/64/1e3a8a/ffffff?text=N';
            
            return { ...hit, translatedTitle, domain, faviconUrl };
        }));
        
        let html = '';
        translatedNews.forEach(item => {
            html += `
                <div class="news-card-pro">
                    <div class="news-source-icon">
                        <img src="${item.faviconUrl}" alt="${item.domain}" onerror="this.src='https://via.placeholder.com/32/1e3a8a/ffffff?text=N'">
                    </div>
                    <div class="news-card-text">
                        <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer">${item.translatedTitle}</a>
                        <div class="news-source-domain">${item.domain}</div>
                        <div class="news-meta-pro">Por ${item.author} • ${item.points || 0} pts</div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    // Eventos para los botones de idioma
    document.getElementById('btn-es').addEventListener('click', () => {
        currentLang = 'es';
        document.getElementById('btn-es').classList.add('active');
        document.getElementById('btn-ca').classList.remove('active');
        renderNews();
    });

    document.getElementById('btn-ca').addEventListener('click', () => {
        currentLang = 'ca';
        document.getElementById('btn-ca').classList.add('active');
        document.getElementById('btn-es').classList.remove('active');
        renderNews();
    });

    // Ejecutamos las funciones al cargar
    fetchWeather('valencia');
    fetchNews();
});