// App.js - Plataforma de Diário de Reuniões Kumon
// VERSÃO 5.0 (HÍBRIDA: BOLETIM + TAREFAS CORRIGIDAS)
// Capaz de ler Folha de Registro (Tabela) E Tarefa Individual (Círculos/Testes)

const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null,
        audioFile: null,
        charts: {},
        geminiModel: "gemini-2.5-flash-preview-09-2025" // Modelo otimizado
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
            
            kpiTotalStudents: document.getElementById('kpi-total-students'),
            kpiTotalSubjects: document.getElementById('kpi-total-subjects'),
            kpiMultiSubject: document.getElementById('kpi-multi-subject'),
            kpiRiskCount: document.getElementById('kpi-risk-count'),

            // Módulo Reunião (Áudio)
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
            
            // Módulo Aluno
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
            
            // Abas e Forms
            programmingForm: document.getElementById('programmingForm'),
            reportForm: document.getElementById('reportForm'),
            performanceForm: document.getElementById('performanceForm'), 
            
            // Históricos
            studentAnalysisContent: document.getElementById('student-analysis-content'),
            programmingHistory: document.getElementById('programmingHistory'),
            reportHistory: document.getElementById('reportHistory'),
            performanceLog: document.getElementById('performanceHistory'), 

            // Filtros
            filterProgramming: document.getElementById('filterProgramming'),
            filterReports: document.getElementById('filterReports'),
            filterPerformance: document.getElementById('filterPerformance'),

            // Admin Brain
            brainModal: document.getElementById('brainModal'),
            closeBrainModalBtn: document.getElementById('closeBrainModalBtn'),
            brainFileUploadModal: document.getElementById('brainFileUploadModal'),
            uploadBrainFileBtnModal: document.getElementById('uploadBrainFileBtnModal'),
            
            // V3/V4/V5: Scanner
            taskAnalysisModal: document.getElementById('taskAnalysisModal'),
            closeTaskAnalysisModalBtn: document.getElementById('closeTaskAnalysisModalBtn'),
            taskAnalysisForm: document.getElementById('taskAnalysisForm'),
            taskFilesInput: document.getElementById('taskFilesInput'),
            startTaskAnalysisBtn: document.getElementById('startTaskAnalysisBtn'),
            taskAnalysisStatusContainer: document.getElementById('taskAnalysisStatusContainer'),
            taskAnalysisProgressBar: document.getElementById('taskAnalysisProgressBar'),
            taskAnalysisStatus: document.getElementById('taskAnalysisStatus'),
            openTaskAnalysisBtn: document.getElementById('openTaskAnalysisBtn'),
            
            // V4: Análise Pré-Reunião
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
        
        this.elements.filterProgramming.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterReports.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterPerformance.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));

        this.elements.studentModal.addEventListener('click', (e) => { if (e.target === this.elements.studentModal) this.closeStudentModal(); });

        // Scanner V5
        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        
        // Pré-Reunião
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // ================== CÉREBRO IA (GEMINI) ==============================
    // =====================================================================

    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async callGeminiAPI(systemPrompt, userPrompt, imageBase64 = null) {
        if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE_SUA_CHAVE")) throw new Error("API Key não configurada.");

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{
                role: "user",
                parts: [
                    { text: userPrompt },
                    ...(imageBase64 ? [{ inlineData: { mimeType: "image/jpeg", data: imageBase64 } }] : [])
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        };
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error((await response.json()).error.message);
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    },

    // =====================================================================
    // ============ SCANNER V5: TAREFAS & FOLHA DE REGISTRO ================
    // =====================================================================

    openTaskAnalysisModal() {
        this.elements.taskAnalysisForm.reset();
        this.elements.taskAnalysisStatusContainer.classList.add('hidden');
        this.elements.taskAnalysisProgressBar.style.width = '0%';
        this.elements.taskAnalysisModal.classList.remove('hidden');
    },

    closeTaskAnalysisModal() { this.elements.taskAnalysisModal.classList.add('hidden'); },

    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        const files = this.elements.taskFilesInput.files;
        if (!files.length || !this.state.currentStudentId) return alert("Selecione imagens e garanta que um aluno está aberto.");

        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        // PROMPT HÍBRIDO (V5): Reconhece Tabela e Tarefa Individual
        const systemPrompt = `
            VOCÊ É UM ESPECIALISTA EM MÉTODO KUMON.
            Sua tarefa é analisar imagens enviadas pelo orientador e converter em dados JSON.
            
            EXISTEM 2 TIPOS DE IMAGEM QUE VOCÊ DEVE IDENTIFICAR AUTOMATICAMENTE:
            
            TIPO 1: FOLHA DE REGISTRO (TABELA)
            - É uma grade com muitas linhas (datas).
            - Ação: Extraia TODAS as linhas preenchidas.
            - Campos: Date, Stage (Letra), Sheet (Número), TimeTaken (min), GradeKumon (baseado nos círculos).
            
            TIPO 2: TAREFA INDIVIDUAL OU TESTE DIAGNÓSTICO (PÁGINA ÚNICA)
            - É uma foto de uma folha de exercícios (ex: "A", "2A", "K1", Teste).
            - Pode ter círculos grandes vermelhos (Nota 100%) ou marcas de "V".
            - Ação: Extraia os dados dessa ÚNICA tarefa.
            - Data: Se não houver data escrita a mão, use a data de hoje "TODAY".
            - Stage/Block: O código no topo da folha (ex: "A", "4A", "K1").
            - Sheet: O número da página (ex: "91", "100", "Teste").
            - GradeKumon: Se tiver um círculo grande englobando tudo = "100%". Se tiver marcas de "V" ou notas menores = "80-99%" ou a nota escrita.
            
            SAÍDA ESPERADA (ARRAY JSON SEMPRE):
            [
              {
                "date": "YYYY-MM-DD", 
                "stage": "B", 
                "sheet": "91", 
                "timeTaken": 25, (ou null se não visível)
                "gradeKumon": "100%" 
              }
            ]
        `;

        let newEntries = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.elements.taskAnalysisStatus.textContent = `Processando imagem ${i + 1}/${files.length}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;

            try {
                const b64 = await this.imageToBase64(file);
                const jsonStr = await this.callGeminiAPI(systemPrompt, "Extraia os dados desta imagem (Tabela ou Tarefa).", b64);
                const rows = JSON.parse(jsonStr);

                if (Array.isArray(rows)) {
                    rows.forEach(row => {
                        // Normalização de dados
                        const finalDate = (row.date === "TODAY" || !row.date) ? new Date().toISOString().split('T')[0] : row.date;
                        
                        newEntries.push({
                            id: Date.now() + Math.random().toString(),
                            createdAt: new Date().toISOString(),
                            date: finalDate,
                            subject: 'Matemática', // IA pode inferir no futuro, default Mat
                            block: `${row.stage || '?'} ${row.sheet || '?'}`, 
                            timeGoal: null,
                            timeTaken: row.timeTaken || 0,
                            gradeKumon: row.gradeKumon || 'Analisado'
                        });
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s.performanceLog) s.performanceLog = [];
        // Adiciona novos registros
        s.performanceLog = [...s.performanceLog, ...newEntries];
        
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        await this.updateBrainFromStudents();
        
        this.elements.taskAnalysisStatus.textContent = "Processamento concluído!";
        setTimeout(() => this.closeTaskAnalysisModal(), 1500);
        this.elements.startTaskAnalysisBtn.disabled = false;
    },

    // =====================================================================
    // ============ LÓGICA V4: ANÁLISE DE TRAJETÓRIA (PRÉ-REUNIÃO) =========
    // =====================================================================

    async generateTrajectoryAnalysis() {
        if (!this.state.currentStudentId) return;
        
        const btn = this.elements.generateTrajectoryBtn;
        const outputArea = this.elements.trajectoryInsightArea;
        const outputContent = this.elements.trajectoryContent;
        const student = this.state.students[this.state.currentStudentId];

        btn.disabled = true;
        btn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Analisando Dados...`;
        outputArea.classList.add('hidden');

        try {
            const brainData = await this.fetchBrainData();
            // Prompt focado em analisar o histórico acumulado
            const prompt = `
                ATUE COMO: Orientador Sênior Kumon.
                TAREFA: Analisar o histórico de tarefas (Performance Log) para preparar a reunião com os pais.
                
                DADOS DO ALUNO:
                Nome: ${student.name}
                Estágios Atuais: Mat: ${student.mathStage}, Port: ${student.portStage}
                
                HISTÓRICO RECENTE (Folha de Registro + Tarefas):
                ${JSON.stringify((student.performanceLog || []).slice(-20))}
                
                METAS DA UNIDADE:
                ${JSON.stringify(brainData.metas_gerais || "Focar em autodidatismo e rotina.")}
                
                GERE UM RESUMO ESTRATÉGICO (TEXTO PURO, CURTO E DIRETO) CONTENDO:
                1. Onde ele está indo bem? (Fluência, acertos).
                2. Onde há pontos de atenção? (Tempo alto, muitas repetições, estágio difícil).
                3. Sugestão para a próxima programação (Avançar ou Repetir?).
                4. Tópico chave para falar com os pais agora.
            `;

            const analysisText = await this.callGeminiAPI(prompt, "Analise a trajetória deste aluno baseada nos dados.");
            
            outputContent.textContent = analysisText;
            outputArea.classList.remove('hidden');

            if (!student.meetingHistory) student.meetingHistory = [];
            student.meetingHistory.push({
                meta: { date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS" },
                resumo_executivo: analysisText
            });
            await this.setData('alunos/lista_alunos', { students: this.state.students });

        } catch (err) {
            alert("Erro na análise: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class='bx bx-brain'></i> Gerar Análise de Trajetória (Pré-Reunião)`;
        }
    },

    // =====================================================================
    // ================== FUNÇÕES PADRÃO (CRUD / UI) =======================
    // =====================================================================

    handleFileUpload() {
        const file = this.elements.audioUpload.files[0];
        const studentSelected = this.elements.meetingStudentSelect.value;
        if (file) { this.state.audioFile = file; this.elements.audioFileName.textContent = file.name; } 
        else { this.state.audioFile = null; this.elements.audioFileName.textContent = ''; }
        this.elements.transcribeAudioBtn.disabled = !(this.state.audioFile && studentSelected);
    },

    async transcribeAudioGemini() {
        this.elements.transcriptionOutput.value = 'Processando áudio...';
        this.elements.transcriptionModule.classList.remove('hidden');
        try {
            const b64 = await this.imageToBase64(this.state.audioFile); 
            const text = await this.callGeminiAPI("Transcreva este áudio.", "Transcreva:", b64); 
            this.elements.transcriptionOutput.value = text;
        } catch (e) { this.elements.transcriptionOutput.value = "Erro: " + e.message; }
    },

    async analyzeTranscriptionGemini() {
        const text = this.elements.transcriptionOutput.value;
        const notes = this.elements.additionalNotes.value;
        const s = this.state.students[this.elements.meetingStudentSelect.value];
        
        this.elements.reportSection.classList.remove('hidden');
        this.elements.reportContent.textContent = "Gerando relatório...";
        
        const prompt = `Analise esta reunião de pais do Kumon.\nTexto: ${text}\nNotas: ${notes}\nAluno: ${JSON.stringify(s)}`;
        try {
            const jsonStr = await this.callGeminiAPI("Gere um JSON com: resumo, plano_acao e diagnostico.", prompt);
            const json = JSON.parse(jsonStr);
            this.renderReport(json);
            if(!s.meetingHistory) s.meetingHistory = [];
            s.meetingHistory.push(json);
            await this.setData('alunos/lista_alunos', { students: this.state.students });
        } catch (e) { this.elements.reportContent.textContent = "Erro: " + e.message; }
    },

    renderReport(data) { this.elements.reportContent.textContent = JSON.stringify(data, null, 2); },
    downloadReport() { 
        const blob = new Blob([this.elements.reportContent.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'report.json'; a.click();
    },

    async saveStudent() {
        const id = this.elements.studentIdInput.value || Date.now().toString();
        const s = this.state.students[id] || {};
        const newData = { 
            ...s, 
            name: document.getElementById('studentName').value, 
            responsible: document.getElementById('studentResponsible').value, 
            contact: document.getElementById('studentContact').value, 
            mathStage: document.getElementById('mathStage').value, 
            portStage: document.getElementById('portStage').value, 
            engStage: document.getElementById('engStage').value, 
            updatedAt: new Date().toISOString() 
        };
        this.state.students[id] = newData;
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); 
        this.openStudentModal(id); 
        await this.updateBrainFromStudents(); 
        alert('Salvo!');
    },

    async deleteStudent() {
        if(!confirm('Excluir?')) return;
        delete this.state.students[this.state.currentStudentId];
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents(); 
        this.closeStudentModal();
    },

    async addHistoryEntry(e, type, form) {
        e.preventDefault();
        if (!this.state.currentStudentId) return;
        const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() };
        
        Array.from(form.elements).forEach(el => {
            if(el.id && !el.id.includes('File')) entry[el.id.replace('programming','').replace('report','').replace('performance','').toLowerCase()] = el.value;
        });
        
        if(type === 'performanceLog') {
             entry.date = document.getElementById('performanceDate').value;
             entry.block = document.getElementById('performanceBlock').value;
             entry.timeTaken = document.getElementById('performanceTimeTaken').value;
             entry.timeGoal = document.getElementById('performanceTimeGoal').value;
             entry.gradeKumon = document.getElementById('performanceGradeKumon').value;
             entry.subject = document.getElementById('performanceSubject').value;
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s[type]) s[type] = [];
        s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        form.reset();
    },

    loadStudents() {
        const list = Object.entries(this.state.students);
        this.elements.studentList.innerHTML = list.map(([id, s]) => `
            <div class="student-card" onclick="App.openStudentModal('${id}')">
                <h3>${s.name}</h3><p>${s.responsible}</p>
                <small>Mat: ${s.mathStage || '-'} | Port: ${s.portStage || '-'}</small>
            </div>`).join('');
        
        const select = this.elements.meetingStudentSelect;
        select.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        list.forEach(([id, s]) => select.innerHTML += `<option value="${id}">${s.name}</option>`);
    },

    renderStudentList() { this.loadStudents(); },

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
            this.loadStudentHistories(id);
            
            this.elements.trajectoryInsightArea.classList.add('hidden');
            this.elements.trajectoryContent.textContent = "";
        }
        this.switchTab('performance');
    },
    
    closeStudentModal() { this.elements.studentModal.classList.add('hidden'); this.state.currentStudentId = null; },

    loadStudentHistories(id) {
        if(!id) return;
        const s = this.state.students[id];
        this.renderHistory('performanceLog', s.performanceLog || []);
        this.renderHistory('programmingHistory', s.programmingHistory || []);
        this.renderHistory('reportHistory', s.reportHistory || []);
    },

    renderHistory(type, data) {
        const container = this.elements[type === 'performanceLog' ? 'performanceHistory' : type]; 
        if (!data || !data.length) { container.innerHTML = '<p class="text-gray-500">Vazio.</p>'; return; }
        
        container.innerHTML = data.sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt)).map(e => {
            if (type === 'performanceLog') {
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
            return `<div class="history-item">${JSON.stringify(e)}</div>`; 
        }).join('');
    },

    async deleteHistoryEntry(type, id) {
        if(!confirm('Apagar?')) return;
        const s = this.state.students[this.state.currentStudentId];
        s[type] = s[type].filter(x => x.id !== id);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
    },

    switchTab(t) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${t}"]`).classList.add('active');
        document.getElementById(`tab-${t}`).classList.add('active');
    },

    getNodeRef(path) { return this.state.db.ref(`gestores/${this.state.userId}/${path}`); },
    async fetchData(path) { const s = await this.getNodeRef(path).get(); return s.exists() ? s.val() : null; },
    async setData(path, d) { await this.getNodeRef(path).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async updateBrainFromStudents() { 
        let brain = await this.fetchBrainData();
        if (!brain.alunos) brain.alunos = {};
        Object.keys(brain.alunos).forEach(bid => { if (!this.state.students[bid]) delete brain.alunos[bid]; });
        for (const [id, s] of Object.entries(this.state.students)) {
            brain.alunos[id] = {
                id: id,
                nome: s.name,
                responsavel: s.responsible,
                estagio_matematica: s.mathStage,
                historico_desempenho: s.performanceLog || [],
                metas: brain.alunos[id]?.metas || {},
            };
        }
        await this.saveBrainData(brain);
    },
    async saveBrainData(d) { await this.setData('brain', d); }
};
