document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // TEMA CLARO / OSCURO
    // ==========================================
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

    function updateThemeIcon() {
        if (!themeIcon) return;
        const theme = html.getAttribute('data-theme');
        themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            updateThemeIcon();
        });
    }

    // ==========================================
    // 1. DESPLAZAMIENTO SUAVE
    // ==========================================
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

    // ==========================================
    // 2. NAVBAR AL HACER SCROLL
    // ==========================================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // ==========================================
    // 3. ANIMACIÓN DE APARICIÓN
    // ==========================================
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
            
            let htmlWeather = '';
            for (let i = 0; i < 12; i++) {
                const date = new Date(times[i]);
                const hour = date.getHours().toString().padStart(2, '0') + ':00';
                const temp = Math.round(temps[i]);
                const emoji = getWeatherEmoji(codes[i]);
                
                htmlWeather += `
                    <div class="weather-hour-item">
                        <div class="hour-time">${hour}</div>
                        <div class="hour-emoji">${emoji}</div>
                        <div class="hour-temp">${temp}°</div>
                    </div>
                `;
            }
            container.innerHTML = htmlWeather;
        } catch (error) {
            container.innerHTML = '<p style="color: var(--danger); padding: 1rem;">Error al cargar el tiempo.</p>';
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

    document.getElementById('city-selector').addEventListener('click', (e) => {
        if (e.target.classList.contains('city-btn')) {
            document.querySelectorAll('.city-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            fetchWeather(e.target.dataset.city);
        }
    });

    // ==========================================
    // 5. API NOTICIAS
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
            document.getElementById('news-grid').innerHTML = '<p style="color: var(--danger);">Error al cargar las noticias.</p>';
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
                ? `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=64` 
                : 'https://via.placeholder.com/64/1e3a8a/ffffff?text=N';
            
            return { ...hit, translatedTitle, domain, faviconUrl };
        }));
        
        let htmlNews = '';
        translatedNews.forEach(item => {
            htmlNews += `
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
        grid.innerHTML = htmlNews;
    }

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

    // ==========================================
    // 6. CHATBOT LOCAL
    // ==========================================
    initChatbot();

    function initChatbot() {
        const widget = document.getElementById('chatbot-widget');
        const launcher = document.getElementById('chatbot-launcher');
        const panel = document.getElementById('chatbot-panel');
        const closeBtn = document.getElementById('chatbot-close');
        const form = document.getElementById('chatbot-form');
        const input = document.getElementById('chatbot-input');
        const messages = document.getElementById('chatbot-messages');
        const suggestions = document.getElementById('chatbot-suggestions');

        if (!widget || !launcher || !panel || !form || !input || !messages || !suggestions) return;

        const quickReplies = [
            'Sobre mí',
            'Experiencia',
            'Gustos',
            'Contacto',
            'Comparar rama',
            'Ayuda'
        ];

        function normalize(text) {
            return text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function escapeHtml(text) {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function addMessage(role, text, useHtml = false) {
            const wrap = document.createElement('div');
            wrap.className = `chat-message ${role}`;

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';

            if (useHtml) {
                bubble.innerHTML = text;
            } else {
                bubble.textContent = text;
            }

            wrap.appendChild(bubble);
            messages.appendChild(wrap);
            messages.scrollTop = messages.scrollHeight;
        }

        function showTyping() {
            const wrap = document.createElement('div');
            wrap.className = 'chat-message assistant';
            wrap.id = 'typing-message';

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble typing-indicator';
            bubble.innerHTML = '<span></span><span></span><span></span>';

            wrap.appendChild(bubble);
            messages.appendChild(wrap);
            messages.scrollTop = messages.scrollHeight;
        }

        function removeTyping() {
            const typing = document.getElementById('typing-message');
            if (typing) typing.remove();
        }

        function getBotResponse(message) {
            const text = normalize(message);

            if (text.includes('hola') || text.includes('buenas') || text.includes('hey') || text.includes('que tal')) {
                return '¡Hola! 👋 Soy el asistente de esta web. Puedes preguntarme por <strong>sobre mí</strong>, <strong>experiencia</strong>, <strong>gustos</strong>, <strong>contacto</strong> o <strong>comparar rama</strong>.';
            }

            if (text.includes('quien eres') || text.includes('que eres') || text.includes('tu eres') || text.includes('tu eres') || text.includes('chatbot') || text.includes('bot')) {
                return 'Soy <strong>JuanManuelBot</strong>, un chatbot local creado para esta web. Respondo preguntas sobre el proyecto, la experiencia y cómo comparar esta versión moderna con la original.';
            }

            if (text.includes('sobre mi') || text.includes('sobre ti') || text.includes('tudó') || text.includes('tudo') || text.includes('juan manuel') || text.includes('dam') || text.includes('simarro') || text.includes('estudiante')) {
                return 'Soy estudiante de <strong>1º de DAM</strong> en el <strong>IES Simarro</strong>. Tengo <strong>26 años de experiencia</strong> en el sector informático y ahora estoy dando un nuevo giro a mi carrera hacia el desarrollo de aplicaciones.';
            }

            if (text.includes('experiencia') || text.includes('epson') || text.includes('hp') || text.includes('lenovo') || text.includes('trabajo') || text.includes('laboral') || text.includes('he hecho')) {
                return 'Mi experiencia incluye soporte técnico y labores informáticas en empresas como <strong>Epson</strong>, <strong>HP</strong> y <strong>Lenovo</strong>. También tengo formación técnica en aire acondicionado y mantenimiento industrial.';
            }

            if (text.includes('gustos') || text.includes('me gusta') || text.includes('playa') || text.includes('mascotas') || text.includes('perros') || text.includes('gatos') || text.includes('series') || text.includes('autocaravana')) {
                return 'Me gusta la naturaleza, pasear por la playa, cuidar de mis mascotas, ver series de policías con humor y viajar en autocaravana.';
            }

            if (text.includes('contacto') || text.includes('email') || text.includes('correo') || text.includes('linkedin') || text.includes('github') || text.includes('hablar')) {
                return 'Puedes contactarme por correo: <strong>juatudfer@alu.edu.gva.es</strong>. También tienes mis enlaces a GitHub y LinkedIn en el pie de página.';
            }

            if (text.includes('tiempo') || text.includes('weather') || text.includes('clima') || text.includes('ciudad')) {
                return 'La web muestra una previsión meteorológica de 12 horas usando una API. Puedes elegir entre Valencia, Alzira, Xàtiva, Carcagente, Madrid, Barcelona y Albacete.';
            }

            if (text.includes('noticias') || text.includes('news') || text.includes('ia') || text.includes('tech')) {
                return 'La sección de noticias carga actualidad tech e IA desde una API y permite cambiar entre español y catalán.';
            }

            if (text.includes('comparar') || text.includes('rama') || text.includes('git') || text.includes('version') || text.includes('original') || text.includes('profe') || text.includes('profesor')) {
                return `
                    <strong>Comparación con la versión original</strong><br><br>
                    Para comparar sin romper la web principal:<br>
                    1. Crea una rama nueva, por ejemplo <code>web-moderna</code>.<br>
                    2. Copia aquí los archivos modernos.<br>
                    3. Haz <code>git add .</code>, <code>git commit</code> y <code>git push</code>.<br>
                    4. En GitHub usa <strong>Compare</strong> o abre los commits para ver diferencias.<br><br>
                    Así la versión original queda intacta en <code>main</code>.
                `;
            }

            if (text.includes('ayuda') || text.includes('help') || text.includes('opciones') || text.includes('puedes hacer')) {
                return 'Puedo ayudarte con: <strong>Sobre mí</strong>, <strong>Experiencia</strong>, <strong>Gustos</strong>, <strong>Contacto</strong>, <strong>Tiempo</strong>, <strong>Noticias</strong> o <strong>Comparar rama</strong>.';
            }

            if (text.includes('gracias')) {
                return '¡De nada! 😊 Si quieres, puedes probar otras preguntas como <strong>experiencia</strong>, <strong>gustos</strong> o <strong>comparar rama</strong>.';
            }

            if (text.includes('web') || text.includes('proyecto') || text.includes('pagina')) {
                return 'Esta es una web personal con secciones de <strong>sobre mí</strong>, <strong>experiencia</strong>, <strong>gustos</strong>, <strong>tiempo</strong>, <strong>noticias</strong> y <strong>contacto</strong>. Esta versión moderna añade tema claro/oscuro y chatbot.';
            }

            return 'No he entendido del todo. Puedes preguntarme por <strong>sobre mí</strong>, <strong>experiencia</strong>, <strong>gustos</strong>, <strong>contacto</strong> o <strong>comparar rama</strong>.';
        }

        function renderSuggestions() {
            suggestions.innerHTML = '';

            quickReplies.forEach(text => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'chatbot-suggestion';
                button.textContent = text;

                button.addEventListener('click', () => {
                    sendMessage(text);
                });

                suggestions.appendChild(button);
            });
        }

        function sendMessage(text) {
            const cleanText = (text || '').trim();
            if (!cleanText) return;

            addMessage('user', cleanText);

            if (input) input.value = '';

            showTyping();

            setTimeout(() => {
                removeTyping();
                const response = getBotResponse(cleanText);
                addMessage('assistant', response, true);
            }, 600);
        }

        launcher.addEventListener('click', () => {
            widget.classList.toggle('open');
            if (input) input.focus();
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                widget.classList.remove('open');
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage(input.value);
        });

        renderSuggestions();

        addMessage(
            'assistant',
            'Hola 👋 Soy el asistente de esta web. Puedo contarte sobre mí, la experiencia, los gustos, el contacto o cómo comparar esta versión moderna con la original.',
            true
        );
    }
});