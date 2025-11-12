// App.js - Plataforma de Diário de Reuniões Kumon
// VERSÃO FOLHA DE REGISTRO + CÉREBRO ESCONDIDO
const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null, 
        audioFile: null,
        charts: {} 
    },
    elements: {},

    // =====================================================================
    // ======================== INICIALIZAÇÃO E SETUP ======================
    // =====================================================================
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
            logoutButton: document.getElementById('logout-button'),
            systemOptionsBtn: document.getElementById('system-options-btn'),
            dashboardBtn: document.getElementById('dashboard-btn'),
            
            dashboardModal: document.getElementById('dashboardModal'),
            closeDashboardBtn: document.getElementById('closeDashboardBtn'),
            riskList: document.getElementById('riskList'),
            starList: document.getElementById('starList'),
            
            // KPIs
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
            
            // Formulários
            programmingForm: document.getElementById('programmingForm'),
            reportForm: document.getElementById('reportForm'),
            performanceForm: document.getElementById('performanceForm'), // Agora é a Folha de Registro
            
            studentAnalysisContent: document.getElementById('student-analysis-content'),
            programmingHistory: document.getElementById('programmingHistory'),
            reportHistory: document.getElementById('reportHistory'),
            performanceLog: document.getElementById('performanceHistory'), // Log da Folha de Registro

            // Filtros
            filterProgramming: document.getElementById('filterProgramming'),
            filterReports: document.getElementById('filterReports'),
            filterPerformance: document.getElementById('filterPerformance'),

            // Elementos do Modal Cérebro (ADMIN ESCONDIDO)
            brainModal: document.getElementById('brainModal'),
            closeBrainModalBtn: document.getElementById('closeBrainModalBtn'),
            brainFileUploadModal: document.getElementById('brainFileUploadModal'),
            uploadBrainFileBtnModal: document.getElementById('uploadBrainFileBtnModal'),
        };
    },

    addEventListeners() {
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.systemOptionsBtn.addEventListener('click', () => this.promptForReset()); // <<-- Lógica do Admin aqui
        this.elements.dashboardBtn.addEventListener('click', () => this.openDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.closeDashboard());
        this.elements.dashboardModal.addEventListener('click', (e) => { if (e.target === this.elements.dashboardModal) this.closeDashboard(); });

        this.elements.audioUpload.addEventListener('change', () => this.handleFileUpload());
        this.elements.meetingStudentSelect.addEventListener('change', () => this.handleFileUpload());
        this.elements.transcribeAudioBtn.addEventListener('click', () => this.transcribeAudioGemini()); 
        this.elements.analyzeTranscriptionBtn.addEventListener('click', () => this.analyzeTranscriptionGemini()); 
        this.elements.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        
        // Listeners do Modal Cérebro (ADMIN ESCONDIDO)
        this.elements.uploadBrainFileBtnModal.addEventListener('click', () => this.handleBrainFileUpload());
        this.elements.closeBrainModalBtn.addEventListener('click', () => this.closeBrainModal());
        this.elements.brainModal.addEventListener('click', (e) => { if (e.target === this.elements.brainModal) this.closeBrainModal(); });
        
        this.elements.addStudentBtn.addEventListener('click', () => this.openStudentModal());
        this.elements.studentSearch.addEventListener('input', () => this.renderStudentList());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeStudentModal());
        this.elements.saveStudentBtn.addEventListener('click', () => this.saveStudent());
        this.elements.deleteStudentBtn.addEventListener('click', () => this.deleteStudent());
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        
        this.elements.programmingForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', this.elements.programmingForm));
        this.elements.reportForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', this.elements.reportForm));
        this.elements.performanceForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', this.elements.performanceForm)); 
        
        // Listeners para os filtros
        this.elements.filterProgramming.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterReports.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterPerformance.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));

        this.elements.studentModal.addEventListener('click', (e) => { if (e.target === this.elements.studentModal) this.closeStudentModal(); });
    },

    // =====================================================================
    // ================== LÓGICA DO DASHBOARD AVANÇADO =====================
    // =====================================================================

    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.generateDashboardData();
    },

    closeDashboard() {
        this.elements.dashboardModal.classList.add('hidden');
    },

    // Lógica do Dashboard (Inalterada, pois já lê as 3 matérias)
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
            if (s.meetingHistory && s.meetingHistory.length > 0) {
                const lastReport = s.meetingHistory[s.meetingHistory.length - 1];
                const reportText = JSON.stringify(lastReport).toLowerCase();
                const hasRisk = reportText.includes("dificuldade") || reportText.includes("desmotivado") || reportText.includes("desistência") || reportText.includes("atraso") || reportText.includes("resistência");
                const hasStar = reportText.includes("elogio") || reportText.includes("avanço") || reportText.includes("excelente") || reportText.includes("motivado") || reportText.includes("parabéns");

                if (hasRisk) { riskStudents.push(s); riskCount++; }
                else if (hasStar) { starStudents.push(s); starCount++; }
                else { neutralCount++; }
            } else { neutralCount++; }
        });

        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalSubjectsEnrollments;
        this.elements.kpiMultiSubject.textContent = multiSubjectStudents;
        this.elements.kpiRiskCount.textContent = riskCount;

        this.renderDashboardList(this.elements.riskList, riskStudents, '⚠️');
        this.renderDashboardList(this.elements.starList, starStudents, '⭐');
        
        const allLetters = new Set([
            ...Object.keys(stagesBySubject['Math']),
            ...Object.keys(stagesBySubject['Port']),
            ...Object.keys(stagesBySubject['Eng'])
        ]);
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
            li.style.padding = "5px 0";
            li.style.borderBottom = "1px solid #eee";
            li.innerHTML = `<strong>${icon} ${s.name}</strong> <span style="font-size:0.8em;">(${s.responsible})</span>`;
            li.style.cursor = "pointer";
            // Encontra o ID do aluno (key) pelo objeto (value)
            const studentId = Object.keys(this.state.students).find(key => this.state.students[key] === s);
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(studentId); };
            element.appendChild(li);
        });
    },

    renderCharts(stageData, subjectCounts, moodData) {
        // Destrói gráficos antigos antes de recriar
        if (this.state.charts.stages) this.state.charts.stages.destroy();
        if (this.state.charts.subjects) this.state.charts.subjects.destroy();
        if (this.state.charts.mood) this.state.charts.mood.destroy();

        const ctxStages = document.getElementById('stagesChart').getContext('2d');
        this.state.charts.stages = new Chart(ctxStages, {
            type: 'bar',
            data: {
                labels: stageData.labels,
                datasets: [
                    { label: 'Matemática', data: stageData.math, backgroundColor: '#0078c1' },
                    { label: 'Português', data: stageData.port, backgroundColor: '#d62828' },
                    { label: 'Inglês', data: stageData.eng, backgroundColor: '#f59e0b' }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } 
            }
        });

        const ctxSubjects = document.getElementById('subjectsChart').getContext('2d');
        this.state.charts.subjects = new Chart(ctxSubjects, {
            type: 'pie',
            data: {
                labels: ['Matemática', 'Português', 'Inglês'],
                datasets: [{
                    data: [subjectCounts['Matemática'], subjectCounts['Português'], subjectCounts['Inglês']],
                    backgroundColor: ['#0078c1', '#d62828', '#f59e0b']
                }]
            }, options: { responsive: true, maintainAspectRatio: false }
        });

        const ctxMood = document.getElementById('moodChart').getContext('2d');
        this.state.charts.mood = new Chart(ctxMood, {
            type: 'doughnut',
            data: {
                labels: ['Em Risco', 'Motivados', 'Neutros/Sem Análise'],
                datasets: [{ data: [moodData.risk, moodData.star, moodData.neutral], backgroundColor: ['#d62828', '#28a745', '#eaf6ff'] }]
            }, options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // =====================================================================
    // ================== LÓGICA DE REUNIÃO (IA) ===========================
    // =====================================================================
    
    handleFileUpload() {
        const file = this.elements.audioUpload.files[0];
        const studentSelected = this.elements.meetingStudentSelect.value;
        if (file) { this.state.audioFile = file; this.elements.audioFileName.textContent = `Arquivo selecionado: ${file.name}`; } 
        else { this.state.audioFile = null; this.elements.audioFileName.textContent = ''; }
        this.elements.transcribeAudioBtn.disabled = !(this.state.audioFile && studentSelected);
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    },

    async transcribeAudioGemini() {
        this.elements.transcriptionOutput.value = 'Processando áudio com IA (Gemini)...';
        this.elements.transcriptionOutput.style.color = 'inherit';
        this.elements.transcriptionModule.classList.remove('hidden');
        this.elements.transcriptionModule.scrollIntoView({ behavior: 'smooth' });

        const studentId = this.elements.meetingStudentSelect.value;
        if (!studentId) { alert('Erro: Selecione um aluno.'); this.elements.transcriptionModule.classList.add('hidden'); return; }

        try {
            if (!this.state.audioFile) throw new Error('Nenhum áudio.');
            if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE_SUA_CHAVE")) throw new Error('GEMINI_API_KEY não configurada.');

            const mimeType = this.state.audioFile.type;
            if (!mimeType.startsWith('audio/')) throw new Error('Arquivo inválido.');

            this.elements.transcriptionOutput.value = 'Convertendo áudio...';
            const base64Data = await this.fileToBase64(this.state.audioFile);
            this.elements.transcriptionOutput.value = 'Enviando para Gemini...';
            const transcriptionText = await this.callGeminiForTranscription(base64Data, mimeType);
            this.elements.transcriptionOutput.value = transcriptionText;
        } catch (error) {
            console.error(error);
            this.elements.transcriptionOutput.value = `Erro: ${error.message}`;
            this.elements.transcriptionOutput.style.color = 'red';
        }
    },

    async callGeminiForTranscription(base64Data, mimeType) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${window.GEMINI_API_KEY}`;
        const requestBody = { "contents": [{ "role": "user", "parts": [{ "text": "Transcreva este áudio em português do Brasil." }, { "inlineData": { "mimeType": mimeType, "data": base64Data } }] }] };
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Erro API: ${err.error.message}`);
        }
        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) throw new Error("A IA não retornou uma transcrição.");
        return data.candidates[0].content.parts[0].text;
    },

    async analyzeTranscriptionGemini() {
        const transcriptionText = this.elements.transcriptionOutput.value;
        const notes = this.elements.additionalNotes.value; // Notas manuais
        if (!transcriptionText) return alert('Transcrição vazia.');

        const studentId = this.elements.meetingStudentSelect.value;
        const studentData = this.state.students[studentId];
        if (!studentData) return alert('Erro: Aluno não encontrado.');

        this.elements.reportContent.textContent = `Analisando como Orientadora Sênior para: ${studentData.name}...`;
        this.elements.reportSection.classList.remove('hidden');
        this.elements.reportSection.scrollIntoView({ behavior: 'smooth' });

        try {
            const brainData = await this.fetchBrainData();
            const analysis = await this.callGeminiForAnalysis(transcriptionText, notes, brainData, studentData);

            if (analysis.erro) throw new Error(analysis.erro);
            if (!analysis.meta) analysis.meta = {};
            analysis.meta.meetingDate = this.elements.meetingDate.value || new Date().toISOString().split('T')[0];
            analysis.meta.studentId = studentId;
            analysis.meta.studentName = studentData.name;

            this.state.reportData = analysis;
            this.renderReport(analysis);

            if (!this.state.students[studentId].meetingHistory) this.state.students[studentId].meetingHistory = [];
            this.state.students[studentId].meetingHistory.push(analysis);
            await this.setData('alunos/lista_alunos', { students: this.state.students });

            alert('Análise salva!');
            this.elements.transcriptionOutput.value = "";
            this.elements.transcriptionModule.classList.add('hidden');
            this.elements.audioUpload.value = null;
            this.elements.transcribeAudioBtn.disabled = true;
        } catch (error) {
            this.elements.reportContent.textContent = `Erro: ${error.message}`;
            this.elements.reportContent.style.color = 'red';
        }
    },

    // =====================================================================
    // ================== O CÉREBRO DA SUPER ORIENTADORA ===================
    // =====================================================================
    async callGeminiForAnalysis(transcriptionText, manualNotes, brainData, studentData) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${window.GEMINI_API_KEY}`;
        
        // PROMPT ATUALIZADO PARA ENTENDER A "FOLHA DE REGISTRO"
        const textPrompt = `
ATUE COMO: Orientadora Sênior do Método Kumon e Psicóloga Educacional com 20 anos de experiência.
OBJETIVO: Analisar uma reunião (transcrição + notas) e cruzá-la com a "Ficha de Aluno" (dados técnicos) para gerar um plano de ação.

REGRA DE OURO (NÃO QUEBRE JAMAIS):
1. **VERDADE ABSOLUTA:** Baseie-se APENAS nos dados fornecidos (Ficha de Aluno, Transcrição, Notas). Não alucine.
2. **FOCO NO MÉTODO:** Use a terminologia correta (Ponto de Partida, Estágio, Bloco, Repetição, Autodidatismo).
3. **ANÁLISE CRUZADA (O MAIS IMPORTANTE):**
   - Compare o que foi dito na reunião com a "Ficha de Aluno".
   - **Performance (Folha de Registro):** Olhe o 'performanceLog' do aluno. Se o 'Tempo Realizado' (timeTaken) é consistentemente maior que o 'Tempo Previsto' (timeGoal) E a 'Nota Kumon' (gradeKumon) é baixa (ex: "<80%" ou "REPETIR"), isto é um SINAL DE DIFICULDADE NO BLOCO.
   - **Boletins Escolares:** Olhe o 'reportHistory'. Se o pai diz "ele vai mal na escola" e o boletim confirma (nota < 7), use isso.
4. **PSICOLOGIA:** Analise o tom da reunião. Há ansiedade dos pais? Falta de rotina? Resistência do aluno?
5. **FILTRO DE RELEVÂNCIA:** Se o texto não for sobre educação, aluno ou Kumon, retorne JSON com campo "erro".

---
DADOS DO ALUNO (Ficha Técnica Real / Fonte de Verdade):
${JSON.stringify(studentData, null, 2)}
---
DADOS DA REUNIÃO (Fonte da Verdade Oral):
Transcrição do Áudio: "${transcriptionText}"
Notas do Orientador: "${manualNotes}"
---
DADOS GERAIS DA FRANQUIA (Contexto Opcional):
${JSON.stringify(brainData, null, 2)}
---

RETORNE APENAS JSON (Sem markdown) NESTE FORMATO EXATO:
{
  "resumo_executivo": "Resumo profissional da reunião focando nos pontos pedagógicos.",
  "analise_psicopedagogica": "Análise comportamental/emocional dos pais e aluno (Ex: Pai ansioso, aluno desmotivado).",
  "diagnostico_kumon": {
      "estagio_atual": "Análise do estágio atual (Ex: D150) versus o ideal para a idade/série.",
      "ritmo_e_precisao": "Análise baseada no 'performanceLog'. O aluno está lento? Está errando muito? (Ex: Tempo acima do previsto com nota baixa no bloco D)."
  },
  "discrepancias_detectadas": "Liste contradições entre o que foi dito na reunião e o que está nos dados (Ex: Pai diz que o aluno está rápido, mas o 'performanceLog' mostra tempos altos).",
  "plano_acao_imediato": [
      { "responsavel": "Orientador", "acao": "Ação técnica (Ex: Repetir o bloco D1-D10)" },
      { "responsavel": "Pais", "acao": "Ação comportamental (Ex: Supervisionar o horário de estudo)" }
  ],
  "ajuste_programacao_sugerido": "Sugestão técnica para a próxima programação (Ex: Focar em 2 repetições do D1-10 antes de avançar para D11).",
  "requer_validacao_humana": true,
  "erro": null
}
`;

        const requestBody = {
            "contents": [{ "parts": [{ "text": textPrompt }] }],
            "generationConfig": { "responseMimeType": "application/json" }
        };

        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Erro API: ${err.error.message}`);
        }
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Erro parse JSON:', text);
            throw new Error('IA retornou formato JSON inválido.');
        }
    },
    
    // =====================================================================
    // ================== FUNÇÕES DE APOIO (UI/DADOS) ======================
    // =====================================================================
    
    renderReport(data) { this.elements.reportContent.textContent = JSON.stringify(data, null, 2); },
    downloadReport() { 
        if (!this.state.reportData) return alert('Sem dados.');
        const blob = new Blob([JSON.stringify(this.state.reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Analise_Kumon_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    
    getNodeRef(path) { return this.state.userId ? this.state.db.ref(`gestores/${this.state.userId}/${path}`) : null; },
    async fetchData(path) { const snap = await this.getNodeRef(path).get(); return snap.exists() ? snap.val() : null; },
    async setData(path, data) { await this.getNodeRef(path).set(data); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async saveBrainData(d) { await this.setData('brain', d); },
    
    async handleBrainFileUpload() {
        const file = this.elements.brainFileUploadModal.files[0]; // <-- Corrigido para o input do Modal
        if (!file) return alert('Selecione um arquivo JSON.');
        try {
            const text = await file.text();
            const newBrain = JSON.parse(text);
            const currentBrain = await this.fetchBrainData();
            const merged = { ...currentBrain, ...newBrain }; // Merge simples
            await this.saveBrainData(merged);
            alert('Cérebro atualizado!');
            this.elements.brainFileUploadModal.value = ''; // Limpa o input
            this.closeBrainModal(); // Fecha o modal
        } catch (e) {
            alert('Erro no arquivo JSON.');
        }
    },

    async loadStudents() {
        const data = await this.fetchData('alunos/lista_alunos');
        this.state.students = (data && data.students) ? data.students : {};
        this.renderStudentList();
        this.populateMeetingStudentSelect();
    },

    populateMeetingStudentSelect() {
        const select = this.elements.meetingStudentSelect;
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Selecione um aluno...</option>';
        Object.entries(this.state.students).sort(([, a], [, b]) => a.name.localeCompare(b.name)).forEach(([id, s]) => {
            const op = document.createElement('option'); op.value = id; op.textContent = s.name; select.appendChild(op);
        });
    },

    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        const list = Object.entries(this.state.students).filter(([, s]) => s.name.toLowerCase().includes(term) || (s.responsible && s.responsible.toLowerCase().includes(term)));

        if (list.length === 0) {
            this.elements.studentList.innerHTML = `<div class="empty-state"><p>Nenhum aluno encontrado.</p></div>`;
            return;
        }
        
        this.elements.studentList.innerHTML = list
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([id, s]) => `
                <div class="student-card" onclick="App.openStudentModal('${id}')">
                    <div class="student-card-header"><div><h3 class="student-name">${s.name}</h3><p class="student-responsible">${s.responsible || 'Sem responsável'}</p></div></div>
                    <div class="student-stages">
                        ${s.mathStage?`<span class="stage-item" style="border-left:4px solid #0078c1; padding-left: 8px;">Mat: ${s.mathStage}</span>`:''}
                        ${s.portStage?`<span class="stage-item" style="border-left:4px solid #d62828; padding-left: 8px;">Port: ${s.portStage}</span>`:''}
                        ${s.engStage?`<span class="stage-item" style="border-left:4px solid #f59e0b; padding-left: 8px;">Ing: ${s.engStage}</span>`:''}
                    </div>
                </div>`).join('');
    },

    openStudentModal(id) {
        this.state.currentStudentId = id;
        this.elements.studentModal.classList.remove('hidden');
        this.elements.studentForm.reset();
        
        // Reseta os filtros para "Todas"
        this.elements.filterProgramming.value = 'all';
        this.elements.filterReports.value = 'all';
        this.elements.filterPerformance.value = 'all';

        if (id) {
            const s = this.state.students[id];
            this.elements.modalTitle.textContent = s.name;
            this.elements.studentIdInput.value = id;
            document.getElementById('studentName').value = s.name;
            document.getElementById('studentResponsible').value = s.responsible;
            document.getElementById('studentContact').value = s.contact;
            document.getElementById('mathStage').value = s.mathStage;
            document.getElementById('portStage').value = s.portStage;
            document.getElementById('engStage').value = s.engStage;
            this.elements.deleteStudentBtn.style.display = 'block';
            
            this.loadStudentHistories(id);
            
            const last = s.meetingHistory ? s.meetingHistory[s.meetingHistory.length-1] : null;
            this.elements.studentAnalysisContent.textContent = last ? JSON.stringify(last, null, 2) : "Sem análises de reunião.";
        } else {
            this.elements.modalTitle.textContent = 'Novo Aluno';
            this.elements.deleteStudentBtn.style.display = 'none';
            this.clearStudentHistories();
            this.elements.studentAnalysisContent.textContent = "Salve o aluno para gerar análises.";
        }
        this.switchTab('performance'); // Abre na Folha de Registro
    },

    closeStudentModal() { this.elements.studentModal.classList.add('hidden'); this.state.currentStudentId = null; },
    switchTab(t) { 
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${t}"]`).classList.add('active');
        document.getElementById(`tab-${t}`).classList.add('active');
    },

    async saveStudent() {
        const id = this.elements.studentIdInput.value || Date.now().toString();
        const s = this.state.students[id] || {};
        
        const newData = { 
            ...s, // Mantém históricos (programmingHistory, reportHistory, performanceLog, meetingHistory)
            name: document.getElementById('studentName').value, 
            responsible: document.getElementById('studentResponsible').value, 
            contact: document.getElementById('studentContact').value, 
            mathStage: document.getElementById('mathStage').value, 
            portStage: document.getElementById('portStage').value, 
            engStage: document.getElementById('engStage').value, 
            updatedAt: new Date().toISOString() 
        };
        if (!s.createdAt) newData.createdAt = new Date().toISOString();

        this.state.students[id] = newData;
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        
        this.loadStudents(); // Recarrega lista e dropdown
        this.openStudentModal(id); // Reabre o modal com os dados salvos
        await this.updateBrainFromStudents(); // Atualiza o cérebro da IA
        alert('Aluno salvo!');
    },

    async deleteStudent() {
        if(!confirm('Tem certeza?')) return;
        delete this.state.students[this.state.currentStudentId];
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); // Recarrega lista e dropdown
        this.closeStudentModal();
        await this.updateBrainFromStudents();
        alert('Excluído!');
    },

    async updateBrainFromStudents() {
        let brain = await this.fetchBrainData();
        if (!brain.alunos) brain.alunos = {};
        
        // Limpa alunos antigos do cérebro
        Object.keys(brain.alunos).forEach(brainId => {
            if (!this.state.students[brainId]) delete brain.alunos[brainId];
        });

        // Atualiza/adiciona alunos
        for (const [id, s] of Object.entries(this.state.students)) {
            brain.alunos[id] = {
                id: id,
                nome: s.name,
                responsavel: s.responsible,
                estagio_matematica: s.mathStage,
                estagio_portugues: s.portStage,
                estagio_ingles: s.engStage,
                historico_desempenho: s.performanceLog || [],
                historico_boletins: s.reportHistory || [],
                metas: brain.alunos[id]?.metas || {}, // Preserva metas
            };
        }
        await this.saveBrainData(brain);
        console.log("Cérebro da IA sincronizado.");
    },

    // === FUNÇÕES DE HISTÓRICO ATUALIZADAS (FILTROS E NOVOS CAMPOS) ===

    loadStudentHistories(id) {
        if (!id) return this.clearStudentHistories();
        const s = this.state.students[id];
        
        const progFilter = this.elements.filterProgramming.value;
        const repFilter = this.elements.filterReports.value;
        const perfFilter = this.elements.filterPerformance.value;

        this.renderHistory('programmingHistory', s.programmingHistory, progFilter);
        this.renderHistory('reportHistory', s.reportHistory, repFilter);
        this.renderHistory('performanceLog', s.performanceLog, perfFilter);
    },

    clearStudentHistories() {
        this.elements.programmingHistory.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
        this.elements.reportHistory.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
        this.elements.performanceLog.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
    },

    async addHistoryEntry(e, type, form) {
        e.preventDefault();
        if (!this.state.currentStudentId) return alert('Salve o aluno antes.');
        
        const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() };
        
        try {
            if (type === 'programmingHistory') {
                entry.date = form.querySelector('#programmingDate').value;
                entry.subject = form.querySelector('#programmingSubject').value; 
                entry.material = form.querySelector('#programmingMaterial').value;
                entry.notes = form.querySelector('#programmingNotes').value;
            } else if (type === 'reportHistory') {
                entry.date = form.querySelector('#reportDate').value;
                entry.subject = form.querySelector('#reportSubject').value;
                entry.grade = form.querySelector('#reportGrade').value;
                const file = form.querySelector('#reportFile').files[0];
                if (file) entry.fileurl = await this.uploadFileToCloudinary(file, 'boletins');
            } else if (type === 'performanceLog') {
                // CAMPOS DA NOVA "FOLHA DE REGISTRO"
                entry.date = form.querySelector('#performanceDate').value;
                entry.subject = form.querySelector('#performanceSubject').value; 
                entry.block = form.querySelector('#performanceBlock').value;
                entry.timeGoal = form.querySelector('#performanceTimeGoal').value;
                entry.timeTaken = form.querySelector('#performanceTimeTaken').value;
                entry.gradeKumon = form.querySelector('#performanceGradeKumon').value;
            }
        } catch (err) {
            console.error("Erro ao ler formulário:", err);
            alert("Erro ao salvar. Verifique os campos.");
            return;
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s[type]) s[type] = [];
        s[type].push(entry);
        
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        await this.updateBrainFromStudents(); // Atualiza cérebro da IA
        form.reset();
    },

    renderHistory(type, data, filter = 'all') {
        const container = this.elements[type];
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
            return;
        }

        const filteredData = data.filter(e => filter === 'all' || e.subject === filter);

        if (filteredData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Nada encontrado neste filtro.</p>';
            return;
        }

        container.innerHTML = filteredData
            .sort((a,b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) // Ordena por data
            .map(e => `
            <div class="history-item">
                <div class="history-item-header" style="gap: 10px;">
                    <strong>${e.date || 'Data?'}</strong>
                    ${this.getSubjectBadge(e.subject)} 
                </div>
                <div>${this.getHistoryDetails(type, e)}</div>
                <button onclick="App.deleteHistoryEntry('${type}','${e.id}')" class="delete-history-btn" title="Excluir registro">&times;</button>
            </div>
        `).join('');
    },

    getSubjectBadge(subject) {
        if (!subject) return '';
        const colorClass = `subject-${subject.replace('ã', 'a').replace('ê', 'e')}`; // Trata 'Matemática'
        return `<span class="subject-badge ${colorClass}">${subject}</span>`;
    },

    getHistoryDetails(type, e) {
        if (type === 'programmingHistory') {
            return `<strong>${e.material}</strong><br><span class="text-sm text-gray-600">${e.notes || 'Sem obs.'}</span>`;
        }
        if (type === 'reportHistory') {
            return `Nota Escolar: <strong>${e.grade}</strong> ${e.fileurl ? '<a href="'+e.fileurl+'" target="_blank" class="text-sm">[Anexo]</a>' : ''}`;
        }
        if (type === 'performanceLog') {
            // DETALHES DA NOVA "FOLHA DE REGISTRO"
            let timeInfo = `<strong>Tempo:</strong> ${e.timeTaken} min`;
            if (e.timeGoal) timeInfo += ` (Previsto: ${e.timeGoal} min)`;
            
            let gradeColor = "inherit";
            if(e.gradeKumon === 'REPETIR' || e.gradeKumon === '<80%') gradeColor = "var(--kumon-red)";
            if(e.gradeKumon === '100%') gradeColor = "var(--success)";

            return `<strong>Bloco:</strong> ${e.block}<br>${timeInfo}<br><strong>Nota:</strong> <span style="color: ${gradeColor}; font-weight: bold;">${e.gradeKumon}</span>`;
        }
    },

    async deleteHistoryEntry(type, id) {
        if (!confirm('Excluir este registro?')) return;
        const s = this.state.students[this.state.currentStudentId];
        s[type] = s[type].filter(e => e.id !== id);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        await this.updateBrainFromStudents(); // Atualiza cérebro da IA
    },

    async uploadFileToCloudinary(file, folder) { 
        const f = new FormData(); 
        f.append('file', file); 
        f.append('upload_preset', cloudinaryConfig.uploadPreset); 
        f.append('folder', `${this.state.userId}/${folder}`);
        const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, { method: 'POST', body: f });
        if (!r.ok) throw new Error("Falha no upload para Cloudinary.");
        return (await r.json()).secure_url;
    },
    
    // =====================================================================
    // ================== LÓGICA DE ADMIN (CÉREBRO) ========================
    // =====================================================================
    
    // ATUALIZADO: Menu de Admin
    promptForReset() { 
        const code = prompt('Código de Administrador:');
        if (code !== '*177') {
            if (code !== null) alert("Código incorreto.");
            return;
        }

        // Se o código está correto, abre o menu
        const choice = prompt("Opções de Admin:\n\nDigite 1 - RESETAR UNIDADE\nDigite 2 - ATUALIZAR CÉREBRO IA");

        if (choice === '1') {
            // Fluxo de Reset
            if (prompt('Esta ação é irreversível. Digite APAGAR TUDO para confirmar.')==='APAGAR TUDO') {
                this.hardResetUserData(); 
            } else {
                alert("Reset cancelado.");
            }
        } else if (choice === '2') {
            // Fluxo de Abrir Modal do Cérebro
            this.openBrainModal();
        } else {
            alert("Opção inválida.");
        }
    },

    openBrainModal() {
        this.elements.brainModal.classList.remove('hidden');
    },

    closeBrainModal() {
        this.elements.brainModal.classList.add('hidden');
    },

    async hardResetUserData() { 
        try {
            await this.getNodeRef('').remove(); 
            alert("Sistema resetado. A página será recarregada.");
            location.reload();
        } catch(e) {
            alert("Erro ao resetar: " + e.message);
        }
    }
};
