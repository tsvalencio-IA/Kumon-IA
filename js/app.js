// App.js - Plataforma Kumon V12.0 (GOLD MASTER - UNABRIDGED)
// Desenvolvido por: Thiaguinho Soluções
// Status: Código Fonte Completo sem Omissões.

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
    // 1. INICIALIZAÇÃO
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
        
        // Carrega dados do Firebase imediatamente ao iniciar
        this.loadStudents();
    },

    mapDOMElements() {
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
        this.elements.meetingHistoryList = document.getElementById('meetingHistoryList');
        this.elements.studentAnalysisContent = document.getElementById('student-analysis-content');

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

        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // 2. CARREGAMENTO DE DADOS
    // =====================================================================
    async loadStudents() {
        try {
            console.log("Carregando alunos do Firebase...");
            const data = await this.fetchData('alunos/lista_alunos');
            this.state.students = (data && data.students) ? data.students : {};
            
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData(); 
        } catch (e) {
            console.error("Erro ao carregar alunos:", e);
            alert("Erro de conexão. Verifique a internet.");
        }
    },

    renderStudentList() {
        const term = this.elements.studentSearch.value.toLowerCase();
        const list = Object.entries(this.state.students)
            .filter(([, s]) => {
                const n = (s.name || '').toLowerCase();
                const r = (s.responsible || '').toLowerCase();
                return n.includes(term) || r.includes(term);
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
    // 3. MODAL E HISTÓRICOS
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
            container.innerHTML = '<p class="text-gray-500 text-sm">Nenhuma reunião registrada.</p>';
            return;
        }
        container.innerHTML = history.map((h) => {
            // Suporte a dados legados e novos
            let dateStr = "Data desc.";
            if (h.meta && h.meta.date) dateStr = new Date(h.meta.date).toLocaleDateString();
            else if (h.date) dateStr = h.date; 
            
            const type = (h.meta && h.meta.type === "PRE_MEETING_ANALYSIS") ? "Análise Dados (IA)" : "Reunião Gravada";
            const summary = h.resumo_executivo || h.summary || "Sem resumo disponível.";
            
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
    // 4. SCANNER IA E TRAJETÓRIA
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

            RETORNE APENAS ARRAY JSON.
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
            this.elements.taskAnalysisStatus.textContent = `Lendo imagem ${i + 1}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;

            try {
                const b64 = await this.imageToBase64(file);
                let resultStr = await this.callGeminiAPI(prompt, "Extraia dados em JSON.", b64);
                
                // Limpeza de Markdown que a IA pode incluir
                resultStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();

                const resultJson = JSON.parse(resultStr);

                if (Array.isArray(resultJson)) {
                    resultJson.forEach(row => {
                        const finalDate = (row.date === "TODAY" || !row.date) ? new Date().toISOString().split('T')[0] : row.date;
                        newEntries.push({
                            id: Date.now() + Math.random(),
                            createdAt: new Date().toISOString(),
                            date: finalDate,
                            subject: 'Matemática', // Default seguro
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
        
        this.elements.taskAnalysisStatus.textContent = "Concluído!";
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
    // 5. DASHBOARD E KPIs (COMPLETO)
    // =====================================================================
    openDashboard() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.generateDashboardData();
    },
    closeDashboard() { this.elements.dashboardModal.classList.add('hidden'); },

    generateDashboardData() {
        const students = Object.values(this.state.students);
        
        let totalSubs = 0, multi = 0, riskCount = 0;
        const subjects = { 'Matemática': 0, 'Português': 0, 'Inglês': 0 };
        const stages = { 'Math': {}, 'Port': {}, 'Eng': {} };
        const riskList = [], starList = [];

        students.forEach(s => {
            let count = 0;
            if(s.mathStage) { count++; subjects['Matemática']++; this.incStage(stages.Math, s.mathStage); }
            if(s.portStage) { count++; subjects['Português']++; this.incStage(stages.Port, s.portStage); }
            if(s.engStage) { count++; subjects['Inglês']++; this.incStage(stages.Eng, s.engStage); }
            totalSubs += count;
            if(count > 1) multi++;

            // Risco
            const last = s.performanceLog && s.performanceLog.length > 0 ? s.performanceLog[s.performanceLog.length - 1] : null;
            if (last && (last.gradeKumon.includes('<') || last.gradeKumon.includes('Rep'))) {
                riskList.push(s); riskCount++;
            } else if (last && last.gradeKumon.includes('100')) {
                starList.push(s);
            }
        });

        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalSubs;
        this.elements.kpiMultiSubject.textContent = multi;
        this.elements.kpiRiskCount.textContent = riskCount;

        this.renderDashList(this.elements.riskList, riskList, '⚠️');
        this.renderDashList(this.elements.starList, starList, '⭐');
        this.renderCharts(stages, subjects, { risk: riskCount, star: starList.length, total: students.length });
    },

    incStage(map, stg) { const l = stg.charAt(0).toUpperCase(); map[l] = (map[l]||0)+1; },
    
    renderDashList(el, list, ico) {
        el.innerHTML = list.length ? '' : '<li>Nenhum.</li>';
        list.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `${ico} <strong>${s.name}</strong>`;
            li.style.cursor = 'pointer';
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(Object.keys(this.state.students).find(k=>this.state.students[k]===s)); };
            el.appendChild(li);
        });
    },
    
    renderCharts(stg, sub, mood) {
        if(this.state.charts.stages) this.state.charts.stages.destroy();
        if(this.state.charts.subjects) this.state.charts.subjects.destroy();
        if(this.state.charts.mood) this.state.charts.mood.destroy();

        const labels = [...new Set([...Object.keys(stg.Math), ...Object.keys(stg.Port)])].sort();
        
        this.state.charts.stages = new Chart(document.getElementById('stagesChart'), {
            type: 'bar', 
            data: { 
                labels, 
                datasets: [{ label: 'Mat', data: labels.map(l=>stg.Math[l]||0), backgroundColor:'#0078c1' }, { label: 'Port', data: labels.map(l=>stg.Port[l]||0), backgroundColor:'#d62828' }] 
            }
        });
        
        this.state.charts.subjects = new Chart(document.getElementById('subjectsChart'), {
            type: 'pie', 
            data: { 
                labels: Object.keys(sub), 
                datasets: [{ data: Object.values(sub), backgroundColor: ['#0078c1','#d62828','#f59e0b'] }] 
            }
        });
        
        this.state.charts.mood = new Chart(document.getElementById('moodChart'), {
            type: 'doughnut', 
            data: { 
                labels: ['Atenção','Destaque','Normal'], 
                datasets: [{ data: [mood.risk, mood.star, mood.total-mood.risk-mood.star], backgroundColor: ['red','green','#eee'] }] 
            }
        });
    },

    // =====================================================================
    // 6. CRUD E FIREBASE
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
        if(!confirm('Excluir?')) return;
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
                historico_desempenho: s.performanceLog || [],
                metas: brain.alunos[id]?.metas || {},
            };
        }
        await this.saveBrainData(brain);
    },

    // =====================================================================
    // 7. ADMIN E UPLOAD BRAIN (DEEP MERGE)
    // =====================================================================
    promptForReset() { if(prompt('Senha Admin') === '*177') this.elements.brainModal.classList.remove('hidden'); },
    closeBrainModal() { this.elements.brainModal.classList.add('hidden'); },

    async handleBrainFileUpload() {
        const file = this.elements.brainFileUploadModal.files[0];
        if (!file) return alert('Selecione um arquivo JSON.');

        try {
            const text = await file.text();
            const newJson = JSON.parse(text);
            
            // 1. Baixa o Cérebro Atual
            const currentBrain = await this.fetchBrainData() || {};

            // 2. LÓGICA DE SOMA INTELIGENTE (DEEP MERGE)
            if (currentBrain.curriculo_referencia && newJson.curriculo_referencia) {
                newJson.curriculo_referencia = {
                    ...currentBrain.curriculo_referencia, // Mantém o que já existia
                    ...newJson.curriculo_referencia       // Soma o novo
                };
            }
            
            if (currentBrain.alunos && newJson.alunos) {
                newJson.alunos = {
                    ...currentBrain.alunos,
                    ...newJson.alunos
                };
            }

            // 3. Junta o resto e Salva
            const finalBrain = { ...currentBrain, ...newJson };

            await this.saveBrainData(finalBrain);
            alert('Cérebro expandido com sucesso! Novos conhecimentos somados.');
            this.elements.brainFileUploadModal.value = '';
            this.closeBrainModal();

        } catch (e) {
            console.error(e);
            alert('Erro ao processar arquivo JSON: ' + e.message);
        }
    },

    // =====================================================================
    // 8. GEMINI API & HELPERS
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
        if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE")) throw new Error("API Key não configurada.");

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
