// App.js - Plataforma Kumon V7.0
// CÓDIGO COMPLETO: Dashboard, IA Híbrida, Sync Brain e Gestão de Alunos
// Nenhuma linha omitida.

const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null,
        audioFile: null,
        charts: {},
        geminiModel: "gemini-2.5-flash-preview-09-2025"
    },
    elements: {},

    // =====================================================================
    // INICIALIZAÇÃO
    // =====================================================================
    init(user, databaseInstance) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.state.userId = user.uid;
        this.state.db = databaseInstance;
        document.getElementById('userEmail').textContent = user.email;
        
        this.mapDOMElements();
        this.addEventListeners();
        this.loadStudents(); // Inicia carregamento real do Firebase
    },

    mapDOMElements() {
        // Mapeamento explícito de todos os elementos do DOM
        this.elements.logoutButton = document.getElementById('logout-button');
        this.elements.systemOptionsBtn = document.getElementById('system-options-btn');
        this.elements.dashboardBtn = document.getElementById('dashboard-btn');
        
        this.elements.dashboardModal = document.getElementById('dashboardModal');
        this.elements.closeDashboardBtn = document.getElementById('closeDashboardBtn');
        
        this.elements.kpiTotalStudents = document.getElementById('kpi-total-students');
        this.elements.kpiTotalSubjects = document.getElementById('kpi-total-subjects');
        this.elements.kpiMultiSubject = document.getElementById('kpi-multi-subject');
        this.elements.kpiRiskCount = document.getElementById('kpi-risk-count');
        this.elements.riskList = document.getElementById('riskList');
        this.elements.starList = document.getElementById('starList');

        this.elements.meetingDate = document.getElementById('meetingDate');
        this.elements.meetingStudentSelect = document.getElementById('meetingStudentSelect');
        this.elements.audioUpload = document.getElementById('audioUpload');
        this.elements.audioFileName = document.getElementById('audioFileName');
        this.elements.additionalNotes = document.getElementById('additionalNotes');
        this.elements.transcribeAudioBtn = document.getElementById('transcribeAudioBtn');
        this.elements.transcriptionModule = document.getElementById('transcriptionModule');
        this.elements.transcriptionOutput = document.getElementById('transcriptionOutput');
        this.elements.analyzeTranscriptionBtn = document.getElementById('analyzeTranscriptionBtn');
        this.elements.reportSection = document.getElementById('reportSection');
        this.elements.reportContent = document.getElementById('reportContent');
        this.elements.downloadReportBtn = document.getElementById('downloadReportBtn');

        this.elements.addStudentBtn = document.getElementById('addStudentBtn');
        this.elements.studentSearch = document.getElementById('studentSearch');
        this.elements.studentList = document.getElementById('student-list');
        
        this.elements.studentModal = document.getElementById('studentModal');
        this.elements.modalTitle = document.getElementById('modalTitle');
        this.elements.closeModalBtn = document.getElementById('closeModalBtn');
        this.elements.studentForm = document.getElementById('studentForm');
        this.elements.studentIdInput = document.getElementById('studentId');
        this.elements.saveStudentBtn = document.getElementById('saveStudentBtn');
        this.elements.deleteStudentBtn = document.getElementById('deleteStudentBtn');

        this.elements.programmingForm = document.getElementById('programmingForm');
        this.elements.reportForm = document.getElementById('reportForm');
        this.elements.performanceForm = document.getElementById('performanceForm');
        
        this.elements.programmingHistory = document.getElementById('programmingHistory');
        this.elements.reportHistory = document.getElementById('reportHistory');
        this.elements.performanceLog = document.getElementById('performanceHistory');
        this.elements.studentAnalysisContent = document.getElementById('student-analysis-content');
        this.elements.meetingHistoryList = document.getElementById('meetingHistoryList');

        this.elements.filterProgramming = document.getElementById('filterProgramming');
        this.elements.filterReports = document.getElementById('filterReports');
        this.elements.filterPerformance = document.getElementById('filterPerformance');

        this.elements.brainModal = document.getElementById('brainModal');
        this.elements.closeBrainModalBtn = document.getElementById('closeBrainModalBtn');
        this.elements.brainFileUploadModal = document.getElementById('brainFileUploadModal');
        this.elements.uploadBrainFileBtnModal = document.getElementById('uploadBrainFileBtnModal');

        this.elements.taskAnalysisModal = document.getElementById('taskAnalysisModal');
        this.elements.closeTaskAnalysisModalBtn = document.getElementById('closeTaskAnalysisModalBtn');
        this.elements.taskAnalysisForm = document.getElementById('taskAnalysisForm');
        this.elements.taskFilesInput = document.getElementById('taskFilesInput');
        this.elements.startTaskAnalysisBtn = document.getElementById('startTaskAnalysisBtn');
        this.elements.taskAnalysisStatusContainer = document.getElementById('taskAnalysisStatusContainer');
        this.elements.taskAnalysisProgressBar = document.getElementById('taskAnalysisProgressBar');
        this.elements.taskAnalysisStatus = document.getElementById('taskAnalysisStatus');
        this.elements.openTaskAnalysisBtn = document.getElementById('openTaskAnalysisBtn');
        
        this.elements.generateTrajectoryBtn = document.getElementById('generateTrajectoryBtn');
        this.elements.trajectoryInsightArea = document.getElementById('trajectoryInsightArea');
        this.elements.trajectoryContent = document.getElementById('trajectoryContent');
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
        this.elements.downloadReportBtn.addEventListener('click', () => this.downloadReport());

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

        this.elements.uploadBrainFileBtnModal.addEventListener('click', () => this.handleBrainFileUpload());
        this.elements.closeBrainModalBtn.addEventListener('click', () => this.closeBrainModal());

        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // CARREGAMENTO DE DADOS (FIREBASE)
    // =====================================================================
    async loadStudents() {
        try {
            const data = await this.fetchData('alunos/lista_alunos');
            this.state.students = (data && data.students) ? data.students : {};
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData(); 
        } catch (e) {
            console.error("Erro ao carregar alunos:", e);
            alert("Erro de conexão. Verifique sua internet.");
        }
    },

    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        const list = Object.entries(this.state.students)
            .filter(([,s]) => {
                const n = (s.name || '').toLowerCase();
                const r = (s.responsible || '').toLowerCase();
                return n.includes(term) || r.includes(term);
            })
            .sort((a,b) => (a[1].name || '').localeCompare(b[1].name || ''));

        if (list.length === 0) {
            this.elements.studentList.innerHTML = '<div class="empty-state"><p>Nenhum aluno encontrado.</p></div>';
            return;
        }

        this.elements.studentList.innerHTML = list.map(([id, s]) => `
            <div class="student-card" onclick="App.openStudentModal('${id}')">
                <div class="student-card-header">
                    <div>
                        <h3 class="student-name">${s.name}</h3>
                        <p class="student-responsible">${s.responsible || 'Sem responsável'}</p>
                    </div>
                </div>
                <div class="student-stages">
                    ${s.mathStage ? `<span class="stage-item" style="border-left:4px solid #0078c1; padding-left: 8px;">Mat: ${s.mathStage}</span>` : ''}
                    ${s.portStage ? `<span class="stage-item" style="border-left:4px solid #d62828; padding-left: 8px;">Port: ${s.portStage}</span>` : ''}
                    ${s.engStage ? `<span class="stage-item" style="border-left:4px solid #f59e0b; padding-left: 8px;">Ing: ${s.engStage}</span>` : ''}
                </div>
            </div>
        `).join('');
    },

    populateMeetingStudentSelect() {
        const sel = this.elements.meetingStudentSelect;
        sel.innerHTML = '<option value="" disabled selected>Selecione um aluno...</option>';
        Object.entries(this.state.students)
            .sort((a,b) => (a[1].name || '').localeCompare(b[1].name || ''))
            .forEach(([id, s]) => {
                const op = document.createElement('option');
                op.value = id;
                op.textContent = s.name;
                sel.appendChild(op);
            });
    },

    // =====================================================================
    // DASHBOARD E KPIs
    // =====================================================================
    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.generateDashboardData();
    },

    closeDashboard() {
        this.elements.dashboardModal.classList.add('hidden');
    },

    generateDashboardData() {
        const students = Object.values(this.state.students);
        
        let totalEnrollments = 0;
        let multiSubjectCount = 0;
        let riskCount = 0;
        
        const subjectsCount = { 'Matemática': 0, 'Português': 0, 'Inglês': 0 };
        const stagesCount = { 'Math': {}, 'Port': {}, 'Eng': {} };
        
        const riskStudents = [];
        const starStudents = [];

        students.forEach(s => {
            let studentSubCount = 0;
            
            if(s.mathStage) { 
                studentSubCount++; 
                subjectsCount['Matemática']++; 
                const letter = s.mathStage.trim().charAt(0).toUpperCase();
                stagesCount.Math[letter] = (stagesCount.Math[letter] || 0) + 1;
            }
            if(s.portStage) { 
                studentSubCount++; 
                subjectsCount['Português']++; 
                const letter = s.portStage.trim().charAt(0).toUpperCase();
                stagesCount.Port[letter] = (stagesCount.Port[letter] || 0) + 1;
            }
            if(s.engStage) { 
                studentSubCount++; 
                subjectsCount['Inglês']++; 
                const letter = s.engStage.trim().charAt(0).toUpperCase();
                stagesCount.Eng[letter] = (stagesCount.Eng[letter] || 0) + 1;
            }
            
            totalEnrollments += studentSubCount;
            if(studentSubCount > 1) multiSubjectCount++;

            // Classificação de Risco (Lógica simples baseada no último registro do boletim)
            const lastLog = s.performanceLog && s.performanceLog.length > 0 ? s.performanceLog[s.performanceLog.length - 1] : null;
            
            if (lastLog) {
                if (lastLog.gradeKumon.includes('<') || lastLog.gradeKumon.includes('Rep') || lastLog.gradeKumon.includes('ALERTA')) {
                    riskStudents.push(s);
                    riskCount++;
                } else if (lastLog.gradeKumon.includes('100') || lastLog.gradeKumon.includes('ELOGIO')) {
                    starStudents.push(s);
                }
            }
        });

        // Atualiza números na tela
        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalEnrollments;
        this.elements.kpiMultiSubject.textContent = multiSubjectCount;
        this.elements.kpiRiskCount.textContent = riskCount;

        // Renderiza listas laterais
        this.renderDashboardList(this.elements.riskList, riskStudents, '⚠️');
        this.renderDashboardList(this.elements.starList, starStudents, '⭐');

        // Renderiza Gráficos
        this.renderCharts(stagesCount, subjectsCount, { risk: riskCount, star: starStudents.length, total: students.length });
    },

    renderDashboardList(element, list, icon) {
        element.innerHTML = list.length ? '' : '<li style="color:#999;">Nenhum.</li>';
        list.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `${icon} <strong>${s.name}</strong>`;
            li.style.cursor = 'pointer';
            li.style.padding = '5px 0';
            li.style.borderBottom = '1px solid #eee';
            
            // Encontra ID para abrir modal ao clicar
            const id = Object.keys(this.state.students).find(key => this.state.students[key] === s);
            li.onclick = () => {
                this.closeDashboard();
                this.openStudentModal(id);
            };
            element.appendChild(li);
        });
    },

    renderCharts(stages, subjects, mood) {
        if (this.state.charts.stages) this.state.charts.stages.destroy();
        if (this.state.charts.subjects) this.state.charts.subjects.destroy();
        if (this.state.charts.mood) this.state.charts.mood.destroy();

        // Gráfico de Estágios
        const allLetters = [...new Set([...Object.keys(stages.Math), ...Object.keys(stages.Port), ...Object.keys(stages.Eng)])].sort();
        
        const ctx1 = document.getElementById('stagesChart').getContext('2d');
        this.state.charts.stages = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: allLetters,
                datasets: [
                    { label: 'Mat', data: allLetters.map(l => stages.Math[l] || 0), backgroundColor: '#0078c1' },
                    { label: 'Port', data: allLetters.map(l => stages.Port[l] || 0), backgroundColor: '#d62828' },
                    { label: 'Ing', data: allLetters.map(l => stages.Eng[l] || 0), backgroundColor: '#f59e0b' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Gráfico de Matérias
        const ctx2 = document.getElementById('subjectsChart').getContext('2d');
        this.state.charts.subjects = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: Object.keys(subjects),
                datasets: [{
                    data: Object.values(subjects),
                    backgroundColor: ['#0078c1', '#d62828', '#f59e0b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Gráfico de Humor/Status
        const ctx3 = document.getElementById('moodChart').getContext('2d');
        this.state.charts.mood = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['Atenção', 'Destaque', 'Normal'],
                datasets: [{
                    data: [mood.risk, mood.star, mood.total - mood.risk - mood.star],
                    backgroundColor: ['#d62828', '#28a745', '#e0e0e0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // =====================================================================
    // MODAL DE ALUNO E HISTÓRICOS
    // =====================================================================
    openStudentModal(id) {
        this.state.currentStudentId = id;
        this.elements.studentModal.classList.remove('hidden');
        const s = id ? this.state.students[id] : {};
        this.elements.studentForm.reset();

        if(id) {
            this.elements.modalTitle.innerText = s.name;
            document.getElementById('studentName').value = s.name || '';
            document.getElementById('studentResponsible').value = s.responsible || '';
            document.getElementById('studentContact').value = s.contact || '';
            document.getElementById('mathStage').value = s.mathStage || '';
            document.getElementById('portStage').value = s.portStage || '';
            document.getElementById('engStage').value = s.engStage || '';
            this.elements.studentIdInput.value = id;
            this.elements.deleteStudentBtn.style.display = 'block';
            
            this.loadStudentHistories(id);
            this.elements.trajectoryInsightArea.classList.add('hidden');
            this.elements.trajectoryContent.textContent = "";
        } else {
            this.elements.modalTitle.innerText = "Novo Aluno";
            this.elements.deleteStudentBtn.style.display = 'none';
            this.elements.meetingHistoryList.innerHTML = "<p>Salve o aluno primeiro.</p>";
        }
        this.switchTab('performance');
    },

    closeStudentModal() {
        this.elements.studentModal.classList.add('hidden');
        this.state.currentStudentId = null;
    },

    loadStudentHistories(id) {
        if(!id) return;
        const s = this.state.students[id];
        
        const filterProg = this.elements.filterProgramming.value;
        const filterRep = this.elements.filterReports.value;
        const filterPerf = this.elements.filterPerformance.value;

        this.renderHistory('performanceLog', s.performanceLog || [], filterPerf);
        this.renderHistory('programmingHistory', s.programmingHistory || [], filterProg);
        this.renderHistory('reportHistory', s.reportHistory || [], filterRep);
        
        // Renderiza a Lista de Reuniões (Histórico IA)
        this.renderMeetingHistoryList(s.meetingHistory || []);
    },

    renderMeetingHistoryList(history) {
        const container = this.elements.meetingHistoryList;
        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Nenhuma análise registrada.</p>';
            return;
        }

        container.innerHTML = history.map((h) => {
            // Tenta extrair a data de diferentes formatos possíveis
            let dateStr = "Data desconhecida";
            if (h.meta && h.meta.date) dateStr = new Date(h.meta.date).toLocaleDateString();
            else if (h.date) dateStr = h.date;

            const type = (h.meta && h.meta.type === "PRE_MEETING_ANALYSIS") ? "Análise Trajetória (Dados)" : "Reunião (Áudio)";
            const summary = h.resumo_executivo || "Sem resumo disponível.";
            
            return `
            <div class="meeting-card">
                <div class="meeting-header">
                    <span>${dateStr}</span>
                    <span class="meeting-type">${type}</span>
                </div>
                <div class="meeting-summary">${summary}</div>
            </div>`;
        }).reverse().join('');
    },

    renderHistory(type, data, filter = 'all') {
        // Mapeia o nome do dado no JSON para o elemento DOM correto
        const container = this.elements[type === 'performanceLog' ? 'performanceHistory' : type];
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
            return;
        }

        const filteredData = data.filter(e => filter === 'all' || e.subject === filter);

        if (filteredData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Nada encontrado neste filtro.</p>';
            return;
        }

        container.innerHTML = filteredData.sort((a,b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).map(e => {
            if (type === 'performanceLog') {
                // Layout do Boletim Kumon
                const isAlert = e.gradeKumon && (e.gradeKumon.includes('<') || e.gradeKumon.includes('Rep'));
                return `
                <div class="history-item" style="${isAlert ? 'border-left: 4px solid #d62828;' : 'border-left: 4px solid #28a745;'}">
                    <div class="history-item-header">
                        <strong>${e.date}</strong>
                        <span class="subject-badge subject-${e.subject}">${e.subject}</span>
                    </div>
                    <div style="font-family: monospace; font-size: 1.1em; margin-top: 5px;">
                        ${e.block} | ${e.timeTaken}min ${e.timeGoal ? '/ '+e.timeGoal+'min' : ''} | 
                        <span style="font-weight:bold;">${e.gradeKumon}</span>
                    </div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            } else {
                // Layout Genérico (Programação e Boletim Escolar)
                return `
                <div class="history-item">
                    <div class="history-item-header">
                        <strong>${e.date || 'Data?'}</strong>
                        ${e.subject ? `<span class="subject-badge subject-${e.subject}">${e.subject}</span>` : ''}
                    </div>
                    <div>
                        ${type === 'programmingHistory' 
                            ? `<strong>${e.material}</strong><br><span class="text-sm">${e.notes||''}</span>` 
                            : `Nota: <strong>${e.grade}</strong> ${e.fileurl ? '[Anexo]' : ''}`}
                    </div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            }
        }).join('');
    },

    // =====================================================================
    // LÓGICA DE IA HÍBRIDA (SCANNER)
    // =====================================================================
    openTaskAnalysisModal() {
        this.elements.taskAnalysisForm.reset();
        this.elements.taskAnalysisStatusContainer.classList.add('hidden');
        this.elements.taskAnalysisProgressBar.style.width = '0%';
        this.elements.taskAnalysisModal.classList.remove('hidden');
    },

    closeTaskAnalysisModal() {
        this.elements.taskAnalysisModal.classList.add('hidden');
    },

    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        const files = this.elements.taskFilesInput.files;
        if (!files.length || !this.state.currentStudentId) return alert("Erro: Selecione imagens e abra um aluno.");

        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        const prompt = `
            VOCÊ É UM ESPECIALISTA EM KUMON. ANALISE AS IMAGENS E EXTRAIA DADOS.
            
            TIPO 1: TABELA/BOLETIM (Várias linhas). Extraia todas.
            TIPO 2: TAREFA ÚNICA (Círculo grande ou nota). Extraia apenas ela.

            RETORNE APENAS JSON (ARRAY):
            [
              {
                "date": "YYYY-MM-DD" (Se não houver data, use "TODAY"),
                "stage": "Ex: 2A",
                "sheet": "Ex: 100",
                "timeTaken": "10", (Apenas número, ou null)
                "gradeKumon": "100%" (ou "80-99%", "<80%")
              }
            ]
        `;

        let newEntries = [];

        for(let i=0; i<files.length; i++) {
            this.elements.taskAnalysisStatus.textContent = `Analisando imagem ${i+1}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${Math.round(((i+1)/files.length)*100)}%`;
            
            try {
                const b64 = await this.imageToBase64(files[i]);
                const resultStr = await this.callGeminiAPI(prompt, "Extraia os dados.", b64);
                const resultJson = JSON.parse(resultStr);

                if (Array.isArray(resultJson)) {
                    resultJson.forEach(row => {
                        const date = (row.date === "TODAY" || !row.date) ? new Date().toISOString().split('T')[0] : row.date;
                        newEntries.push({
                            id: Date.now() + Math.random(),
                            createdAt: new Date().toISOString(),
                            date: date,
                            subject: 'Matemática', // Default, IA pode melhorar
                            block: `${row.stage || '?'} ${row.sheet || '?'}`,
                            timeTaken: row.timeTaken || '0',
                            gradeKumon: row.gradeKumon || '?'
                        });
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s.performanceLog) s.performanceLog = [];
        s.performanceLog.push(...newEntries);

        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        this.updateBrainFromStudents();
        
        this.elements.taskAnalysisStatus.textContent = "Sucesso!";
        setTimeout(() => this.closeTaskAnalysisModal(), 1500);
        this.elements.startTaskAnalysisBtn.disabled = false;
    },

    async generateTrajectoryAnalysis() {
        if (!this.state.currentStudentId) return;
        const btn = this.elements.generateTrajectoryBtn;
        const student = this.state.students[this.state.currentStudentId];

        btn.disabled = true;
        btn.innerHTML = "Analisando...";
        this.elements.trajectoryInsightArea.classList.add('hidden');

        try {
            const brainData = await this.fetchBrainData();
            const prompt = `
                ATUE COMO ORIENTADOR SÊNIOR KUMON.
                Analise o histórico do aluno: ${student.name}
                Estágios: Mat ${student.mathStage}, Port ${student.portStage}
                
                HISTÓRICO (Últimos 20 registros):
                ${JSON.stringify((student.performanceLog || []).slice(-20))}
                
                METAS UNIDADE:
                ${JSON.stringify(brainData.metas_gerais || "Foco em autodidatismo")}

                Crie um resumo curto e estratégico para o orientador falar com os pais.
                - Pontos fortes
                - Pontos de atenção (Tempo x Acertos)
                - Sugestão de avanço
            `;

            const text = await this.callGeminiAPI(prompt, "Analise a trajetória.");
            
            this.elements.trajectoryContent.textContent = text;
            this.elements.trajectoryInsightArea.classList.remove('hidden');

            if (!student.meetingHistory) student.meetingHistory = [];
            student.meetingHistory.push({
                meta: { date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS" },
                resumo_executivo: text
            });
            
            await this.setData('alunos/lista_alunos', { students: this.state.students });
            this.loadStudentHistories(this.state.currentStudentId);

        } catch (e) {
            alert("Erro: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = "<i class='bx bx-brain'></i> Análise Pré-Reunião";
        }
    },

    // =====================================================================
    // FUNÇÕES PADRÃO DE CRUD (SALVAR, EXCLUIR, HISTÓRICO)
    // =====================================================================
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
            engStage: document.getElementById('engStage').value,
            updatedAt: new Date().toISOString()
        };
        this.state.students[id] = updated;
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents();
        this.openStudentModal(id);
        this.updateBrainFromStudents();
        alert('Aluno salvo com sucesso!');
    },

    async deleteStudent() {
        if(!confirm('Tem certeza que deseja excluir este aluno?')) return;
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
            if (el.id && !el.id.includes('File')) {
                // Remove prefixos (performance, report, programming) para chave limpa
                const key = el.id.replace(/performance|report|programming/i, '').toLowerCase();
                // Ajuste para timeGoal, timeTaken ficarem camelCase
                const camelKey = el.id.includes('Time') ? el.id.replace('performance', '').replace(/^./, s => s.toLowerCase()) : key;
                entry[camelKey] = el.value;
            }
        });
        
        // Correção manual para garantir campos do PerformanceLog
        if(type === 'performanceLog') {
             entry.date = document.getElementById('performanceDate').value;
             entry.block = document.getElementById('performanceBlock').value;
             entry.timeTaken = document.getElementById('performanceTimeTaken').value;
             entry.timeGoal = document.getElementById('performanceTimeGoal').value;
             entry.gradeKumon = document.getElementById('performanceGradeKumon').value;
             entry.subject = document.getElementById('performanceSubject').value;
        }

        const s = this.state.students[this.state.currentStudentId];
        if(!s[type]) s[type] = [];
        s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        form.reset();
    },

    async deleteHistoryEntry(type, id) {
        if(!confirm('Apagar este registro?')) return;
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

    // =====================================================================
    // UTILITÁRIOS DE API E FIREBASE
    // =====================================================================
    getNodeRef(path) { 
        return this.state.db.ref(`gestores/${this.state.userId}/${path}`); 
    },
    async fetchData(path) { 
        const s = await this.getNodeRef(path).get(); 
        return s.exists() ? s.val() : null; 
    },
    async setData(path, data) { 
        await this.getNodeRef(path).set(data); 
    },
    async fetchBrainData() { 
        return (await this.fetchData('brain')) || {}; 
    },
    async saveBrainData(d) { 
        await this.setData('brain', d); 
    },

    async updateBrainFromStudents() {
        let brain = await this.fetchBrainData();
        if (!brain.alunos) brain.alunos = {};
        
        // Remove alunos deletados do Brain
        Object.keys(brain.alunos).forEach(bid => { 
            if (!this.state.students[bid]) delete brain.alunos[bid]; 
        });

        // Atualiza/Cria
        for (const [id, s] of Object.entries(this.state.students)) {
            brain.alunos[id] = {
                id: id,
                nome: s.name,
                responsavel: s.responsible,
                estagio_matematica: s.mathStage,
                estagio_portugues: s.portStage,
                estagio_ingles: s.engStage,
                historico_desempenho: s.performanceLog || [],
                metas: brain.alunos[id]?.metas || {},
            };
        }
        await this.saveBrainData(brain);
        console.log("Sync Brain OK");
    },

    // Admin
    promptForReset() { 
        if(prompt('Senha Admin') === '*177') this.elements.brainModal.classList.remove('hidden'); 
    },
    closeBrainModal() { 
        this.elements.brainModal.classList.add('hidden'); 
    },
    async handleBrainFileUpload() {
        const file = this.elements.brainFileUploadModal.files[0];
        if (!file) return alert('Selecione um JSON.');
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            const current = await this.fetchBrainData();
            await this.saveBrainData({ ...current, ...json });
            alert('Cérebro atualizado!');
            this.closeBrainModal();
        } catch(e) { alert('Erro JSON: ' + e.message); }
    },

    // Gemini API Helper
    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async callGeminiAPI(systemPrompt, userPrompt, imageBase64 = null) {
        if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE")) throw new Error("Configure a API Key.");

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
        
        // Se for análise de trajetória (texto livre), remove a restrição JSON
        if (userPrompt.includes("Analise a trajetória")) delete payload.generationConfig;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message);
        }
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    },
    
    // Audio Legacy Support (Mantido para compatibilidade)
    handleFileUpload() {
        const file = this.elements.audioUpload.files[0];
        if(file) { this.state.audioFile = file; this.elements.audioFileName.textContent = file.name; this.elements.transcribeAudioBtn.disabled = false; }
    },
    async transcribeAudioGemini() {
        this.elements.transcriptionOutput.value = "Processando...";
        this.elements.transcriptionModule.classList.remove('hidden');
        try {
            const b64 = await this.imageToBase64(this.state.audioFile);
            const text = await this.callGeminiAPI("Transcreva este áudio.", "Transcreva.", b64);
            this.elements.transcriptionOutput.value = text;
        } catch(e) { this.elements.transcriptionOutput.value = "Erro: " + e.message; }
    },
    async analyzeTranscriptionGemini() {
        const text = this.elements.transcriptionOutput.value;
        if(!text) return alert("Sem texto.");
        const s = this.state.students[this.elements.meetingStudentSelect.value];
        
        this.elements.reportSection.classList.remove('hidden');
        this.elements.reportContent.textContent = "Analisando...";

        const prompt = `Analise esta reunião. Texto: ${text}. Aluno: ${s.name}`;
        try {
            const jsonStr = await this.callGeminiAPI("Gere JSON: {resumo_executivo, plano_acao}", prompt);
            const json = JSON.parse(jsonStr);
            this.elements.reportContent.textContent = JSON.stringify(json, null, 2);
            
            if(!s.meetingHistory) s.meetingHistory = [];
            s.meetingHistory.push(json);
            await this.setData('alunos/lista_alunos', { students: this.state.students });
        } catch(e) { this.elements.reportContent.textContent = "Erro: " + e.message; }
    },
    downloadReport() {
        const blob = new Blob([this.elements.reportContent.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'report.json'; a.click();
    }
};
