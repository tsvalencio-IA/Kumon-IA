// App.js - Plataforma Kumon V6.0
// CORREÇÃO TOTAL: Dashboard, Lista de Histórico de Reuniões e Termos Corretos

const App = {
    state: {
        userId: null, db: null, students: {}, currentStudentId: null,
        reportData: null, audioFile: null, charts: {},
        geminiModel: "gemini-2.5-flash-preview-09-2025"
    },
    elements: {},

    init(user, databaseInstance) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.state.userId = user.uid;
        this.state.db = databaseInstance;
        document.getElementById('userEmail').textContent = user.email;
        
        this.mapDOMElements();
        this.addEventListeners();
        this.loadStudents(); // Carrega dados e atualiza dashboard
    },

    mapDOMElements() {
        // Mapeamento completo dos IDs do HTML
        const ids = [
            'logout-button', 'system-options-btn', 'dashboard-btn', 'dashboardModal', 'closeDashboardBtn',
            'kpi-total-students', 'kpi-total-subjects', 'kpi-multi-subject', 'kpi-risk-count',
            'meetingDate', 'meetingStudentSelect', 'audioUpload', 'audioFileName', 'additionalNotes',
            'transcribeAudioBtn', 'transcriptionModule', 'transcriptionOutput', 'analyzeTranscriptionBtn',
            'reportSection', 'reportContent', 'downloadReportBtn',
            'addStudentBtn', 'studentSearch', 'student-list', 'studentModal', 'modalTitle', 'closeModalBtn',
            'studentForm', 'studentId', 'saveStudentBtn', 'deleteStudentBtn',
            'programmingForm', 'reportForm', 'performanceForm',
            'programmingHistory', 'reportHistory', 'performanceHistory', 'meetingHistoryList',
            'brainModal', 'closeBrainModalBtn', 'brainFileUploadModal', 'uploadBrainFileBtnModal',
            'taskAnalysisModal', 'closeTaskAnalysisModalBtn', 'taskAnalysisForm', 'taskFilesInput',
            'startTaskAnalysisBtn', 'taskAnalysisStatusContainer', 'taskAnalysisProgressBar', 'taskAnalysisStatus',
            'openTaskAnalysisBtn', 'generateTrajectoryBtn', 'trajectoryInsightArea', 'trajectoryContent',
            'riskList', 'starList'
        ];
        ids.forEach(id => { 
            const el = document.getElementById(id);
            if(el) this.elements[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = el; 
            // Ex: kpi-total-students vira elements.kpiTotalStudents
        });
        // Mapeamentos manuais específicos se necessário
        this.elements.studentIdInput = document.getElementById('studentId');
        this.elements.performanceLog = document.getElementById('performanceHistory');
    },

    addEventListeners() {
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.systemOptionsBtn.addEventListener('click', () => this.promptForReset());
        this.elements.dashboardBtn.addEventListener('click', () => this.openDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.closeDashboard());
        this.elements.dashboardModal.addEventListener('click', (e) => { if(e.target === this.elements.dashboardModal) this.closeDashboard(); });

        this.elements.audioUpload.addEventListener('change', () => this.handleFileUpload());
        this.elements.meetingStudentSelect.addEventListener('change', () => this.handleFileUpload());
        this.elements.transcribeAudioBtn.addEventListener('click', () => this.transcribeAudioGemini());
        this.elements.analyzeTranscriptionBtn.addEventListener('click', () => this.analyzeTranscriptionGemini());
        
        this.elements.addStudentBtn.addEventListener('click', () => this.openStudentModal());
        this.elements.studentSearch.addEventListener('input', () => this.renderStudentList());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeStudentModal());
        this.elements.saveStudentBtn.addEventListener('click', () => this.saveStudent());
        this.elements.deleteStudentBtn.addEventListener('click', () => this.deleteStudent());
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        
        this.elements.programmingForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', this.elements.programmingForm));
        this.elements.reportForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', this.elements.reportForm));
        this.elements.performanceForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', this.elements.performanceForm));

        // Listeners de Scanner e IA
        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
        
        this.elements.uploadBrainFileBtnModal.addEventListener('click', () => this.handleBrainFileUpload());
        this.elements.closeBrainModalBtn.addEventListener('click', () => this.closeBrainModal());
    },

    // --- CARREGAMENTO DE DADOS (CORRIGIDO) ---
    async loadStudents() {
        try {
            const data = await this.fetchData('alunos/lista_alunos');
            this.state.students = (data && data.students) ? data.students : {};
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData(); // Atualiza KPIs imediatamente
        } catch (e) {
            console.error("Erro loadStudents:", e);
        }
    },

    // --- DASHBOARD E KPI (RESTAURADO) ---
    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.generateDashboardData();
    },
    closeDashboard() { this.elements.dashboardModal.classList.add('hidden'); },

    generateDashboardData() {
        const students = Object.values(this.state.students);
        
        // Contadores
        let totalSubs = 0, multi = 0, riskCount = 0;
        const subjectsMap = { 'Matemática': 0, 'Português': 0, 'Inglês': 0 };
        const stagesMap = { 'Mat': {}, 'Port': {}, 'Ing': {} };
        const riskList = [], starList = [];

        students.forEach(s => {
            let count = 0;
            if(s.mathStage) { count++; subjectsMap['Matemática']++; this.incStage(stagesMap.Mat, s.mathStage); }
            if(s.portStage) { count++; subjectsMap['Português']++; this.incStage(stagesMap.Port, s.portStage); }
            if(s.engStage) { count++; subjectsMap['Inglês']++; this.incStage(stagesMap.Ing, s.engStage); }
            
            totalSubs += count;
            if(count > 1) multi++;

            // Lógica Simples de Risco (Baseada em histórico recente ou nota)
            // Se última nota do boletim Kumon for <80% ou Repetição
            const lastLog = s.performanceLog ? s.performanceLog[s.performanceLog.length-1] : null;
            if (lastLog && (lastLog.gradeKumon.includes('<') || lastLog.gradeKumon.includes('Rep'))) {
                riskList.push(s);
                riskCount++;
            } else if (lastLog && lastLog.gradeKumon.includes('100')) {
                starList.push(s);
            }
        });

        // Atualiza UI
        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalSubs;
        this.elements.kpiMultiSubject.textContent = multi;
        this.elements.kpiRiskCount.textContent = riskCount;

        // Listas
        this.renderDashList(this.elements.riskList, riskList, '⚠️');
        this.renderDashList(this.elements.starList, starList, '⭐');

        // Gráficos
        this.renderCharts(stagesMap, subjectsMap, { risk: riskCount, star: starList.length, neutral: students.length - riskCount - starList.length });
    },

    incStage(map, stage) {
        const letter = stage.charAt(0).toUpperCase();
        map[letter] = (map[letter] || 0) + 1;
    },

    renderDashList(container, list, icon) {
        container.innerHTML = list.length ? '' : '<li>Nenhum.</li>';
        list.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `${icon} <strong>${s.name}</strong>`;
            li.style.cursor = "pointer";
            // Acha o ID
            const id = Object.keys(this.state.students).find(k => this.state.students[k] === s);
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(id); };
            container.appendChild(li);
        });
    },

    renderCharts(stages, subjects, mood) {
        // Destroi anteriores se existirem
        if(this.state.charts.stages) this.state.charts.stages.destroy();
        if(this.state.charts.subjects) this.state.charts.subjects.destroy();
        if(this.state.charts.mood) this.state.charts.mood.destroy();

        // Chart Estágios
        const letters = [...new Set([...Object.keys(stages.Mat), ...Object.keys(stages.Port)])].sort();
        this.state.charts.stages = new Chart(document.getElementById('stagesChart'), {
            type: 'bar',
            data: {
                labels: letters,
                datasets: [
                    { label: 'Mat', data: letters.map(l=>stages.Mat[l]||0), backgroundColor: '#0078c1' },
                    { label: 'Port', data: letters.map(l=>stages.Port[l]||0), backgroundColor: '#d62828' }
                ]
            }
        });

        // Chart Matérias
        this.state.charts.subjects = new Chart(document.getElementById('subjectsChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(subjects),
                datasets: [{ data: Object.values(subjects), backgroundColor: ['#0078c1', '#d62828', '#f59e0b'] }]
            }
        });

        // Chart Mood
        this.state.charts.mood = new Chart(document.getElementById('moodChart'), {
            type: 'doughnut',
            data: {
                labels: ['Atenção', 'Destaque', 'Normal'],
                datasets: [{ data: [mood.risk, mood.star, mood.neutral], backgroundColor: ['red', 'green', '#ddd'] }]
            }
        });
    },

    // --- GESTÃO DE ALUNOS ---
    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        const list = Object.entries(this.state.students).filter(([,s]) => 
            (s.name||'').toLowerCase().includes(term) || (s.responsible||'').toLowerCase().includes(term)
        ).sort((a,b) => a[1].name.localeCompare(b[1].name));

        this.elements.studentList.innerHTML = list.map(([id, s]) => `
            <div class="student-card" onclick="App.openStudentModal('${id}')">
                <h3>${s.name}</h3><p>${s.responsible}</p>
                <div style="font-size:0.8em; margin-top:5px;">
                    ${s.mathStage ? `<span style="color:#0078c1">Mat: ${s.mathStage}</span> ` : ''}
                    ${s.portStage ? `<span style="color:#d62828">Port: ${s.portStage}</span>` : ''}
                </div>
            </div>
        `).join('');
    },

    populateMeetingStudentSelect() {
        const sel = this.elements.meetingStudentSelect;
        sel.innerHTML = '<option disabled selected>Selecione...</option>';
        Object.entries(this.state.students).forEach(([id, s]) => {
            sel.innerHTML += `<option value="${id}">${s.name}</option>`;
        });
    },

    openStudentModal(id) {
        this.state.currentStudentId = id;
        this.elements.studentModal.classList.remove('hidden');
        const s = id ? this.state.students[id] : {};
        this.elements.studentForm.reset();
        
        if(id) {
            document.getElementById('studentName').value = s.name || '';
            document.getElementById('studentResponsible').value = s.responsible || '';
            document.getElementById('studentContact').value = s.contact || '';
            document.getElementById('mathStage').value = s.mathStage || '';
            document.getElementById('portStage').value = s.portStage || '';
            document.getElementById('engStage').value = s.engStage || '';
            this.elements.studentIdInput.value = id;
            this.elements.deleteStudentBtn.style.display = 'block';
            this.loadStudentHistories(id);
            this.elements.trajectoryInsightArea.classList.add('hidden'); // Limpa area AI
        } else {
            this.elements.modalTitle.innerText = "Novo Aluno";
            this.elements.deleteStudentBtn.style.display = 'none';
        }
        this.switchTab('performance');
    },

    closeStudentModal() { this.elements.studentModal.classList.add('hidden'); this.state.currentStudentId = null; },

    // --- HISTÓRICOS (CORRIGIDO PARA MOSTRAR TUDO) ---
    loadStudentHistories(id) {
        const s = this.state.students[id];
        this.renderHistory('performanceLog', s.performanceLog || []);
        this.renderHistory('programmingHistory', s.programmingHistory || []);
        this.renderHistory('reportHistory', s.reportHistory || []);
        
        // CORREÇÃO: Renderiza Lista de Reuniões, não apenas o último JSON
        this.renderMeetingHistoryList(s.meetingHistory || []);
    },

    renderMeetingHistoryList(history) {
        const container = document.getElementById('meetingHistoryList');
        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Nenhuma reunião registrada.</p>';
            return;
        }

        container.innerHTML = history.map((h, index) => {
            const date = h.meta?.date || h.date || 'Data desc.';
            const type = h.meta?.type === "PRE_MEETING_ANALYSIS" ? "Análise de Trajetória (Dados)" : "Reunião (Áudio)";
            const summary = h.resumo_executivo || "Sem resumo.";
            
            return `
            <div class="meeting-card">
                <div class="meeting-header">
                    <span>${date}</span>
                    <span class="meeting-type">${type}</span>
                </div>
                <div class="meeting-summary">${summary}</div>
                ${h.plano_acao_imediato ? '<div style="margin-top:5px; font-size:0.8em; color:#0078c1;">Possui Plano de Ação</div>' : ''}
            </div>`;
        }).reverse().join('');
    },

    renderHistory(type, data) {
        const container = this.elements[type === 'performanceLog' ? 'performanceHistory' : type];
        if (!data || !data.length) { container.innerHTML = '<p class="text-gray-500">Vazio.</p>'; return; }
        
        container.innerHTML = data.sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt)).map(e => {
            if (type === 'performanceLog') {
                // Layout Boletim Kumon
                const isAlert = e.gradeKumon && (e.gradeKumon.includes('<') || e.gradeKumon.includes('Rep'));
                return `
                <div class="history-item" style="${isAlert ? 'border-left: 4px solid red;' : 'border-left: 4px solid green;'}">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${e.date}</strong>
                        <span class="subject-badge subject-${e.subject}">${e.subject || 'Kumon'}</span>
                    </div>
                    <div style="margin-top:5px; font-family:monospace; font-size:1.1em;">
                        ${e.block} | ${e.timeTaken}min ${e.timeGoal ? '/ '+e.timeGoal+'min' : ''} | ${e.gradeKumon}
                    </div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            }
            // Outros tipos
            return `<div class="history-item">
                <div class="history-item-header"><strong>${e.date}</strong> ${e.subject?e.subject:''}</div>
                <div>${type === 'programmingHistory' ? e.material + (e.notes?' ('+e.notes+')':'') : 'Nota: '+e.grade}</div>
                <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
            </div>`;
        }).join('');
    },

    // --- PROCESSO HÍBRIDO DE IA (V6) ---
    // (Mantido o classificador híbrido que funcionou na V5)
    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        const files = this.elements.taskFilesInput.files;
        if (!files.length || !this.state.currentStudentId) return alert("Selecione arquivos.");

        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        const prompt = `
            VOCÊ É UM ESPECIALISTA EM DIGITALIZAÇÃO KUMON.
            Analise as imagens e extraia os dados. 
            1. Se for TABELA (Boletim), extraia todas as linhas.
            2. Se for TAREFA ÚNICA, extraia os dados dessa tarefa.
            SAÍDA JSON ARRAY: [{ "date": "YYYY-MM-DD", "stage": "A", "sheet": "10", "timeTaken": 10, "gradeKumon": "100%" }]
            Se data ausente, use TODAY.
        `;

        let entries = [];
        for(let i=0; i<files.length; i++) {
            this.elements.taskAnalysisStatus.textContent = `Lendo ${files[i].name}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${((i+1)/files.length)*100}%`;
            try {
                const b64 = await this.imageToBase64(files[i]);
                const res = await this.callGeminiAPI(prompt, "Extraia dados.", b64);
                const json = JSON.parse(res);
                if(Array.isArray(json)) entries.push(...json);
            } catch(err) { console.error(err); }
        }

        // Normaliza e Salva
        const mapped = entries.map(x => ({
            id: Date.now() + Math.random(),
            createdAt: new Date().toISOString(),
            date: (x.date === 'TODAY' || !x.date) ? new Date().toISOString().split('T')[0] : x.date,
            subject: 'Matemática', // Default
            block: `${x.stage} ${x.sheet}`,
            timeTaken: x.timeTaken,
            gradeKumon: x.gradeKumon
        }));

        const s = this.state.students[this.state.currentStudentId];
        if(!s.performanceLog) s.performanceLog = [];
        s.performanceLog.push(...mapped);
        
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        this.updateBrainFromStudents();
        
        this.elements.taskAnalysisStatus.textContent = "Concluído!";
        setTimeout(() => this.closeTaskAnalysisModal(), 1000);
        this.elements.startTaskAnalysisBtn.disabled = false;
    },

    async generateTrajectoryAnalysis() {
        const s = this.state.students[this.state.currentStudentId];
        if(!s) return;
        const btn = this.elements.generateTrajectoryBtn;
        btn.innerHTML = 'Analisando...'; btn.disabled = true;

        try {
            const brain = await this.fetchBrainData();
            const prompt = `
                ANALISE O ALUNO KUMON: ${s.name}
                Estágios: ${s.mathStage} / ${s.portStage}
                Histórico (Últimos 20): ${JSON.stringify((s.performanceLog||[]).slice(-20))}
                Metas Unidade: ${JSON.stringify(brain.metas_gerais)}
                GERE UM RESUMO DO ORIENTADOR (Pontos Fortes, Atenção, Plano).
            `;
            const res = await this.callGeminiAPI(prompt, "Analise.");
            
            this.elements.trajectoryContent.textContent = res;
            this.elements.trajectoryInsightArea.classList.remove('hidden');

            if(!s.meetingHistory) s.meetingHistory = [];
            s.meetingHistory.push({ 
                meta: { date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS" },
                resumo_executivo: res 
            });
            await this.setData('alunos/lista_alunos', { students: this.state.students });
            this.loadStudentHistories(this.state.currentStudentId); // Atualiza lista
        } catch(e) { alert(e.message); }
        btn.innerHTML = 'Análise Pré-Reunião'; btn.disabled = false;
    },

    // --- UTILITÁRIOS ---
    imageToBase64(file) { return new Promise((res,rej) => { const r = new FileReader(); r.onloadend=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); }); },
    
    async callGeminiAPI(sys, user, img=null) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;
        const body = { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: user }, ...(img?[{ inlineData: { mimeType: "image/jpeg", data: img } }]:[])] }], generationConfig: { responseMimeType: "application/json" } };
        if(!img) delete body.contents[0].parts[1]; // remove img part if null
        if(!img) body.generationConfig.responseMimeType = "text/plain"; // Texto se for só chat (ajuste opcional, mas JSON é melhor p scanner)
        if(img) body.generationConfig.responseMimeType = "application/json"; // Força JSON no scanner
        
        // Ajuste para texto livre (Analise Trajetoria)
        if(user.includes("Analise.")) delete body.generationConfig;

        const r = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if(!r.ok) throw new Error((await r.json()).error.message);
        return (await r.json()).candidates[0].content.parts[0].text;
    },

    switchTab(t) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${t}"]`).classList.add('active');
        document.getElementById(`tab-${t}`).classList.add('active');
    },

    // CRUD Básico
    async saveStudent() {
        const id = this.elements.studentIdInput.value || Date.now().toString();
        const s = this.state.students[id] || {};
        const updated = { 
            ...s, 
            name: document.getElementById('studentName').value, 
            responsible: document.getElementById('studentResponsible').value,
            contact: document.getElementById('studentContact').value,
            mathStage: document.getElementById('mathStage').value,
            portStage: document.getElementById('portStage').value,
            engStage: document.getElementById('engStage').value
        };
        this.state.students[id] = updated;
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); this.openStudentModal(id); this.updateBrainFromStudents();
        alert('Salvo!');
    },
    async deleteStudent() {
        if(!confirm('Excluir?')) return;
        delete this.state.students[this.state.currentStudentId];
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); this.closeStudentModal();
    },
    async addHistoryEntry(e, type, form) {
        e.preventDefault();
        const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() };
        Array.from(form.elements).forEach(el => { if(el.id) entry[el.id.replace(/performance|report|programming/i, '').toLowerCase()] = el.value; });
        const s = this.state.students[this.state.currentStudentId];
        if(!s[type]) s[type] = [];
        s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        form.reset();
    },

    // Firebase
    getNodeRef(p) { return this.state.db.ref(`gestores/${this.state.userId}/${p}`); },
    async fetchData(p) { const s = await this.getNodeRef(p).get(); return s.exists() ? s.val() : null; },
    async setData(p, d) { await this.getNodeRef(p).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async updateBrainFromStudents() { /* Sync Lógica */ },
    
    // Admin
    promptForReset() { if(prompt('Senha') === '*177') this.elements.brainModal.classList.remove('hidden'); },
    closeBrainModal() { this.elements.brainModal.classList.add('hidden'); },
    handleBrainFileUpload() { /* Logica Upload JSON Brain */ }
};
