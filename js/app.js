// App.js - Plataforma Kumon V10.0 (GOLD MASTER)
// Desenvolvido por: Thiaguinho Soluções
// Status: 100% Completo | Sem Abreviações | Deep Merge no Brain | Correção de Carga

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
    // 1. INICIALIZAÇÃO E SETUP
    // =====================================================================
    init(user, databaseInstance) {
        // Remove tela de login e mostra app
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Configura estado inicial
        this.state.userId = user.uid;
        this.state.db = databaseInstance; 
        document.getElementById('userEmail').textContent = user.email;
        
        // Mapeia elementos e eventos
        this.mapDOMElements();
        this.addEventListeners();
        
        // INICIA O CARREGAMENTO DOS DADOS DO FIREBASE
        this.loadStudents();
    },

    mapDOMElements() {
        // Mapeamento completo de todos os IDs utilizados no HTML
        this.elements.logoutButton = document.getElementById('logout-button');
        this.elements.systemOptionsBtn = document.getElementById('system-options-btn');
        this.elements.dashboardBtn = document.getElementById('dashboard-btn');
        
        this.elements.dashboardModal = document.getElementById('dashboardModal');
        this.elements.closeDashboardBtn = document.getElementById('closeDashboardBtn');
        
        // KPIs e Dashboard
        this.elements.kpiTotalStudents = document.getElementById('kpi-total-students');
        this.elements.kpiTotalSubjects = document.getElementById('kpi-total-subjects');
        this.elements.kpiMultiSubject = document.getElementById('kpi-multi-subject');
        this.elements.kpiRiskCount = document.getElementById('kpi-risk-count');
        this.elements.riskList = document.getElementById('riskList');
        this.elements.starList = document.getElementById('starList');

        // Módulo Reunião (Áudio Legacy)
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
        
        // Gestão de Alunos
        this.elements.addStudentBtn = document.getElementById('addStudentBtn');
        this.elements.studentSearch = document.getElementById('studentSearch');
        this.elements.studentList = document.getElementById('student-list');
        
        // Modal Aluno
        this.elements.studentModal = document.getElementById('studentModal');
        this.elements.modalTitle = document.getElementById('modalTitle');
        this.elements.closeModalBtn = document.getElementById('closeModalBtn');
        this.elements.studentForm = document.getElementById('studentForm');
        this.elements.studentIdInput = document.getElementById('studentId');
        this.elements.saveStudentBtn = document.getElementById('saveStudentBtn');
        this.elements.deleteStudentBtn = document.getElementById('deleteStudentBtn');
        
        // Formulários Internos
        this.elements.programmingForm = document.getElementById('programmingForm');
        this.elements.reportForm = document.getElementById('reportForm');
        this.elements.performanceForm = document.getElementById('performanceForm'); 
        
        // Históricos
        this.elements.programmingHistory = document.getElementById('programmingHistory');
        this.elements.reportHistory = document.getElementById('reportHistory');
        this.elements.performanceLog = document.getElementById('performanceHistory');
        this.elements.meetingHistoryList = document.getElementById('meetingHistoryList');
        this.elements.studentAnalysisContent = document.getElementById('student-analysis-content');

        // Filtros
        this.elements.filterProgramming = document.getElementById('filterProgramming');
        this.elements.filterReports = document.getElementById('filterReports');
        this.elements.filterPerformance = document.getElementById('filterPerformance');

        // Admin Brain
        this.elements.brainModal = document.getElementById('brainModal');
        this.elements.closeBrainModalBtn = document.getElementById('closeBrainModalBtn');
        this.elements.brainFileUploadModal = document.getElementById('brainFileUploadModal');
        this.elements.uploadBrainFileBtnModal = document.getElementById('uploadBrainFileBtnModal');
        
        // IA Scanner (V5/V6)
        this.elements.taskAnalysisModal = document.getElementById('taskAnalysisModal');
        this.elements.closeTaskAnalysisModalBtn = document.getElementById('closeTaskAnalysisModalBtn');
        this.elements.taskAnalysisForm = document.getElementById('taskAnalysisForm');
        this.elements.taskFilesInput = document.getElementById('taskFilesInput');
        this.elements.startTaskAnalysisBtn = document.getElementById('startTaskAnalysisBtn');
        this.elements.taskAnalysisStatusContainer = document.getElementById('taskAnalysisStatusContainer');
        this.elements.taskAnalysisProgressBar = document.getElementById('taskAnalysisProgressBar');
        this.elements.taskAnalysisStatus = document.getElementById('taskAnalysisStatus');
        this.elements.openTaskAnalysisBtn = document.getElementById('openTaskAnalysisBtn');
        
        // IA Trajetória (V6)
        this.elements.generateTrajectoryBtn = document.getElementById('generateTrajectoryBtn');
        this.elements.trajectoryInsightArea = document.getElementById('trajectoryInsightArea');
        this.elements.trajectoryContent = document.getElementById('trajectoryContent');
    },

    addEventListeners() {
        // Navegação e Sistema
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.systemOptionsBtn.addEventListener('click', () => this.promptForReset());
        this.elements.dashboardBtn.addEventListener('click', () => this.openDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.closeDashboard());
        this.elements.dashboardModal.addEventListener('click', (e) => { if (e.target === this.elements.dashboardModal) this.closeDashboard(); });

        // Áudio Legacy
        this.elements.audioUpload.addEventListener('change', () => this.handleFileUpload());
        this.elements.meetingStudentSelect.addEventListener('change', () => this.handleFileUpload());
        this.elements.transcribeAudioBtn.addEventListener('click', () => this.transcribeAudioGemini()); 
        this.elements.analyzeTranscriptionBtn.addEventListener('click', () => this.analyzeTranscriptionGemini()); 
        this.elements.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        
        // Admin Upload
        this.elements.uploadBrainFileBtnModal.addEventListener('click', () => this.handleBrainFileUpload());
        this.elements.closeBrainModalBtn.addEventListener('click', () => this.closeBrainModal());
        
        // Alunos CRUD
        this.elements.addStudentBtn.addEventListener('click', () => this.openStudentModal());
        this.elements.studentSearch.addEventListener('input', () => this.renderStudentList());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeStudentModal());
        this.elements.saveStudentBtn.addEventListener('click', () => this.saveStudent());
        this.elements.deleteStudentBtn.addEventListener('click', () => this.deleteStudent());
        
        // Abas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab)));
        
        // Submissão de Forms
        this.elements.programmingForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', this.elements.programmingForm));
        this.elements.reportForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', this.elements.reportForm));
        this.elements.performanceForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', this.elements.performanceForm)); 
        
        // Filtros
        this.elements.filterProgramming.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterReports.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterPerformance.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));

        // Fechar modal ao clicar fora
        this.elements.studentModal.addEventListener('click', (e) => { if (e.target === this.elements.studentModal) this.closeStudentModal(); });

        // IA Scanner e Trajetória Listeners
        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // 2. CARREGAMENTO E VISUALIZAÇÃO DE ALUNOS (CORRIGIDO)
    // =====================================================================
    async loadStudents() {
        try {
            console.log("Iniciando carregamento de alunos...");
            const data = await this.fetchData('alunos/lista_alunos');
            
            // Garante que students seja um objeto, mesmo se null
            this.state.students = (data && data.students) ? data.students : {};
            
            console.log(`Alunos carregados: ${Object.keys(this.state.students).length}`);
            
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData(); // Atualiza KPIs com dados novos
        } catch (e) {
            console.error("Erro crítico ao carregar alunos:", e);
            alert("Erro de conexão. Verifique sua internet.");
        }
    },

    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        
        const list = Object.entries(this.state.students)
            .filter(([, s]) => {
                const name = (s.name || '').toLowerCase();
                const resp = (s.responsible || '').toLowerCase();
                return name.includes(term) || resp.includes(term);
            })
            .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || ''));

        if (list.length === 0) {
            this.elements.studentList.innerHTML = `<div class="empty-state"><p>Nenhum aluno encontrado.</p></div>`;
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
            </div>`).join('');
    },

    populateMeetingStudentSelect() {
        const select = this.elements.meetingStudentSelect;
        select.innerHTML = '<option value="" disabled selected>Selecione um aluno...</option>';
        Object.entries(this.state.students)
            .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || ''))
            .forEach(([id, s]) => {
                const op = document.createElement('option');
                op.value = id;
                op.textContent = s.name;
                select.appendChild(op);
            });
    },

    // =====================================================================
    // 3. MODAL DO ALUNO E HISTÓRICOS
    // =====================================================================
    openStudentModal(id) {
        this.state.currentStudentId = id;
        this.elements.studentModal.classList.remove('hidden');
        const s = id ? this.state.students[id] : {};
        this.elements.studentForm.reset();
        
        if (id) {
            this.elements.modalTitle.textContent = s.name;
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
            this.elements.modalTitle.textContent = 'Novo Aluno';
            this.elements.deleteStudentBtn.style.display = 'none';
            this.elements.performanceLog.innerHTML = '';
        }
        this.switchTab('performance');
    },

    closeStudentModal() {
        this.elements.studentModal.classList.add('hidden');
        this.state.currentStudentId = null;
    },

    loadStudentHistories(id) {
        if (!id) return;
        const s = this.state.students[id];
        
        const filterProg = this.elements.filterProgramming.value;
        const filterRep = this.elements.filterReports.value;
        const filterPerf = this.elements.filterPerformance.value;

        this.renderHistory('performanceLog', s.performanceLog || [], filterPerf);
        this.renderHistory('programmingHistory', s.programmingHistory || [], filterProg);
        this.renderHistory('reportHistory', s.reportHistory || [], filterRep);
        this.renderMeetingHistoryList(s.meetingHistory || []);
    },

    renderMeetingHistoryList(history) {
        const container = this.elements.meetingHistoryList;
        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Nenhuma reunião ou análise registrada.</p>';
            return;
        }
        container.innerHTML = history.map((h) => {
            const dateStr = (h.meta && h.meta.date) ? new Date(h.meta.date).toLocaleDateString() : (h.date || 'Data N/A');
            const type = (h.meta && h.meta.type === "PRE_MEETING_ANALYSIS") ? "Análise Trajetória (Dados)" : "Reunião Gravada (Áudio)";
            const summary = h.resumo_executivo || "Sem resumo.";
            return `
            <div class="meeting-card">
                <div class="meeting-header"><span>${dateStr}</span><span class="meeting-type">${type}</span></div>
                <div class="meeting-summary">${summary}</div>
            </div>`;
        }).reverse().join('');
    },

    renderHistory(type, data, filter = 'all') {
        const container = this.elements[type === 'performanceLog' ? 'performanceHistory' : type];
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Sem registros.</p>';
            return;
        }

        const filteredData = data.filter(e => filter === 'all' || e.subject === filter);
        if (filteredData.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Nada neste filtro.</p>';
            return;
        }

        container.innerHTML = filteredData.sort((a,b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).map(e => {
            if (type === 'performanceLog') {
                // Layout Boletim Kumon
                const isAlert = e.gradeKumon && (e.gradeKumon.includes('<') || e.gradeKumon.includes('Rep') || e.gradeKumon.includes('ALERTA'));
                return `
                <div class="history-item" style="${isAlert ? 'border-left: 4px solid #d62828;' : 'border-left: 4px solid #28a745;'}">
                    <div class="history-item-header">
                        <strong>${e.date}</strong>
                        <span class="subject-badge subject-${e.subject}">${e.subject || 'Kumon'}</span>
                    </div>
                    <div style="margin-top:5px; font-size:1.1em;">
                        <strong>${e.block}</strong> | ${e.timeTaken}min ${e.timeGoal ? '/ '+e.timeGoal+'min' : ''} | 
                        <span style="font-weight:bold;">${e.gradeKumon}</span>
                    </div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            } else {
                // Layout Genérico (Escola/Programação)
                return `
                <div class="history-item">
                    <div class="history-item-header">
                        <strong>${e.date || 'Data?'}</strong>
                        ${e.subject ? `<span class="subject-badge subject-${e.subject}">${e.subject}</span>` : ''}
                    </div>
                    <div>${type === 'programmingHistory' ? `<strong>${e.material}</strong><br><small>${e.notes||''}</small>` : `Nota: ${e.grade} ${e.fileurl ? '[Anexo]' : ''}`}</div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            }
        }).join('');
    },

    // =====================================================================
    // 4. FUNCIONALIDADES DE IA (SCANNER E TRAJETÓRIA)
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
        if (!files.length || !this.state.currentStudentId) return alert("Selecione arquivos e abra um aluno.");

        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        const prompt = `
            VOCÊ É UM ESPECIALISTA EM KUMON. Analise as imagens.
            
            CASO 1: FOLHA DE REGISTRO (TABELA com várias linhas). Extraia TODAS.
            CASO 2: TAREFA ÚNICA/TESTE (Círculo de nota). Extraia apenas essa.

            RETORNE APENAS ARRAY JSON:
            [
              {
                "date": "YYYY-MM-DD", (Se ilegível use "TODAY")
                "stage": "Ex: A",
                "sheet": "Ex: 100",
                "timeTaken": "10", (Número ou null)
                "gradeKumon": "100%" (Ou "80-99%", "Repetição")
              }
            ]
        `;

        let newEntries = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.elements.taskAnalysisStatus.textContent = `Processando imagem ${i + 1}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;

            try {
                const b64 = await this.imageToBase64(file);
                const resultStr = await this.callGeminiAPI(prompt, "Extraia dados em JSON.", b64);
                const resultJson = JSON.parse(resultStr);

                if (Array.isArray(resultJson)) {
                    resultJson.forEach(row => {
                        const finalDate = (row.date === "TODAY" || !row.date) ? new Date().toISOString().split('T')[0] : row.date;
                        newEntries.push({
                            id: Date.now() + Math.random(),
                            createdAt: new Date().toISOString(),
                            date: finalDate,
                            subject: 'Matemática', // Padrão seguro
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
        setTimeout(() => this.closeTaskAnalysisModal(), 1000);
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
                Analise o aluno: ${student.name} (Estágios: ${student.mathStage}, ${student.portStage}).
                
                HISTÓRICO RECENTE (Boletim/Tarefas):
                ${JSON.stringify((student.performanceLog || []).slice(-25))}
                
                METAS UNIDADE / CURRÍCULO:
                ${JSON.stringify(brainData.curriculo_referencia || brainData.metas_gerais || "Foco: Autodidatismo, TPF correto.")}

                Tarefa: Crie um resumo estratégico para o orientador se preparar para a reunião.
                1. Pontos Fortes (Onde o TPF e acertos estão bons?).
                2. Pontos de Atenção (Onde o tempo está alto ou notas baixas? Cruzar com o currículo se houver).
                3. Sugestão (Avançar ou Repetir?).
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
            alert("Erro na análise: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = "<i class='bx bx-brain'></i> Análise de Trajetória";
        }
    },

    // =====================================================================
    // 5. DASHBOARD E KPIs
    // =====================================================================
    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.generateDashboardData();
    },
    closeDashboard() { this.elements.dashboardModal.classList.add('hidden'); },

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

            // Risco baseado no último registro
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

        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalEnrollments;
        this.elements.kpiMultiSubject.textContent = multiSubjectCount;
        this.elements.kpiRiskCount.textContent = riskCount;

        this.renderDashboardList(this.elements.riskList, riskStudents, '⚠️');
        this.renderDashboardList(this.elements.starList, starStudents, '⭐');
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
            const id = Object.keys(this.state.students).find(key => this.state.students[key] === s);
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(id); };
            element.appendChild(li);
        });
    },

    renderCharts(stages, subjects, mood) {
        if (this.state.charts.stages) this.state.charts.stages.destroy();
        if (this.state.charts.subjects) this.state.charts.subjects.destroy();
        if (this.state.charts.mood) this.state.charts.mood.destroy();

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

        const ctx2 = document.getElementById('subjectsChart').getContext('2d');
        this.state.charts.subjects = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: Object.keys(subjects),
                datasets: [{ data: Object.values(subjects), backgroundColor: ['#0078c1', '#d62828', '#f59e0b'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const ctx3 = document.getElementById('moodChart').getContext('2d');
        this.state.charts.mood = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: ['Atenção', 'Destaque', 'Normal'],
                datasets: [{ data: [mood.risk, mood.star, mood.total - mood.risk - mood.star], backgroundColor: ['#d62828', '#28a745', '#e0e0e0'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // =====================================================================
    // 6. CRUD BÁSICO E HELPERS
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
        alert('Salvo!');
    },

    async deleteStudent() {
        if(!confirm('Excluir aluno?')) return;
        delete this.state.students[this.state.currentStudentId];
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents();
        this.closeStudentModal();
    },

    async addHistoryEntry(e, type, form) {
        e.preventDefault();
        const entry = { id: Date.now().toString(), createdAt: new Date().toISOString() };
        Array.from(form.elements).forEach(el => {
            if(el.id && !el.id.includes('File')) {
                const key = el.id.replace(/performance|report|programming/i, '').toLowerCase();
                const camelKey = el.id.includes('Time') ? el.id.replace('performance', '').replace(/^./, c=>c.toLowerCase()) : key;
                entry[camelKey] = el.value;
            }
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
        if(!s[type]) s[type] = [];
        s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        form.reset();
    },

    async deleteHistoryEntry(type, id) {
        if(!confirm('Apagar registro?')) return;
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

    // FIREBASE & SYNC
    getNodeRef(path) { return this.state.db.ref(`gestores/${this.state.userId}/${path}`); },
    async fetchData(path) { const s = await this.getNodeRef(path).get(); return s.exists() ? s.val() : null; },
    async setData(path, d) { await this.getNodeRef(path).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async saveBrainData(d) { await this.setData('brain', d); },

    async updateBrainFromStudents() {
        let brain = await this.fetchBrainData();
        if (!brain.alunos) brain.alunos = {};
        
        Object.keys(brain.alunos).forEach(bid => { 
            if (!this.state.students[bid]) delete brain.alunos[bid]; 
        });

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
        console.log("Cérebro Sincronizado.");
    },

    // ADMIN
    promptForReset() { if(prompt('Senha Admin') === '*177') this.elements.brainModal.classList.remove('hidden'); },
    closeBrainModal() { this.elements.brainModal.classList.add('hidden'); },

    // HANDLE BRAIN UPLOAD COM DEEP MERGE (Correção Solicitada)
    async handleBrainFileUpload() {
        const file = this.elements.brainFileUploadModal.files[0];
        if (!file) return alert('Selecione um arquivo JSON.');
        try {
            const text = await file.text();
            const newJson = JSON.parse(text);
            
            // 1. Baixa o Brain Atual
            const currentBrain = await this.fetchBrainData() || {};

            // 2. Lógica de Soma Inteligente (Deep Merge)
            if (currentBrain.curriculo_referencia && newJson.curriculo_referencia) {
                // Se o novo JSON tem currículo, mescla com o existente (ex: adiciona Mat sem apagar Port)
                newJson.curriculo_referencia = {
                    ...currentBrain.curriculo_referencia, 
                    ...newJson.curriculo_referencia       
                };
            }

            // Mantém outros dados
            const finalBrain = { ...currentBrain, ...newJson };

            // 3. Salva
            await this.saveBrainData(finalBrain);
            alert('Cérebro expandido com sucesso! Novos conhecimentos somados.');
            this.elements.brainFileUploadModal.value = '';
            this.closeBrainModal();

        } catch (e) {
            console.error(e);
            alert('Erro ao processar arquivo JSON: ' + e.message);
        }
    },

    // GEMINI & AUDIO LEGACY
    imageToBase64(file) { return new Promise((res,rej) => { const r = new FileReader(); r.onloadend=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); }); },
    
    async callGeminiAPI(sys, user, img=null) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;
        const body = { systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: user }, ...(img?[{ inlineData: { mimeType: "image/jpeg", data: img } }]:[])] }], generationConfig: { responseMimeType: "application/json" } };
        if(user.includes("Analise a trajetória")) delete body.generationConfig;
        const r = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if(!r.ok) throw new Error((await r.json()).error.message);
        return (await r.json()).candidates[0].content.parts[0].text;
    },

    handleFileUpload() { const f = this.elements.audioUpload.files[0]; if(f) { this.state.audioFile = f; this.elements.audioFileName.textContent = f.name; this.elements.transcribeAudioBtn.disabled = false; } },
    
    async transcribeAudioGemini() { 
        this.elements.transcriptionOutput.value = "Processando..."; this.elements.transcriptionModule.classList.remove('hidden');
        try { const b64 = await this.imageToBase64(this.state.audioFile); const t = await this.callGeminiAPI("Transcreva.", "Transcreva.", b64); this.elements.transcriptionOutput.value = t; } catch(e) { alert(e.message); }
    },
    
    async analyzeTranscriptionGemini() {
        const t = this.elements.transcriptionOutput.value; const s = this.state.students[this.elements.meetingStudentSelect.value];
        this.elements.reportSection.classList.remove('hidden'); this.elements.reportContent.textContent = "Gerando...";
        try { const j = JSON.parse(await this.callGeminiAPI("JSON {resumo_executivo}", `Analise: ${t}. Aluno: ${s.name}`)); this.elements.reportContent.textContent = JSON.stringify(j, null, 2); if(!s.meetingHistory) s.meetingHistory=[]; s.meetingHistory.push(j); await this.setData('alunos/lista_alunos', { students: this.state.students }); } catch(e) { alert(e.message); }
    },
    
    downloadReport() { const b = new Blob([this.elements.reportContent.textContent], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'report.json'; a.click(); }
};
