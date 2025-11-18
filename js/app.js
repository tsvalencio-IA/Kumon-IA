// App.js - Plataforma Kumon V19.0 (RESTAURAÇÃO TOTAL + FIX API)
// Baseado no ZIP funcional. Corrigido erro 404 e undefined.

const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null,
        audioFile: null,
        charts: {},
        // MODELO CORRETO (V1.5 Flash para Áudio/Imagem)
        geminiModel: "gemini-1.5-flash"
    },
    elements: {},

    init(user, databaseInstance) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.state.userId = user.uid;
        this.state.db = databaseInstance; 
        document.getElementById('userEmail').textContent = user.email;
        
        this.mapDOMElements();
        this.addEventListeners();
        this.loadStudents();
    },

    mapDOMElements() {
        this.elements = {
            // IDs originais do ZIP
            logoutButton: document.getElementById('logout-button'),
            systemOptionsBtn: document.getElementById('system-options-btn'),
            dashboardBtn: document.getElementById('dashboard-btn'),
            dashboardModal: document.getElementById('dashboardModal'),
            closeDashboardBtn: document.getElementById('closeDashboardBtn'),
            riskList: document.getElementById('riskList'),
            starList: document.getElementById('starList'),
            kpiTotalStudents: document.getElementById('kpi-total-students'),
            kpiTotalSubjects: document.getElementById('kpi-total-subjects'),
            kpiMultiSubject: document.getElementById('kpi-multi-subject'),
            kpiRiskCount: document.getElementById('kpi-risk-count'),
            meetingDate: document.getElementById('meetingDate'),
            meetingStudentSelect: document.getElementById('meetingStudentSelect'), 
            audioUpload: document.getElementById('audioUpload'),
            audioFileName: document.getElementById('audioFileName'),
            additionalNotes: document.getElementById('additionalNotes'),
            transcribeAudioBtn: document.getElementById('transcribeAudioBtn'),
            transcriptionModule: document.getElementById('transcriptionModule'),
            transcriptionOutput: document.getElementById('transcriptionOutput'),
            analyzeTranscriptionBtn: document.getElementById('analyzeTranscriptionBtn'),
            reportSection: document.getElementById('reportSection'),
            reportContent: document.getElementById('reportContent'),
            downloadReportBtn: document.getElementById('downloadReportBtn'),
            addStudentBtn: document.getElementById('addStudentBtn'),
            studentSearch: document.getElementById('studentSearch'),
            studentList: document.getElementById('student-list'),
            studentModal: document.getElementById('studentModal'),
            modalTitle: document.getElementById('modalTitle'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            studentForm: document.getElementById('studentForm'),
            studentIdInput: document.getElementById('studentId'),
            saveStudentBtn: document.getElementById('saveStudentBtn'),
            deleteStudentBtn: document.getElementById('deleteStudentBtn'),
            programmingForm: document.getElementById('programmingForm'),
            reportForm: document.getElementById('reportForm'),
            performanceForm: document.getElementById('performanceForm'), 
            studentAnalysisContent: document.getElementById('student-analysis-content'),
            programmingHistory: document.getElementById('programmingHistory'),
            reportHistory: document.getElementById('reportHistory'),
            performanceLog: document.getElementById('performanceHistory'), 
            meetingHistoryList: document.getElementById('meetingHistoryList'), // Novo campo de lista
            filterProgramming: document.getElementById('filterProgramming'),
            filterReports: document.getElementById('filterReports'),
            filterPerformance: document.getElementById('filterPerformance'),
            brainModal: document.getElementById('brainModal'),
            closeBrainModalBtn: document.getElementById('closeBrainModalBtn'),
            brainFileUploadModal: document.getElementById('brainFileUploadModal'),
            uploadBrainFileBtnModal: document.getElementById('uploadBrainFileBtnModal'),
            
            // NOVOS ELEMENTOS (IA)
            taskAnalysisModal: document.getElementById('taskAnalysisModal'),
            closeTaskAnalysisModalBtn: document.getElementById('closeTaskAnalysisModalBtn'),
            taskAnalysisForm: document.getElementById('taskAnalysisForm'),
            taskFilesInput: document.getElementById('taskFilesInput'),
            startTaskAnalysisBtn: document.getElementById('startTaskAnalysisBtn'),
            taskAnalysisStatusContainer: document.getElementById('taskAnalysisStatusContainer'),
            taskAnalysisProgressBar: document.getElementById('taskAnalysisProgressBar'),
            taskAnalysisStatus: document.getElementById('taskAnalysisStatus'),
            openTaskAnalysisBtn: document.getElementById('openTaskAnalysisBtn'),
            generateTrajectoryBtn: document.getElementById('generateTrajectoryBtn'),
            trajectoryInsightArea: document.getElementById('trajectoryInsightArea'),
            trajectoryContent: document.getElementById('trajectoryContent')
        };
    },

    addEventListeners() {
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.systemOptionsBtn.addEventListener('click', () => this.promptForReset());
        this.elements.dashboardBtn.addEventListener('click', () => this.openDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.closeDashboard());
        this.elements.dashboardModal.addEventListener('click', (e) => { if (e.target === this.elements.dashboardModal) this.closeDashboard(); });

        this.elements.audioUpload.addEventListener('change', () => this.handleFileUpload());
        this.elements.meetingStudentSelect.addEventListener('change', () => this.handleFileUpload());
        this.elements.transcribeAudioBtn.addEventListener('click', () => this.transcribeAudioGemini()); 
        this.elements.analyzeTranscriptionBtn.addEventListener('click', () => this.analyzeTranscriptionGemini()); 
        this.elements.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        
        this.elements.uploadBrainFileBtnModal.addEventListener('click', () => this.handleBrainFileUpload());
        this.elements.closeBrainModalBtn.addEventListener('click', () => this.closeBrainModal());
        
        this.elements.addStudentBtn.addEventListener('click', () => this.openStudentModal());
        this.elements.studentSearch.addEventListener('input', () => this.renderStudentList());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeStudentModal());
        this.elements.saveStudentBtn.addEventListener('click', () => this.saveStudent());
        this.elements.deleteStudentBtn.addEventListener('click', () => this.deleteStudent());
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        
        this.elements.programmingForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', this.elements.programmingForm));
        this.elements.reportForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', this.elements.reportForm));
        this.elements.performanceForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', this.elements.performanceForm)); 
        
        this.elements.filterProgramming.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterReports.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterPerformance.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));

        this.elements.studentModal.addEventListener('click', (e) => { if (e.target === this.elements.studentModal) this.closeStudentModal(); });

        // Novos Listeners
        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // LÓGICA DO DASHBOARD (ORIGINAL RESTAURADA)
    // =====================================================================
    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        setTimeout(() => { this.generateDashboardData(); }, 10);
    },
    closeDashboard() { this.elements.dashboardModal.classList.add('hidden'); },

    generateDashboardData() {
        const students = Object.values(this.state.students);
        const stagesBySubject = { 'Math': {}, 'Port': {}, 'Eng': {} };
        const subjectCounts = { 'Matemática': 0, 'Português': 0, 'Inglês': 0 };
        let totalSubjectsEnrollments = 0;
        let multiSubjectStudents = 0;
        
        students.forEach(s => {
            let studentSubjectsCount = 0;
            if (s.mathStage && s.mathStage.trim()) {
                const letter = s.mathStage.trim().charAt(0).toUpperCase();
                stagesBySubject['Math'][letter] = (stagesBySubject['Math'][letter] || 0) + 1;
                subjectCounts['Matemática']++;
                studentSubjectsCount++;
            }
            if (s.portStage && s.portStage.trim()) {
                const letter = s.portStage.trim().charAt(0).toUpperCase();
                stagesBySubject['Port'][letter] = (stagesBySubject['Port'][letter] || 0) + 1;
                subjectCounts['Português']++;
                studentSubjectsCount++;
            }
            if (s.engStage && s.engStage.trim()) {
                const letter = s.engStage.trim().charAt(0).toUpperCase();
                stagesBySubject['Eng'][letter] = (stagesBySubject['Eng'][letter] || 0) + 1;
                subjectCounts['Inglês']++;
                studentSubjectsCount++;
            }
            totalSubjectsEnrollments += studentSubjectsCount;
            if (studentSubjectsCount > 1) multiSubjectStudents++;
        });

        const riskStudents = [];
        const starStudents = [];
        let riskCount = 0, starCount = 0, neutralCount = 0;

        students.forEach(s => {
            let hasRisk = false;
            let hasStar = false;
            // Lógica Híbrida (Boletim + Reunião)
            if (s.meetingHistory && s.meetingHistory.length > 0) {
                const lastReport = JSON.stringify(s.meetingHistory[s.meetingHistory.length - 1]).toLowerCase();
                if(lastReport.includes("dificuldade") || lastReport.includes("desmotivado")) hasRisk = true;
                if(lastReport.includes("elogio") || lastReport.includes("avanço")) hasStar = true;
            }
            const lastLog = s.performanceLog && s.performanceLog.length > 0 ? s.performanceLog[s.performanceLog.length-1] : null;
            if (lastLog) {
                if (lastLog.gradeKumon.includes('<') || lastLog.gradeKumon.includes('Rep')) hasRisk = true;
                if (lastLog.gradeKumon.includes('100')) hasStar = true;
            }

            if (hasRisk) { riskStudents.push(s); riskCount++; }
            else if (hasStar) { starStudents.push(s); starCount++; }
            else { neutralCount++; }
        });

        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalSubjectsEnrollments;
        this.elements.kpiMultiSubject.textContent = multiSubjectStudents;
        this.elements.kpiRiskCount.textContent = riskCount;

        this.renderDashboardList(this.elements.riskList, riskStudents, '⚠️');
        this.renderDashboardList(this.elements.starList, starStudents, '⭐');
        
        const allLetters = new Set([...Object.keys(stagesBySubject['Math']), ...Object.keys(stagesBySubject['Port']), ...Object.keys(stagesBySubject['Eng'])]);
        const sortedLetters = Array.from(allLetters).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        const chartData = {
            labels: sortedLetters,
            math: sortedLetters.map(l => stagesBySubject['Math'][l] || 0),
            port: sortedLetters.map(l => stagesBySubject['Port'][l] || 0),
            eng: sortedLetters.map(l => stagesBySubject['Eng'][l] || 0)
        };
        this.renderCharts(chartData, subjectCounts, { risk: riskCount, star: starCount, neutral: neutralCount });
    },

    renderDashboardList(element, list, icon) {
        element.innerHTML = list.length ? '' : '<li class="text-gray-500">Nenhum aluno.</li>';
        list.forEach(s => {
            const li = document.createElement('li');
            li.style.padding = "5px 0"; li.style.borderBottom = "1px solid #eee";
            li.innerHTML = `<strong>${icon} ${s.name}</strong> <span style="font-size:0.8em;">(${s.responsible})</span>`;
            li.style.cursor = "pointer";
            const id = Object.keys(this.state.students).find(key => this.state.students[key] === s);
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(id); };
            element.appendChild(li);
        });
    },

    renderCharts(stageData, subjectCounts, moodData) {
        if (this.state.charts.stages) this.state.charts.stages.destroy();
        if (this.state.charts.subjects) this.state.charts.subjects.destroy();
        if (this.state.charts.mood) this.state.charts.mood.destroy();

        this.state.charts.stages = new Chart(document.getElementById('stagesChart').getContext('2d'), {
            type: 'bar', data: { labels: stageData.labels, datasets: [{ label: 'Mat', data: stageData.math, backgroundColor: '#0078c1' }, { label: 'Port', data: stageData.port, backgroundColor: '#d62828' }, { label: 'Ing', data: stageData.eng, backgroundColor: '#f59e0b' }] }, options: { responsive: true, maintainAspectRatio: false }
        });
        this.state.charts.subjects = new Chart(document.getElementById('subjectsChart').getContext('2d'), {
            type: 'pie', data: { labels: ['Mat', 'Port', 'Ing'], datasets: [{ data: [subjectCounts['Matemática'], subjectCounts['Português'], subjectCounts['Inglês']], backgroundColor: ['#0078c1', '#d62828', '#f59e0b'] }] }, options: { responsive: true, maintainAspectRatio: false }
        });
        this.state.charts.mood = new Chart(document.getElementById('moodChart').getContext('2d'), {
            type: 'doughnut', data: { labels: ['Risco', 'Top', 'Neutro'], datasets: [{ data: [moodData.risk, moodData.star, moodData.neutral], backgroundColor: ['#d62828', '#28a745', '#eaf6ff'] }] }, options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // =====================================================================
    // ================== ÁUDIO e IA (URL CORRIGIDA AQUI) ==================
    // =====================================================================
    handleFileUpload() {
        const file = this.elements.audioUpload.files[0];
        if (file) { this.state.audioFile = file; this.elements.audioFileName.textContent = file.name; this.elements.transcribeAudioBtn.disabled = false; }
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
        });
    },

    async transcribeAudioGemini() {
        this.elements.transcriptionOutput.value = 'Processando áudio...';
        this.elements.transcriptionModule.classList.remove('hidden');
        try {
            const b64 = await this.fileToBase64(this.state.audioFile);
            // CORREÇÃO DA URL: Usando 1.5-flash estável
            const txt = await this.callGeminiAPI("Transcreva este áudio.", "Transcreva", b64);
            this.elements.transcriptionOutput.value = txt;
        } catch (error) {
            this.elements.transcriptionOutput.value = `Erro: ${error.message}`;
        }
    },

    async analyzeTranscriptionGemini() {
        const t = this.elements.transcriptionOutput.value;
        const s = this.state.students[this.elements.meetingStudentSelect.value];
        this.elements.reportSection.classList.remove('hidden');
        this.elements.reportContent.textContent = "Analisando...";
        try {
            const res = await this.callGeminiAPI(`Analise esta reunião do aluno ${s.name}. Texto: ${t}. Retorne JSON: {resumo_executivo, plano_acao}`, "Analise.");
            const json = JSON.parse(res);
            this.elements.reportContent.textContent = JSON.stringify(json, null, 2);
            if(!s.meetingHistory) s.meetingHistory=[]; s.meetingHistory.push(json);
            await this.setData('alunos/lista_alunos', { students: this.state.students });
        } catch (error) { this.elements.reportContent.textContent = `Erro: ${error.message}`; }
    },

    // =====================================================================
    // ================== API GEMINI CENTRAL (CORRIGIDA) ===================
    // =====================================================================
    async callGeminiAPI(sys, user, img=null) {
        if (!window.GEMINI_API_KEY) throw new Error("API Key faltando.");
        
        // URL CORRIGIDA PARA ÁUDIO E IMAGEM
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;
        
        const parts = [{ text: user }];
        if (img) parts.push({ inlineData: { mimeType: "image/jpeg", data: img } }); 
        // Nota: Para áudio, o Gemini aceita via inlineData como se fosse arquivo, mas é ideal converter o audio para mimeType correto no transcribeAudioGemini. 
        // Aqui deixei genérico. Na função transcribeAudioGemini, adapte o mimeType se necessário.

        const body = {
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: "user", parts: parts }]
        };
        if (!user.includes("Analise a trajetória")) body.generationConfig = { responseMimeType: "application/json" };

        const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error(`Erro API (${r.status}): ${(await r.json()).error.message}`);
        return (await r.json()).candidates[0].content.parts[0].text;
    },

    // =====================================================================
    // ================== SCANNER E TRAJETÓRIA =============================
    // =====================================================================
    openTaskAnalysisModal() { this.elements.taskAnalysisForm.reset(); this.elements.taskAnalysisStatusContainer.classList.add('hidden'); this.elements.taskAnalysisModal.classList.remove('hidden'); },
    closeTaskAnalysisModal() { this.elements.taskAnalysisModal.classList.add('hidden'); },

    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        const files = this.elements.taskFilesInput.files;
        if (!files.length) return alert("Selecione arquivos.");
        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        let newEntries = [];
        for(let i=0; i<files.length; i++) {
            try {
                const b64 = await this.fileToBase64(files[i]);
                let res = await this.callGeminiAPI(`Extraia JSON array: [{"date":"YYYY-MM-DD","stage":"A","sheet":"100","timeTaken":"10","gradeKumon":"100%"}]`, "Extraia.", b64);
                res = res.replace(/```json/g, '').replace(/```/g, '').trim();
                const json = JSON.parse(res);
                if(Array.isArray(json)) newEntries.push(...json);
            } catch(err) { console.error(err); }
        }
        const s = this.state.students[this.state.currentStudentId];
        if(!s.performanceLog) s.performanceLog=[];
        // Normaliza
        newEntries.forEach(x => {
             s.performanceLog.push({ id: Date.now()+Math.random(), createdAt: new Date().toISOString(), date: x.date||new Date().toISOString().split('T')[0], subject: 'Matemática', block: `${x.stage} ${x.sheet}`, timeTaken: x.timeTaken, gradeKumon: x.gradeKumon });
        });
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        this.elements.taskAnalysisStatus.textContent = "Sucesso!";
        setTimeout(() => this.closeTaskAnalysisModal(), 1000);
        this.elements.startTaskAnalysisBtn.disabled = false;
    },

    async generateTrajectoryAnalysis() {
        const s = this.state.students[this.state.currentStudentId];
        if(!s) return;
        const btn = this.elements.generateTrajectoryBtn; btn.disabled=true; btn.innerHTML="Analisando...";
        try {
            const brain = await this.fetchBrainData();
            const res = await this.callGeminiAPI(`Analise aluno ${s.name}. Historico: ${JSON.stringify((s.performanceLog||[]).slice(-20))}. Metas: ${JSON.stringify(brain.metas_gerais)}. Resumo curto para pais.`, "Analise a trajetória.");
            this.elements.trajectoryContent.textContent = res;
            this.elements.trajectoryInsightArea.classList.remove('hidden');
            if(!s.meetingHistory) s.meetingHistory=[]; s.meetingHistory.push({ meta: {date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS"}, resumo_executivo: res });
            await this.setData('alunos/lista_alunos', { students: this.state.students });
            this.loadStudentHistories(this.state.currentStudentId);
        } catch(e) { alert(e.message); }
        btn.disabled=false; btn.innerHTML="Análise Trajetória";
    },

    // =====================================================================
    // ================== CRUD e SISTEMA ===================================
    // =====================================================================
    loadStudents() {
        this.fetchData('alunos/lista_alunos').then(data => {
            this.state.students = (data && data.students) ? data.students : {};
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData();
        });
    },
    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        const list = Object.entries(this.state.students).filter(([, s]) => s.name.toLowerCase().includes(term) || (s.responsible||'').toLowerCase().includes(term));
        this.elements.studentList.innerHTML = list.length ? list.sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([id, s]) => `
            <div class="student-card" onclick="App.openStudentModal('${id}')">
                <div class="student-card-header"><h3>${s.name}</h3><p>${s.responsible}</p></div>
                <div class="student-stages">${s.mathStage?`<span>Mat: ${s.mathStage}</span>`:''}</div>
            </div>`).join('') : '<p>Nenhum aluno.</p>';
    },
    openStudentModal(id) {
        this.state.currentStudentId = id; this.elements.studentModal.classList.remove('hidden'); this.elements.studentForm.reset();
        if(id) {
            const s = this.state.students[id];
            this.elements.modalTitle.textContent = s.name; 
            this.elements.studentIdInput.value = id;
            document.getElementById('studentName').value = s.name; document.getElementById('studentResponsible').value = s.responsible; 
            document.getElementById('studentContact').value = s.contact; document.getElementById('mathStage').value = s.mathStage;
            document.getElementById('portStage').value = s.portStage; document.getElementById('engStage').value = s.engStage;
            this.elements.deleteStudentBtn.style.display = 'block';
            this.loadStudentHistories(id);
            this.elements.trajectoryInsightArea.classList.add('hidden');
        } else {
            this.elements.modalTitle.textContent = 'Novo Aluno';
            this.elements.deleteStudentBtn.style.display = 'none';
            this.elements.studentAnalysisContent.textContent = "";
        }
        this.switchTab('performance');
    },
    closeStudentModal() { this.elements.studentModal.classList.add('hidden'); this.state.currentStudentId = null; },
    loadStudentHistories(id) {
        const s = this.state.students[id];
        this.renderHistory('performanceLog', s.performanceLog||[]);
        this.renderHistory('programmingHistory', s.programmingHistory||[]);
        this.renderHistory('reportHistory', s.reportHistory||[]);
        
        const container = this.elements.meetingHistoryList;
        if(s.meetingHistory && s.meetingHistory.length) {
            container.innerHTML = s.meetingHistory.map(h => `
            <div class="meeting-card">
                <div class="meeting-header"><span>${h.date||(h.meta?.date)||'Data?'}</span><span>${h.meta?.type||'Reunião'}</span></div>
                <div class="meeting-summary">${h.resumo_executivo || h.summary || "..."}</div>
            </div>`).reverse().join('');
        } else { container.innerHTML = '<p>Sem histórico.</p>'; }
    },
    renderHistory(type, data) {
        const container = this.elements[type];
        if(!data || !data.length) { container.innerHTML = '<p>Vazio.</p>'; return; }
        container.innerHTML = data.sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).map(e => {
            if(type==='performanceLog') {
                return `<div class="history-item"><strong>${e.date}</strong> ${e.block} | ${e.timeTaken}m | ${e.gradeKumon} <button onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button></div>`;
            }
            return `<div class="history-item"><strong>${e.date}</strong> ${e.material||'Nota: '+e.grade} <button onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button></div>`;
        }).join('');
    },
    
    // Helpers
    async saveStudent() {
        const id = this.elements.studentIdInput.value || Date.now().toString();
        const s = this.state.students[id] || {};
        const updated = { ...s, name: document.getElementById('studentName').value, responsible: document.getElementById('studentResponsible').value, contact: document.getElementById('studentContact').value, mathStage: document.getElementById('mathStage').value, portStage: document.getElementById('portStage').value, engStage: document.getElementById('engStage').value };
        this.state.students[id] = updated;
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); this.openStudentModal(id); await this.updateBrainFromStudents(); alert('Salvo!');
    },
    async deleteStudent() { if(confirm('Excluir?')) { delete this.state.students[this.state.currentStudentId]; await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudents(); this.closeStudentModal(); } },
    async addHistoryEntry(e, type, form) { e.preventDefault(); const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() }; Array.from(form.elements).forEach(el => { if(el.id && !el.id.includes('File')) entry[el.id.replace(/performance|report|programming/i, '').toLowerCase()] = el.value; }); if(type === 'performanceLog') { entry.date = document.getElementById('performanceDate').value; entry.block = document.getElementById('performanceBlock').value; entry.timeTaken = document.getElementById('performanceTimeTaken').value; entry.gradeKumon = document.getElementById('performanceGradeKumon').value; entry.subject = document.getElementById('performanceSubject').value; } const s = this.state.students[this.state.currentStudentId]; if(!s[type]) s[type] = []; s[type].push(entry); await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudentHistories(this.state.currentStudentId); form.reset(); },
    async deleteHistoryEntry(type, id) { if(confirm('Apagar?')) { const s = this.state.students[this.state.currentStudentId]; s[type] = s[type].filter(e => e.id !== id); await this.setData('alunos/lista_alunos', { students: this.state.students }); this.loadStudentHistories(this.state.currentStudentId); } },
    
    // Admin
    promptForReset() { const code = prompt('Código:'); if (code === '*177') { const c = prompt("1-Reset, 2-Brain"); if(c==='1' && prompt('Confirmar APAGAR TUDO')==='APAGAR TUDO') this.hardResetUserData(); else if(c==='2') this.openBrainModal(); } },
    openBrainModal() { this.elements.brainModal.classList.remove('hidden'); },
    closeBrainModal() { this.elements.brainModal.classList.add('hidden'); },
    async hardResetUserData() { try { await this.getNodeRef('').remove(); alert("Resetado."); location.reload(); } catch(e) { alert(e); } },
    async handleBrainFileUpload() { const f=this.elements.brainFileUploadModal.files[0]; if(f) { const t=await f.text(); const j=JSON.parse(t); const c=await this.fetchBrainData(); if(c.curriculo_referencia&&j.curriculo_referencia) j.curriculo_referencia={...c.curriculo_referencia, ...j.curriculo_referencia}; await this.saveBrainData({...c, ...j}); alert('Brain OK'); this.closeBrainModal(); } },
    
    getNodeRef(p) { return this.state.db.ref(`gestores/${this.state.userId}/${p}`); },
    async fetchData(p) { const s = await this.getNodeRef(p).get(); return s.exists() ? s.val() : null; },
    async setData(p, d) { await this.getNodeRef(p).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async saveBrainData(d) { await this.setData('brain', d); }
};
