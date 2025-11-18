// App.js - Plataforma Kumon V46.0 (DELETE HISTÓRICO DE REUNIÕES OK)
// Status: Agora é possível apagar registros da aba Histórico Reuniões/Análises.

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
        
        this.loadStudents(); 
    },

    mapDOMElements() {
        const ids = [
            'logout-button', 'system-options-btn', 'dashboard-btn', 'dashboardModal', 'closeDashboardBtn',
            'kpi-total-students', 'kpi-total-subjects', 'kpi-multi-subject', 'kpi-risk-count', 'riskList', 'starList',
            'meetingDate', 'meetingStudentSelect', 'audioUpload', 'audioFileName', 'additionalNotes', 'transcribeAudioBtn', 
            'transcriptionModule', 'transcriptionOutput', 'analyzeTranscriptionBtn', 'reportSection', 'reportContent', 'downloadReportBtn',
            'addStudentBtn', 'studentSearch', 'student-list', 'studentModal', 'modalTitle', 'closeModalBtn',
            'studentForm', 'studentId', 'saveStudentBtn', 'deleteStudentBtn',
            'programmingForm', 'reportForm', 'performanceForm',
            'programmingHistory', 'reportHistory', 'performanceHistory', 'meetingHistoryList',
            'filterProgramming', 'filterReports', 'filterPerformance',
            'brainModal', 'closeBrainModalBtn', 'brainFileUploadModal', 'uploadBrainFileBtnModal',
            'taskAnalysisModal', 'closeTaskAnalysisModalBtn', 'taskAnalysisForm', 'taskFilesInput', 'startTaskAnalysisBtn', 'taskAnalysisStatusContainer', 'taskAnalysisProgressBar', 'taskAnalysisStatus', 'openTaskAnalysisBtn',
            'generateTrajectoryBtn', 'trajectoryInsightArea', 'trajectoryContent',
            'stagesChart', 'subjectsChart', 'moodChart'
        ];
        
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) this.elements[id.replace(/-([a-z])/g, g => g[1].toUpperCase())] = el;
        });
        
        this.elements.studentIdInput = document.getElementById('studentId');
        this.elements.performanceLog = document.getElementById('performanceHistory'); 
        this.elements.studentAnalysisContent = document.getElementById('student-analysis-content');
    },

    addEventListeners() {
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.systemOptionsBtn.addEventListener('click', () => this.promptForReset());
        this.elements.dashboardBtn.addEventListener('click', () => this.openDashboard());
        this.elements.closeDashboardBtn.addEventListener('click', () => this.closeDashboard());
        this.elements.dashboardModal.addEventListener('click', (e) => { if (e.target === this.elements.dashboardModal) this.closeDashboard(); });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

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
        this.elements.studentModal.addEventListener('click', (e) => { if (e.target === this.elements.studentModal) this.closeStudentModal(); });

        this.elements.programmingForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'programmingHistory', this.elements.programmingForm));
        this.elements.reportForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'reportHistory', this.elements.reportForm));
        this.elements.performanceForm.addEventListener('submit', (e) => this.addHistoryEntry(e, 'performanceLog', this.elements.performanceForm)); 
        
        this.elements.filterProgramming.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterReports.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));
        this.elements.filterPerformance.addEventListener('change', () => this.loadStudentHistories(this.state.currentStudentId));

        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
        this.elements.generateTrajectoryBtn.addEventListener('click', this.generateTrajectoryAnalysis.bind(this));
    },

    // =====================================================================
    // 2. DADOS E RENDERIZAÇÃO
    // =====================================================================
    async loadStudents() {
        try {
            const data = await this.fetchData('alunos/lista_alunos');
            this.state.students = (data && data.students) ? data.students : {};
            this.renderStudentList();
            this.populateMeetingStudentSelect();
            this.generateDashboardData(); 
        } catch (e) {
            console.error("Erro ao carregar:", e);
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
    // 3. MODAL ALUNO E HISTÓRICOS
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

    switchTab(t) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const btn = document.querySelector(`[data-tab="${t}"]`);
        const content = document.getElementById(`tab-${t}`);
        if (btn) btn.classList.add('active');
        if (content) content.classList.add('active');
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
        container.innerHTML = history.map((h, index) => {
            // Garante um ID único para o delete, usando o índice como fallback se h.id não existir
            const itemId = h.id || `hist-${index}`;
            
            let dateStr = "Data desc.";
            if (h.meta && h.meta.date) dateStr = new Date(h.meta.date).toLocaleDateString();
            else if (h.date) dateStr = h.date; 
            
            const type = (h.meta && h.meta.type === "PRE_MEETING_ANALYSIS") ? "Análise Dados (IA)" : "Reunião Gravada (Áudio)";
            const summary = h.resumo_executivo || h.summary || "Sem resumo.";
            
            return `
            <div class="meeting-card">
                <div class="meeting-header">
                    <span>${dateStr}</span>
                    <span class="meeting-type">${type}</span>
                    <button class="delete-history-btn" onclick="App.deleteMeetingEntry('${itemId}')">&times;</button>
                </div>
                <div class="meeting-summary">${summary}</div>
            </div>`;
        }).reverse().join('');
    },

    renderHistory(type, data, filter = 'all') {
        const containerMap = {
            'performanceLog': this.elements.performanceLog,
            'programmingHistory': this.elements.programmingHistory,
            'reportHistory': this.elements.reportHistory
        };
        const container = containerMap[type];
        
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
                const isAlert = e.gradeKumon && (e.gradeKumon.includes('<') || e.gradeKumon.includes('Rep'));
                const sub = e.subject || 'Matemática';
                return `
                <div class="history-item" style="${isAlert ? 'border-left: 4px solid #d62828;' : 'border-left: 4px solid #28a745;'}">
                    <div class="history-item-header">
                        <strong>${e.date}</strong>
                        <span class="subject-badge subject-${sub}">${sub}</span>
                    </div>
                    <div style="margin-top:5px; font-size:1.1em;">
                        <strong>${e.block}</strong> | ${e.timeTaken}min | <span style="font-weight:bold;">${e.gradeKumon}</span>
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
                    <div>${type === 'programmingHistory' ? `<strong>${e.material}</strong><br>${e.notes||''}` : `Nota: ${e.grade} ${e.fileurl ? '[Anexo]' : ''}`}</div>
                    <button class="delete-history-btn" onclick="App.deleteHistoryEntry('${type}','${e.id}')">&times;</button>
                </div>`;
            }
        }).join('');
    },

    // =====================================================================
    // 4. SCANNER IA & TRAJETÓRIA
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
            CASO 1: FOLHA DE REGISTRO (TABELA). Extraia todas as linhas.
            CASO 2: TAREFA ÚNICA. Extraia essa tarefa.
            RETORNE ARRAY JSON: [{"date":"YYYY-MM-DD","stage":"A","sheet":"100","timeTaken":"10","gradeKumon":"100%","subject":"Matemática"}]
        `;

        let newEntries = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.elements.taskAnalysisStatus.textContent = `Lendo imagem ${i + 1}...`;
            this.elements.taskAnalysisProgressBar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;

            try {
                const b64 = await this.imageToBase64(file);
                // FIX: Passa o mimeType real do arquivo
                let resultStr = await this.callGeminiAPI(prompt, "Extraia dados JSON.", b64, file.type);
                resultStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
                const resultJson = JSON.parse(resultStr);

                if (Array.isArray(resultJson)) {
                    resultJson.forEach(row => {
                        const finalDate = (row.date === "TODAY" || !row.date) ? new Date().toISOString().split('T')[0] : row.date;
                        const finalSubject = row.subject || 'Matemática'; 
                        
                        newEntries.push({
                            id: String(Date.now()) + Math.random(), // Garante ID String para o delete funcionar
                            createdAt: new Date().toISOString(),
                            date: finalDate,
                            subject: finalSubject,
                            block: `${row.stage || '?'} ${row.sheet || '?'}`,
                            timeTaken: row.timeTaken || '0',
                            gradeKumon: row.gradeKumon || '?'
                        });
                    });
                }
            } catch (err) {
                console.error("Erro IA:", err);
                alert("Erro na imagem " + (i+1) + ": " + err.message);
            }
        }

        const s = this.state.students[this.state.currentStudentId];
        if (!s.performanceLog) s.performanceLog = [];
        s.performanceLog.push(...newEntries);
        
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
        this.updateBrainFromStudents();
        
        this.elements.taskAnalysisStatus.textContent = "Concluído!";
        setTimeout(() => {
             this.closeTaskAnalysisModal();
             this.elements.startTaskAnalysisBtn.disabled = false;
        }, 1000);
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
                ATUE COMO ORIENTADOR SÊNIOR.
                Analise: ${student.name}.
                Histórico Recente: ${JSON.stringify((student.performanceLog || []).slice(-25))}
                Metas Unidade: ${JSON.stringify(brainData.curriculo_referencia || brainData.metas_gerais || {})}
                Gere resumo estratégico.
            `;

            const text = await this.callGeminiAPI(prompt, "Analise a trajetória.");
            
            this.elements.trajectoryContent.textContent = text;
            this.elements.trajectoryInsightArea.classList.remove('hidden');

            // Cria o registro da análise com ID único
            const analysisEntry = {
                id: String(Date.now()) + Math.random(),
                meta: { date: new Date().toISOString(), type: "PRE_MEETING_ANALYSIS" },
                resumo_executivo: text
            };

            if (!student.meetingHistory) student.meetingHistory = [];
            student.meetingHistory.push(analysisEntry);
            await this.setData('alunos/lista_alunos', { students: this.state.students });
            this.loadStudentHistories(this.state.currentStudentId);

        } catch (e) {
            alert("Erro na análise: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = "Análise de Trajetória";
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
            if(s.mathStage) { studentSubCount++; subjectsCount['Matemática']++; this.incStage(stagesCount.Math, s.mathStage); }
            if(s.portStage) { studentSubCount++; subjectsCount['Português']++; this.incStage(stagesCount.Port, s.portStage); }
            if(s.engStage) { studentSubCount++; subjectsCount['Inglês']++; this.incStage(stagesCount.Eng, s.engStage); }
            
            totalEnrollments += studentSubCount;
            if(studentSubCount > 1) multiSubjectCount++;

            const last = s.performanceLog && s.performanceLog.length > 0 ? s.performanceLog[s.performanceLog.length - 1] : null;
            
            if (last) {
                const grade = String(last.gradeKumon).toUpperCase();
                
                if (grade.includes('<80') || grade.includes('REPETIR') || grade.includes('ALERTA') || parseInt(grade) < 80) {
                    riskStudents.push(s); riskCount++;
                } else if (grade.includes('100') || grade.includes('ELOGIO') || parseInt(grade) >= 95) {
                    starStudents.push(s);
                }
            }
        });

        this.elements.kpiTotalStudents.textContent = students.length;
        this.elements.kpiTotalSubjects.textContent = totalEnrollments;
        this.elements.kpiMultiSubject.textContent = multiSubjectCount;
        this.elements.kpiRiskCount.textContent = riskCount;

        this.renderDashList(this.elements.riskList, riskStudents, '⚠️');
        this.renderDashList(this.elements.starList, starStudents, '⭐');
        this.renderCharts(stagesCount, subjectsCount, { risk: riskCount, star: starStudents.length, total: students.length });
    },

    incStage(map, stg) { const l = stg.charAt(0).toUpperCase(); map[l] = (map[l]||0)+1; },
    
    renderDashList(el, list, ico) {
        el.innerHTML = list.length ? '' : '<li>Nenhum.</li>';
        list.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `${ico} <strong>${s.name}</strong>`;
            li.style.cursor = 'pointer';
            const id = Object.keys(this.state.students).find(k=>this.state.students[k]===s);
            li.onclick = () => { this.closeDashboard(); this.openStudentModal(id); };
            el.appendChild(li);
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
                datasets: [{ label: 'Mat', data: allLetters.map(l=>stages.Math[l]||0), backgroundColor:'#0078c1' }, { label: 'Port', data: allLetters.map(l=>stages.Port[l]||0), backgroundColor:'#d62828' }] 
            }
        });
        
        const ctx2 = document.getElementById('subjectsChart').getContext('2d');
        this.state.charts.subjects = new Chart(ctx2, {
            type: 'pie', 
            data: { labels: Object.keys(subjects), datasets: [{ data: Object.values(subjects), backgroundColor: ['#0078c1','#d62828','#f59e0b'] }] }
        });
        
        const ctx3 = document.getElementById('moodChart').getContext('2d');
        this.state.charts.mood = new Chart(ctx3, {
            type: 'doughnut', 
            data: { labels: ['Atenção','Destaque','Normal'], datasets: [{ data: [mood.risk, mood.star, mood.total - mood.risk - mood.star], backgroundColor: ['#d62828', '#28a745', '#e0e0e0'] }] }
        });
    },

    // =====================================================================
    // 6. CRUD GERAL
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
        const entry = { id: String(Date.now()) + Math.random(), createdAt: new Date().toISOString() };
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
             entry.gradeKumon = document.getElementById('performanceGradeKumon').value;
             entry.subject = document.getElementById('performanceSubject').value;
        }

        const s = this.state.students[this.state.currentStudentId];
        if(!s[type]) s[type] = [];
        s[type].push(entry);
        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudents();
        form.reset();
    },

    // CORREÇÃO: Apagar entradas do Histórico de Tarefas (performanceLog, programmingHistory, reportHistory)
    async deleteHistoryEntry(type, id) {
        if(!confirm('Apagar?')) return;
        const s = this.state.students[this.state.currentStudentId];
        
        if (s[type]) {
            // Garante que a comparação funcione mesmo que um ID seja número e o outro string do HTML
            s[type] = s[type].filter(x => String(x.id) !== String(id));
        }

        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
    },

    // NOVA FUNÇÃO: Apagar entradas do Histórico de Reuniões/Análises
    async deleteMeetingEntry(id) {
        if(!confirm('Apagar esta análise de reunião?')) return;
        const s = this.state.students[this.state.currentStudentId];
        
        if (s.meetingHistory) {
            // Filtra pelo ID da análise
            s.meetingHistory = s.meetingHistory.filter(x => String(x.id) !== String(id));
        }

        await this.setData('alunos/lista_alunos', { students: this.state.students });
        this.loadStudentHistories(this.state.currentStudentId);
    },

    // =====================================================================
    // 7. FIREBASE & BRAIN & ADMIN
    // =====================================================================
    getNodeRef(path) { return this.state.db.ref(`gestores/${this.state.userId}/${path}`); },
    async fetchData(path) { const s = await this.getNodeRef(path).get(); return s.exists() ? s.val() : null; },
    async setData(path, d) { await this.getNodeRef(path).set(d); },
    async fetchBrainData() { return (await this.fetchData('brain')) || {}; },
    async saveBrainData(d) { await this.setData('brain', d); },

    async updateBrainFromStudents() {
        let brain = await this.fetchBrainData();
        if (!brain.alunos) brain.alunos = {};
        Object.keys(brain.alunos).forEach(bid => { if (!this.state.students[bid]) delete brain.alunos[bid]; });
        for (const [id, s] of Object.entries(this.state.students)) {
            brain.alunos[id] = {
                id: id, nome: s.name, responsavel: s.responsible,
                estagio_matematica: s.mathStage, historico_desempenho: s.performanceLog || [],
                metas: brain.alunos[id]?.metas || {},
            };
        }
        await this.saveBrainData(brain);
    },

    // RESTAURAÇÃO COMPLETA DA FUNÇÃO RESET
    promptForReset() { 
        const code = prompt('Senha Admin (*177: Cérebro | RESET: Apagar Tudo):');
        if(code === '*177') this.elements.brainModal.classList.remove('hidden'); 
        if(code === 'RESET') this.hardResetUserData();
    },
    
    async hardResetUserData() {
        if(confirm("ATENÇÃO: ISSO APAGARÁ TODOS OS ALUNOS E DADOS. CONTINUAR?")) {
            await this.getNodeRef('').remove();
            alert("Sistema resetado.");
            location.reload();
        }
    },

    closeBrainModal() { this.elements.brainModal.classList.add('hidden'); },

    async handleBrainFileUpload() {
        const file = this.elements.brainFileUploadModal.files[0];
        if (!file) return alert('Selecione JSON.');
        try {
            const text = await file.text();
            const newJson = JSON.parse(text);
            const currentBrain = await this.fetchBrainData() || {};
            
            if (currentBrain.curriculo_referencia && newJson.curriculo_referencia) {
                newJson.curriculo_referencia = { ...currentBrain.curriculo_referencia, ...newJson.curriculo_referencia };
            }
            const finalBrain = { ...currentBrain, ...newJson };
            await this.saveBrainData(finalBrain);
            alert('Cérebro atualizado!');
            this.closeBrainModal();
        } catch (e) { alert('Erro JSON: ' + e.message); }
    },

    // =====================================================================
    // 8. GEMINI API & AUDIO
    // =====================================================================
    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async callGeminiAPI(systemPrompt, userPrompt, base64Data = null, mimeType = "image/jpeg") {
        if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE")) throw new Error("API Key ausente.");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.state.geminiModel}:generateContent?key=${window.GEMINI_API_KEY}`;

        const parts = [{ text: userPrompt }];
        
        if (base64Data) {
            parts.push({ inlineData: { mimeType: mimeType, data: base64Data } });
        }

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: parts }],
            generationConfig: { responseMimeType: "application/json" }
        };
        
        if (userPrompt.includes("Analise a trajetória")) delete payload.generationConfig;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message);
        }
        return (await response.json()).candidates[0].content.parts[0].text;
    },

    handleFileUpload() { const f = this.elements.audioUpload.files[0]; if(f) { this.state.audioFile = f; this.elements.audioFileName.textContent = f.name; this.elements.transcribeAudioBtn.disabled = false; } },
    
    async transcribeAudioGemini() { 
        this.elements.transcriptionOutput.value = "Processando..."; this.elements.transcriptionModule.classList.remove('hidden');
        try { 
            const b64 = await this.imageToBase64(this.state.audioFile); 
            
            const t = await this.callGeminiAPI("Transcreva este áudio fielmente.", "Transcreva.", b64, this.state.audioFile.type); 
            const transcript = t.replace(/```json|```/g, '');
            
            // Validação de Contexto
            const validationPrompt = `Analise este texto: "${transcript}". É sobre uma reunião de pais, alunos ou educação Kumon? Responda APENAS JSON: {"valid": boolean, "reason": "..."}`;
            const validationRes = JSON.parse(await this.callGeminiAPI("Validador de Contexto", validationPrompt));
            
            if (!validationRes.valid) {
                this.elements.transcriptionOutput.value = `Erro: Áudio não é sobre contexto Kumon/Educacional. Motivo: ${validationRes.reason}`;
                return;
            }

            this.elements.transcriptionOutput.value = transcript; 
        } catch(e) { alert("Erro Transcrição: " + e.message); }
    },
    
    async analyzeTranscriptionGemini() {
        const t = this.elements.transcriptionOutput.value; const s = this.state.students[this.elements.meetingStudentSelect.value];
        this.elements.reportSection.classList.remove('hidden'); this.elements.reportContent.textContent = "Gerando...";
        try { 
            // Adicionamos ID para garantir que o item seja apagável
            const analysisEntry = JSON.parse(await this.callGeminiAPI("JSON {resumo_executivo}", `Analise: ${t}. Aluno: ${s.name}`));
            analysisEntry.id = String(Date.now()) + Math.random(); 
            
            this.elements.reportContent.textContent = JSON.stringify(analysisEntry, null, 2); 
            if(!s.meetingHistory) s.meetingHistory=[]; 
            s.meetingHistory.push(analysisEntry); 
            await this.setData('alunos/lista_alunos', { students: this.state.students }); 
        } catch(e) { alert(e.message); }
    },
    
    downloadReport() { const b = new Blob([this.elements.reportContent.textContent], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'report.json'; a.click(); }
};
