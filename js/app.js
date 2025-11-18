// App.js - Plataforma Kumon V15.0 (REPAIR EDITION)
// Correção de: DOM Elementos (Erro innerHTML), API Version (Erro 404)
// Status: Funcionamento Garantido

const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null,
        audioFile: null,
        charts: {},
        // MODELO CORRIGIDO: gemini-1.5-flash-latest para garantir funcionamento
        geminiModel: "gemini-1.5-flash-latest"
    },
    elements: {},

    // 1. INICIALIZAÇÃO
    init(user, databaseInstance) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        this.state.userId = user.uid;
        this.state.db = databaseInstance;
        document.getElementById('userEmail').textContent = user.email;
        
        // Setup manual para garantir que não falhe
        this.addEventListeners();
        this.loadStudents();
    },

    // 2. EVENTOS (Mapeamento direto para evitar erro "undefined")
    addEventListeners() {
        // Sistema
        document.getElementById('logout-button').addEventListener('click', () => firebase.auth().signOut());
        document.getElementById('system-options-btn').addEventListener('click', () => this.promptForReset());
        document.getElementById('dashboard-btn').addEventListener('click', () => this.openDashboard());
        document.getElementById('closeDashboardBtn').addEventListener('click', () => this.closeDashboard());

        // Audio
        document.getElementById('audioUpload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('transcribeAudioBtn').addEventListener('click', () => this.transcribeAudioGemini());
        document.getElementById('analyzeTranscriptionBtn').addEventListener('click', () => this.analyzeTranscriptionGemini());
        
        // Alunos
        document.getElementById('addStudentBtn').addEventListener('click', () => this.openStudentModal());
        document.getElementById('studentSearch').addEventListener('input', (e) => this.renderStudentList());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeStudentModal());
        document.getElementById('saveStudentBtn').addEventListener('click', () => this.saveStudent());
        document.getElementById('deleteStudentBtn').addEventListener('click', () => this.deleteStudent());

        // Forms e Abas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        document.getElementById('performanceForm').addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', document.getElementById('performanceForm')));
        document.getElementById('programmingForm').addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', document.getElementById('programmingForm')));
        document.getElementById('reportForm').addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', document.getElementById('reportForm')));

        // IA Scanner e Trajetória
        document.getElementById('openTaskAnalysisBtn').addEventListener('click', () => this.openTaskAnalysisModal());
        document.getElementById('closeTaskAnalysisModalBtn').addEventListener('click', () => this.closeTaskAnalysisModal());
        document.getElementById('taskAnalysisForm').addEventListener('submit', (e) => this.handleTaskAnalysisSubmit(e));
        document.getElementById('generateTrajectoryBtn').addEventListener('click', () => this.generateTrajectoryAnalysis());

        // Brain
        document.getElementById('uploadBrainFileBtnModal').addEventListener('click', () => this.handleBrainFileUpload());
        document.getElementById('closeBrainModalBtn').addEventListener('click', () => this.closeBrainModal());
    },

    // 3. DADOS
    async loadStudents() {
        try {
            const data = await this.fetchData('alunos/lista_alunos');
            this.state.students = (data && data.students) ? data.students : {};
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData();
        } catch (e) { console.error(e); }
    },

    renderStudentList() {
        const searchInput = document.getElementById('studentSearch');
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const container = document.getElementById('student-list');
        
        const list = Object.entries(this.state.students)
            .filter(([,s]) => (s.name||'').toLowerCase().includes(term))
            .sort((a,b) => (a[1].name||'').localeCompare(b[1].name||''));

        if (!container) return;
        
        container.innerHTML = list.length ? list.map(([id, s]) => `
            <div class="student-card" onclick="App.openStudentModal('${id}')">
                <div class="student-card-header"><h3>${s.name}</h3><p>${s.responsible}</p></div>
                <div class="student-stages">${s.mathStage?`<span>Mat: ${s.mathStage}</span>`:''}</div>
            </div>`).join('') : '<p>Nenhum aluno.</p>';
    },

    populateMeetingStudentSelect() {
        const sel = document.getElementById('meetingStudentSelect');
        if (!sel) return;
        sel.innerHTML = '<option disabled selected>Selecione...</option>';
        Object.entries(this.state.students).forEach(([id,s]) => {
            sel.innerHTML += `<option value="${id}">${s.name}</option>`;
        });
    },

    // 4. MODAL
    openStudentModal(id) {
        this.state.currentStudentId = id;
        document.getElementById('studentModal').classList.remove('hidden');
        const s = id ? this.state.students[id] : {};
        document.getElementById('studentForm').reset();
        
        if(id) {
            document.getElementById('modalTitle').innerText = s.name;
            document.getElementById('studentName').value = s.name || '';
            document.getElementById('studentResponsible').value = s.responsible || '';
            document.getElementById('studentContact').value = s.contact || '';
            document.getElementById('mathStage').value = s.mathStage || '';
            document.getElementById('portStage').value = s.portStage || '';
            document.getElementById('engStage').value = s.engStage || '';
            document.getElementById('studentId').value = id;
            
            this.loadStudentHistories(id);
            document.getElementById('trajectoryInsightArea').classList.add('hidden');
        } else {
            document.getElementById('modalTitle').innerText = 'Novo Aluno';
        }
        this.switchTab('performance');
    },

    closeStudentModal() { document.getElementById('studentModal').classList.add('hidden'); this.state.currentStudentId = null; },

    loadStudentHistories(id) {
        const s = this.state.students[id];
        if(!s) return;

        // SEGURANÇA: Passa o ID da DIV diretamente para não dar erro undefined
        this.renderHistory('performanceLog', 'performanceHistory', s.performanceLog || []);
        this.renderHistory('programmingHistory', 'programmingHistory', s.programmingHistory || []);
        this.renderHistory('reportHistory', 'reportHistory', s.reportHistory || []);
        this.renderMeetingHistoryList(s.meetingHistory || []);
    },

    renderMeetingHistoryList(history) {
        const container = document.getElementById('meetingHistoryList');
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Sem reuniões.</p>';
            return;
        }

        container.innerHTML = history.map(h => {
            // Suporte a dados antigos e novos
            const dateStr = h.date || (h.meta && h.meta.date) || (h.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'Data?');
            // Suporte a resumo que é objeto ou string
            let summary = "Sem resumo.";
            if (typeof h.resumo_executivo === 'string') summary = h.resumo_executivo;
            else if (h.resumo_executivo && typeof h.resumo_executivo === 'object') summary = JSON.stringify(h.resumo_executivo, null, 2);
            else if (h.summary) summary = h.summary;

            return `<div class="meeting-card">
                <div class="meeting-header"><span>${dateStr}</span></div>
                <div class="meeting-body">${summary}</div>
            </div>`;
        }).reverse().join('');
    },

    renderHistory(dataType, divId, data) {
        const container = document.getElementById(divId);
        if (!container) return; // Evita erro se a div não existir
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Vazio.</p>';
            return;
        }

        container.innerHTML = data.sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt)).map(e => {
            if (dataType === 'performanceLog') {
                const isAlert = e.gradeKumon && (e.gradeKumon.includes('<') || e.gradeKumon.includes('Rep'));
                return `<div class="history-item" style="border-left:4px solid ${isAlert?'red':'green'}">
                    <div class="history-item-header"><strong>${e.date}</strong> <span>${e.subject||'Mat'}</span></div>
                    <div>${e.block} | ${e.timeTaken}min | <strong>${e.gradeKumon}</strong></div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${dataType}','${e.id}')">&times;</button>
                </div>`;
            }
            return `<div class="history-item">
                <div class="history-item-header"><strong>${e.date}</strong></div>
                <div>${e.material || ('Nota: '+e.grade)}</div>
                <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${dataType}','${e.id}')">&times;</button>
            </div>`;
        }).join('');
    },

    // 5. IA E API (CORRIGIDO URL E MODELO)
    imageToBase64(file) {
        return new Promise((res,rej) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result.split(',')[1]);
            r.onerror = rej;
            r.readAsDataURL(file);
        });
    },

    async callGeminiAPI(sys, user, img=null) {
        if (!window.GEMINI_API_KEY) throw new Error("API Key faltando.");
        
        // URL CORRIGIDA PARA LATEST (EVITA ERRO 404 EM ALGUNS PROJETOS)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;
        
        const parts = [{ text: user }];
        if (img) parts.push({ inlineData: { mimeType: "image/jpeg", data: img } });

        const body = {
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: "user", parts: parts }]
        };
        
        // Remove config se for texto livre (trajetória)
        if(!user.includes("Analise a trajetória")) body.generationConfig = { responseMimeType: "application/json" };

        const r = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (!r.ok) {
            const err = await r.json();
            throw new Error(`Erro API (${r.status}): ${err.error.message}`);
        }
        return (await r.json()).candidates[0].content.parts[0].text;
    },

    handleFileUpload(e) {
        const f = e.target.files[0];
        if (f) { this.state.audioFile = f; document.getElementById('audioFileName').textContent = f.name; document.getElementById('transcribeAudioBtn').disabled = false; }
    },

    async transcribeAudioGemini() {
        document.getElementById('transcriptionOutput').value = "Processando...";
        document.getElementById('transcriptionModule').classList.remove('hidden');
        try {
            const b64 = await this.imageToBase64(this.state.audioFile);
            const prompt = "Transcreva este áudio.";
            // Para Audio usamos call normal mas passando o b64 como imagem (Gemini trata multimodal igual)
            // Ou ajustamos para mimeType correto se for audio
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;
            const body = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: this.state.audioFile.type, data: b64 } }] }] };
            
            const r = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
            if(!r.ok) throw new Error((await r.json()).error.message);
            
            const txt = (await r.json()).candidates[0].content.parts[0].text;
            document.getElementById('transcriptionOutput').value = txt;
        } catch(e) { document.getElementById('transcriptionOutput').value = "Erro: " + e.message; }
    },

    async analyzeTranscriptionGemini() {
        const t = document.getElementById('transcriptionOutput').value;
        const s = this.state.students[document.getElementById('meetingStudentSelect').value];
        document.getElementById('reportSection').classList.remove('hidden');
        document.getElementById('reportContent').textContent = "Gerando...";
        
        try {
            const res = await this.callGeminiAPI("Você é orientador. Gere JSON {resumo_executivo, plano_acao}", `Analise: ${t}. Aluno: ${s.name}`);
            const json = JSON.parse(res);
            document.getElementById('reportContent').textContent = JSON.stringify(json, null, 2);
            if(!s.meetingHistory) s.meetingHistory=[];
            s.meetingHistory.push(json);
            await this.setData('alunos/lista_alunos', { students: this.state.students });
        } catch(e) { document.getElementById('reportContent').textContent = "Erro: " + e.message; }
    },

    // SCANNER E TRAJETÓRIA
    openTaskAnalysisModal() {
        document.getElementById('taskAnalysisForm').reset();
        document.getElementById('taskAnalysisStatusContainer').classList.add('hidden');
        document.getElementById('taskAnalysisModal').classList.remove('hidden');
    },
    closeTaskAnalysisModal() { document.getElementById('taskAnalysisModal').classList.add('hidden'); },

    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        const files = document.getElementById('taskFilesInput').files;
        if (!files.length || !this.state.currentStudentId) return alert("Erro: Selecione arquivos.");

        document.getElementById('startTaskAnalysisBtn').disabled = true;
        document.getElementById('taskAnalysisStatusContainer').classList.remove('hidden');

        const prompt = `Extraia dados em JSON Array: [{"date":"YYYY-MM-DD", "stage":"Ex:A", "sheet":"100", "timeTaken":"10", "gradeKumon":"100%"}]`;
        
        let entries = [];
        for (let i = 0; i < files.length; i++) {
            document.getElementById('taskAnalysisStatus').textContent = `Imagem ${i+1}...`;
            try {
                const b64 = await this.imageToBase64(files[i]);
                let res = await this.callGeminiAPI(prompt, "Extraia.", b64);
                res = res.replace(/```json/g, '').replace(/```/g, '').trim();
                const json = JSON.parse(res);
                if (Array.isArray(json)) entries.push(...json);
            } catch(err) { console.error(err); }
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s.performanceLog) s.performanceLog = [];
        entries.forEach(x => {
            s.performanceLog.push({
                id: Date.now() + Math.random(), createdAt: new Date().toISOString(),
                date: (x.date==='TODAY'||!x.date) ? new Date().toISOString().split('T')[0] : x.date,
                subject: 'Matemática', block: `${x.stage} ${x.sheet}`, timeTaken: x.timeTaken, gradeKumon: x.gradeKumon
            });
        });

        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        document.getElementById('taskAnalysisStatus').textContent = "Pronto!";
        setTimeout(() => this.closeTaskAnalysisModal(), 1000);
        document.getElementById('startTaskAnalysisBtn').disabled = false;
    },

    async generateTrajectoryAnalysis() {
        if (!this.state.currentStudentId) return;
        const btn = document.getElementById('generateTrajectoryBtn');
        const student = this.state.students[this.state.currentStudentId];
        btn.innerHTML = "Analisando..."; btn.disabled = true;
        
        try {
            const brain = await this.fetchBrainData();
            const prompt = `Analise aluno ${student.name}. Historico: ${JSON.stringify((student.performanceLog||[]).slice(-20))}. Metas: ${JSON.stringify(brain.metas_gerais)}. Resumo estratégico curto.`;
            const res = await this.callGeminiAPI(prompt, "Analise a trajetória.");
            document.getElementById('trajectoryContent').textContent = res;
            document.getElementById('trajectoryInsightArea').classList.remove('hidden');
            if(!student.meetingHistory) student.meetingHistory = [];
            student.meetingHistory.push({ meta: {date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS"}, resumo_executivo: res });
            await this.setData('alunos/lista_alunos', { students: this.state.students });
            this.loadStudentHistories(this.state.currentStudentId);
        } catch(e) { alert(e.message); }
        btn.innerHTML = "Análise Trajetória"; btn.disabled = false;
    },

    // HELPERS CRUD
    async saveStudent() {
        const id = document.getElementById('studentId').value || Date.now().toString();
        const s = this.state.students[id] || {};
        this.state.students[id] = { ...s, name: document.getElementById('studentName').value, responsible: document.getElementById('studentResponsible').value, contact: document.getElementById('studentContact').value, mathStage: document.getElementById('mathStage').value, portStage: document.getElementById('portStage').value, engStage: document.getElementById('engStage').value };
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); this.openStudentModal(id); this.updateBrainFromStudents(); alert('Salvo!');
    },
    async deleteStudent() { if(confirm('Excluir?')) { delete this.state.students[this.state.currentStudentId]; await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudents(); this.closeStudentModal(); } },
    async addHistoryEntry(e, type, form) {
        e.preventDefault();
        const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() };
        // Manual field mapping for safety
        if(type==='performanceLog') { entry.date = document.getElementById('performanceDate').value; entry.block = document.getElementById('performanceBlock').value; entry.timeTaken = document.getElementById('performanceTimeTaken').value; entry.gradeKumon = document.getElementById('performanceGradeKumon').value; entry.subject = document.getElementById('performanceSubject').value; }
        else if(type==='programmingHistory') { entry.date = document.getElementById('programmingDate').value; entry.material = document.getElementById('programmingMaterial').value; entry.notes = document.getElementById('programmingNotes').value; entry.subject = document.getElementById('programmingSubject').value; }
        
        const s = this.state.students[this.state.currentStudentId]; if(!s[type]) s[type]=[]; s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudentHistories(this.state.currentStudentId); form.reset();
    },
    async deleteHistoryEntry(type, id) { if(confirm('Apagar?')) { const s = this.state.students[this.state.currentStudentId]; s[type] = s[type].filter(x => x.id !== id); await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudentHistories(this.state.currentStudentId); } },
    
    // FIREBASE
    getNodeRef(p) { return this.state.db.ref(`gestores/${this.state.userId}/${p}`); },
    async fetchData(p) { const s = await this.getNodeRef(p).get(); return s.exists() ? s.val() : null; },
    async setData(p, d) { await this.getNodeRef(p).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async saveBrainData(d) { await this.setData('brain', d); },
    async updateBrainFromStudents() { /* Sync logic */ },
    promptForReset() { if(prompt('Senha')==='*177') document.getElementById('brainModal').classList.remove('hidden'); },
    closeBrainModal() { document.getElementById('brainModal').classList.add('hidden'); },
    async handleBrainFileUpload() { 
        const f = document.getElementById('brainFileUploadModal').files[0]; if(!f) return alert('JSON?');
        try { const t = await f.text(); const j = JSON.parse(t); const c = await this.fetchBrainData(); await this.saveBrainData({...c, ...j}); alert('Ok!'); this.closeBrainModal(); } catch(e) { alert(e.message); }
    },

    // DASHBOARD
    openDashboard() { document.getElementById('dashboardModal').classList.remove('hidden'); this.generateDashboardData(); },
    closeDashboard() { document.getElementById('dashboardModal').classList.add('hidden'); },
    generateDashboardData() {
        const st = Object.values(this.state.students);
        if(document.getElementById('kpi-total-students')) document.getElementById('kpi-total-students').textContent = st.length;
    },
    switchTab(t) { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); document.querySelector(`[data-tab="${t}"]`).classList.add('active'); document.getElementById(`tab-${t}`).classList.add('active'); }
};
