const projectData = {
    webshame: {
        icon: "🔑", title: "WebShame", badge: "LIVE", isLive: true,
        desc: "Wall of shame for leaked secrets pushed to public GitHub repos. Free API keys anyone?",
        features: ["Real-time GitHub scanner", "Leaderboard tracking", "Displays all leaked repositories"],
        url: "https://x3r0day.me/WebShame/"
    },
    sniffer: {
        icon: "🕷️", title: "API Sniffer", badge: "STABLE", isLive: false, hasDownload: false,
        desc: "Multi-threaded GitHub secret scanner. Catches credentials before adversaries do.",
        features: ["Regex heuristic scanning for 60+ key types", "GitHub Enterprise support", "Low false-positive via entropy analysis"],
        githubUrl: "https://github.com/X3r0Day/XeroDay-APISniffer"
    },
    hashlock: {
        icon: "🔐", title: "HashLock", badge: "STABLE", isLive: false, hasDownload: true,
        desc: "Military-grade offline password manager. Zero trust, zero cloud syncing.",
        features: ["Fernet cryptographic encryption", "Zero network requests made", "Portable encrypted vault file"],
        githubUrl: "https://github.com/X3r0Day/HashLock"
    },
    specter: {
        icon: "⚡", title: "Specter", badge: "BETA", isLive: false, hasDownload: false,
        desc: "Blazing fast async subdomain enum & port scanner. Maps infrastructure in seconds.",
        features: ["Asyncio TCP port scanning", "Wordlist subdomain bruteforce", "JSON, CSV, HTML export"],
        install: "> pipx install git+https://github.com/x3r0day/x3r0day-specter.git\n> yay -S specter",
        githubUrl: "https://github.com/X3r0Day/X3r0Day-Specter"
    },
    infodisc: {
        icon: "🗄️", title: "InfoDisclosure", badge: "STABLE", isLive: false, hasDownload: false,
        desc: "Automated Wayback Machine scraper. Hunts down forgotten .env and .bak files.",
        features: ["Direct Wayback CDX API integration", "Pattern matching for sensitive extensions", "Custom keywords support"],
        githubUrl: "https://github.com/X3r0Day/InformationDisclosure"
    }
};


function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('clock').innerText = hours + ':' + minutes + ' ' + ampm;
}

const writeupsData = [
    "Hermes Agent Unauth RCE.md",
    "FSMonitor LRCE.md",
    "Bun File Traversal.md"
];


let highestZ = 100;

function focusWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        highestZ++;
        win.style.zIndex = highestZ;

        // Update title bar colors
        document.querySelectorAll('.title-bar').forEach(tb => tb.classList.add('inactive'));
        win.querySelector('.title-bar').classList.remove('inactive');

        // Update taskbar
        document.querySelectorAll('.task-tab').forEach(tb => tb.classList.remove('active'));
        const tab = document.getElementById('tab-' + id);
        if (tab) tab.classList.add('active');
    }
}

function openApp(id) {
    const win = document.getElementById(id);
    const tab = document.getElementById('tab-' + id);
    if (win) {
        win.style.display = 'flex';
        focusWindow(id);
    }
    if (tab) tab.style.display = 'flex';
}

function closeApp(id) {
    const win = document.getElementById(id);
    const tab = document.getElementById('tab-' + id);
    if (win) win.style.display = 'none';
    if (tab) tab.style.display = 'none';
}

function minimizeApp(id) {
    const win = document.getElementById(id);
    const tab = document.getElementById('tab-' + id);
    if (win) win.style.display = 'none';
    if (tab) tab.classList.remove('active');
}

function toggleApp(id) {
    const win = document.getElementById(id);
    const tab = document.getElementById('tab-' + id);
    if (win.style.display === 'none') {
        openApp(id);
    } else {
        if (win.style.zIndex == highestZ) {
            minimizeApp(id);
        } else {
            focusWindow(id);
        }
    }
}

function maximize(id, btnElement) {
    const win = document.getElementById(id);
    if (win.dataset.maximized === 'true') {
        win.style.width = win.dataset.origW;
        win.style.height = win.dataset.origH;
        win.style.top = win.dataset.origT;
        win.style.left = win.dataset.origL;
        win.dataset.maximized = 'false';
        if (btnElement) btnElement.innerText = '◻';
    } else {
        win.dataset.origW = win.style.width || getComputedStyle(win).width;
        win.dataset.origH = win.style.height || getComputedStyle(win).height;
        win.dataset.origT = win.style.top || getComputedStyle(win).top;
        win.dataset.origL = win.style.left || getComputedStyle(win).left;

    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 35px)';
    win.style.top = '0';
    win.style.left = '0';
        win.dataset.maximized = 'true';
        if (btnElement) btnElement.innerText = '❐';
    }
}

function dragWindow(e, id) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.title-controls')) return;
    focusWindow(id);

    const win = document.getElementById(id);
    if (win.dataset.maximized === 'true') return; // Cannot drag maximized window

    let shiftX = e.clientX - win.getBoundingClientRect().left;
    let shiftY = e.clientY - win.getBoundingClientRect().top;

    function moveAt(pageX, pageY) {
        win.style.left = pageX - shiftX + 'px';
        win.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(e) { moveAt(e.pageX, e.pageY); }
    document.addEventListener('mousemove', onMouseMove);

    document.onmouseup = function () {
        document.removeEventListener('mousemove', onMouseMove);
        document.onmouseup = null;
    };
}

function populateWriteups() {
    const listContainer = document.getElementById('writeups-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (writeupsData.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px;">No writeups found.</div>';
        return;
    }

    writeupsData.forEach(file => {
        const item = document.createElement('div');
        item.className = 'icon-item app-icon';
        
        item.innerHTML = `
            <span class="emoji-icon">📄</span>
            <span class="label" style="word-break: break-all;">${file}</span>
        `;
        
        item.addEventListener('click', () => {
            // Deselect others in writeups
            document.querySelectorAll('#writeups-list .app-icon').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });

        item.addEventListener('dblclick', () => openNotepad(file));
        
        listContainer.appendChild(item);
    });
}

async function openNotepad(filename) {
    openApp('win-notepad');
    document.getElementById('notepad-title-bar').innerText = `${filename} - Notepad`;
    document.getElementById('tab-notepad-title').innerText = filename;
    
    const contentDiv = document.getElementById('notepad-content');
    contentDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await fetch(`writeups/${filename}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        contentDiv.innerHTML = marked.parse(text);
    } catch (error) {
        contentDiv.innerHTML = `<p style="color:red; margin-bottom:10px;">Failed to load ${filename}: ${error.message}</p>
        <p><strong>Note:</strong> Browsers block loading local files over <code>file://</code> via fetch due to CORS/security rules.</p>
        <p>To view writeups, please run a local web server in your terminal:</p>
        <div style="background:var(--win-bg); padding:10px; border:2px inset white; font-family:monospace; margin-top:5px; color:black;">
            python3 -m http.server 3000
        </div>
        <p style="margin-top:10px;">Then open <a href="http://localhost:3000" target="_blank" style="color:blue;">http://localhost:3000</a> in your browser.</p>`;
    }
}


document.addEventListener('DOMContentLoaded', () => {

    updateClock();
    setInterval(updateClock, 1000);

    populateWriteups();

    // Win95-style resize grip on every window
    document.querySelectorAll('.window').forEach(win => {
        const grip = document.createElement('div');
        grip.className = 'resize-grip';
        win.appendChild(grip);

        grip.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (win.dataset.maximized === 'true') return;

            const startX = e.clientX, startY = e.clientY;
            const startW = win.offsetWidth, startH = win.offsetHeight;

            function onMove(e) {
                win.style.width = Math.max(220, startW + (e.clientX - startX)) + 'px';
                win.style.height = Math.max(160, startH + (e.clientY - startY)) + 'px';
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });
    
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.app-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });

        icon.addEventListener('dblclick', () => {
            const toolKey = icon.getAttribute('data-tool');
            const data = projectData[toolKey];

            if (data) {
                document.getElementById('det-icon').innerText = data.icon;
                document.getElementById('det-title-bar').innerText = data.title + ".exe";
                document.getElementById('tab-det-icon').innerText = data.icon;
                document.getElementById('tab-det-title').innerText = data.title;

                const content = document.getElementById('det-content');
                content.innerHTML = `
                    <div class="detail-header">
                        <span class="emoji-icon">${data.icon}</span>
                        <div>
                            <h2>${data.title}</h2>
                            <span class="badge ${data.isLive ? '' : 'offline'}">${data.badge}</span>
                        </div>
                    </div>
                    <div class="detail-body">
                        <p>${data.desc}</p>
                        <h3>Features</h3>
                        <ul>
                            ${data.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        ${data.install ? `<h3>Installation</h3><div class="code-box">${data.install.replace(/\n/g,'<br>')}</div>` : ''}
                    </div>
                    <div class="action-btns">
                        ${data.url ? `<a href="${data.url}" target="_blank" class="btn-outset">Launch App</a>` : ''}
                        ${data.hasDownload && data.githubUrl ? `<a href="${data.githubUrl}/releases" target="_blank" class="btn-outset">Download</a>` : ''}
                        ${data.githubUrl ? `<a href="${data.githubUrl}" target="_blank" class="btn-outset">View Source</a>` : ''}
                    </div>
                `;
                openApp('win-details');
            }
        });
    });

    focusWindow('win-main');
    openApp('win-about');

    // AboutMe.exe easter egg: triple-click the badge
    const badge = document.getElementById('about-badge');
    const term = document.getElementById('about-terminal');
    if (badge && term) {
        let taps = 0, tapTimer = null;
        badge.addEventListener('click', () => {
            taps++;
            if (taps === 3) {
                taps = 0;
                term.style.display = 'block';
                term.innerHTML =
                    `C:\\X3r0Day&gt; whoami<br>` +
                    `x3r0day<br><br>` +
                    `C:\\X3r0Day&gt; dir<br>` +
                    ` Volume in drive C is X3R0-OS<br>` +
                    ` Directory of C:\\X3r0Day<br><br>` +
                    `findings   &lt;DIR&gt;   09-08-2026  08:00 PM<br>` +
                    `README.md          1,337  09-08-2026  08:00 PM<br><br>` +
                    `C:\\X3r0Day&gt; cd findings<br><br>` +
                    `C:\\X3r0Day\\findings&gt; dir<br>` +
                    `hermes_unauth_rce.py  bun_path_traversal.py  fsmonitor_lrce.sh<br><br>` +
                    `C:\\X3r0Day\\findings&gt; dir /s secrets.txt<br>` +
                    `File not found - secrets.txt<br>` +
                    `nice try.`;
                badge.innerText = 'UNLOCKED';
                term.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { taps = 0; }, 800);
        });
    }

    document.querySelectorAll('.window').forEach(win => {
        win.addEventListener('mousedown', () => focusWindow(win.id));
    });
});
