// App.js - Plataforma de Diário de Reuniões Kumon
// VERSÃO 2.0 (MULTIMODAL - ANÁLISE DE TAREFAS)
// Esta versão adiciona a capacidade de analisar fotos de tarefas (boletins)
// em uma fila, 100% client-side, e salvar os resultados.

const App = {
    state: {
        userId: null,
        db: null, 
        students: {},
        currentStudentId: null,
        reportData: null, 
        audioFile: null,
        charts: {},
        geminiModel: null // NOVO (V2): Modelo Gemini
    },
    elements: {},

    // =====================================================================
    // ======================== INICIALIZAÇÃO E SETUP ======================\
    // =====================================================================
    init(user, databaseInstance) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        this.state.userId = user.uid;
        this.state.db = databaseInstance; 
        document.getElementById('userEmail').textContent = user.email;

        // NOVO (V2): Inicializa o modelo Gemini
        // NOTA: Isso assume que a API Key está no config.js e é válida
        // Vamos usar o gemini-2.5-flash-preview-09-2025 pois ele é multimodal
        this.state.geminiModel = "gemini-2.5-flash-preview-09-2025"; 

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
            
            studentList: document.getElementById('studentList'),
            studentSearch: document.getElementById('studentSearch'),
            addStudentBtn: document.getElementById('addStudentBtn'),
            
            contentArea: document.getElementById('contentArea'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            studentDetail: document.getElementById('studentDetail'),
            
            studentNameHeader: document.getElementById('studentNameHeader'),
            studentResponsible: document.getElementById('studentResponsible'),
            studentContact: document.getElementById('studentContact'),
            
            mathStage: document.getElementById('mathStage'),
            portStage: document.getElementById('portStage'),
            engStage: document.getElementById('engStage'),
            saveStagesBtn: document.getElementById('saveStagesBtn'),
            
            gradeHistory: document.getElementById('gradeHistory'),
            meetingHistory: document.getElementById('meetingHistory'),
            performanceLogContainer: document.getElementById('performanceLogContainer'), // NOVO (V2)

            // Modal Aluno
            studentModal: document.getElementById('studentModal'),
            studentModalTitle: document.getElementById('studentModalTitle'),
            closeStudentModalBtn: document.getElementById('closeStudentModalBtn'),
            studentForm: document.getElementById('studentForm'),
            studentId: document.getElementById('studentId'),
            studentName: document.getElementById('studentName'),
            deleteStudentBtn: document.getElementById('deleteStudentBtn'),

            // Modal Boletim
            gradeModal: document.getElementById('gradeModal'),
            closeGradeModalBtn: document.getElementById('closeGradeModalBtn'),
            gradeForm: document.getElementById('gradeForm'),
            gradeAttachment: document.getElementById('gradeAttachment'),
            uploadAttachmentBtn: document.getElementById('uploadAttachmentBtn'),
            attachmentStatus: document.getElementById('attachmentStatus'),
            gradeAttachmentUrl: document.getElementById('gradeAttachmentUrl'),
            openAddGradeBtn: document.getElementById('openAddGradeBtn'),

            // Modal Reunião (IA Texto)
            meetingModal: document.getElementById('meetingModal'),
            closeMeetingModalBtn: document.getElementById('closeMeetingModalBtn'),
            meetingForm: document.getElementById('meetingForm'),
            generateAnalysisBtn: document.getElementById('generateAnalysisBtn'),
            analysisResult: document.getElementById('analysisResult'),
            openMeetingBtn: document.getElementById('openMeetingBtn'),

            // Modal Relatório (Visualizar)
            reportModal: document.getElementById('reportModal'),
            reportModalTitle: document.getElementById('reportModalTitle'), // ID Faltando na V1
            closeReportModalBtn: document.getElementById('closeReportModalBtn'),
            reportModalBody: document.getElementById('reportModalBody'),
            
            // Modal Admin (Cérebro)
            brainModal: document.getElementById('brainModal'),
            closeBrainModalBtn: document.getElementById('closeBrainModalBtn'),
            uploadBrainFileBtnModal: document.getElementById('uploadBrainFileBtnModal'),

            // NOVO (V2): Modal Análise de Tarefas (IA Multimodal)
            taskAnalysisModal: document.getElementById('taskAnalysisModal'),
            closeTaskAnalysisModalBtn: document.getElementById('closeTaskAnalysisModalBtn'),
            taskAnalysisForm: document.getElementById('taskAnalysisForm'),
            taskFilesInput: document.getElementById('taskFilesInput'),
            startTaskAnalysisBtn: document.getElementById('startTaskAnalysisBtn'),
            taskAnalysisStatusContainer: document.getElementById('taskAnalysisStatusContainer'),
            taskAnalysisProgressBar: document.getElementById('taskAnalysisProgressBar'),
            taskAnalysisStatus: document.getElementById('taskAnalysisStatus'),
            openTaskAnalysisBtn: document.getElementById('openTaskAnalysisBtn'),
            
            // KPIs do Dashboard
            kpiTotalAlunos: document.getElementById('kpiTotalAlunos'),
            kpiAlunosMat: document.getElementById('kpiAlunosMat'),
            kpiAlunosPort: document.getElementById('kpiAlunosPort'),
            kpiAlunosEng: document.getElementById('kpiAlunosEng')
        };
    },

    addEventListeners() {
        // Navegação
        this.elements.logoutButton.addEventListener('click', () => firebase.auth().signOut());
        this.elements.dashboardBtn.addEventListener('click', this.openDashboardModal.bind(this)); // Corrigido
        this.elements.closeDashboardBtn.addEventListener('click', this.closeDashboardModal.bind(this));
        this.elements.systemOptionsBtn.addEventListener('click', this.promptForReset.bind(this));
        
        // Alunos
        this.elements.addStudentBtn.addEventListener('click', () => this.openStudentModal()); // Corrigido
        this.elements.closeStudentModalBtn.addEventListener('click', this.closeStudentModal.bind(this));
        this.elements.studentForm.addEventListener('submit', this.handleStudentSubmit.bind(this));
        this.elements.deleteStudentBtn.addEventListener('click', this.handleDeleteStudent.bind(this));
        this.elements.studentSearch.addEventListener('input', this.filterStudents.bind(this));
        this.elements.saveStagesBtn.addEventListener('click', this.saveStudentStages.bind(this));

        // Boletim (Folha de Registro)
        this.elements.openAddGradeBtn.addEventListener('click', this.openGradeModal.bind(this));
        this.elements.closeGradeModalBtn.addEventListener('click', this.closeGradeModal.bind(this));
        this.elements.gradeForm.addEventListener('submit', this.handleGradeSubmit.bind(this));
        this.elements.uploadAttachmentBtn.addEventListener('click', this.uploadAttachment.bind(this));

        // Reunião (IA Texto)
        this.elements.openMeetingBtn.addEventListener('click', this.openMeetingModal.bind(this));
        this.elements.closeMeetingModalBtn.addEventListener('click', this.closeMeetingModal.bind(this));
        this.elements.meetingForm.addEventListener('submit', this.handleMeetingSubmit.bind(this));
        this.elements.closeReportModalBtn.addEventListener('click', this.closeReportModal.bind(this));

        // Admin (Cérebro)
        this.elements.closeBrainModalBtn.addEventListener('click', this.closeBrainModal.bind(this));
        this.elements.uploadBrainFileBtnModal.addEventListener('click', this.handleBrainUploadModal.bind(this));

        // NOVO (V2): Análise de Tarefas (IA Multimodal)
        this.elements.openTaskAnalysisBtn.addEventListener('click', this.openTaskAnalysisModal.bind(this));
        this.elements.closeTaskAnalysisModalBtn.addEventListener('click', this.closeTaskAnalysisModal.bind(this));
        this.elements.taskAnalysisForm.addEventListener('submit', this.handleTaskAnalysisSubmit.bind(this));
    },

    // =====================================================================
    // ======================== LÓGICA DE DADOS (CORE) =====================
    // =====================================================================

    // Retorna a referência do nó principal do gestor
    getNodeRef(path = '') {
        return this.state.db.ref(`gestores/${this.state.userId}/${path}`);
    },

    loadStudents() {
        const studentRef = this.getNodeRef('alunos/lista_alunos/students');
        studentRef.on('value', (snapshot) => {
            this.state.students = snapshot.val() || {};
            this.renderStudentList();
            
            // Se um aluno estava selecionado, recarrega os detalhes dele
            if (this.state.currentStudentId && this.state.students[this.state.currentStudentId]) {
                this.displayStudentDetail(this.state.currentStudentId);
            } else if (this.state.currentStudentId) {
                // O aluno selecionado foi excluído, volta para a welcome screen
                this.state.currentStudentId = null;
                this.elements.welcomeScreen.classList.remove('hidden');
                this.elements.studentDetail.classList.add('hidden');
            }
        });
    },

    renderStudentList() {
        this.elements.studentList.innerHTML = '';
        const searchTerm = this.elements.studentSearch.value.toLowerCase();
        
        // Ordena os alunos por nome
        const sortedStudents = Object.values(this.state.students)
            .filter(student => student.nome.toLowerCase().includes(searchTerm))
            .sort((a, b) => a.nome.localeCompare(b.nome));

        if (sortedStudents.length === 0) {
            this.elements.studentList.innerHTML = '<p class="empty-list">Nenhum aluno encontrado.</p>';
            return;
        }

        sortedStudents.forEach(student => {
            const el = document.createElement('div');
            el.className = 'student-item';
            el.textContent = student.nome;
            el.dataset.id = student.id;
            
            if (student.id === this.state.currentStudentId) {
                el.classList.add('active');
            }
            
            el.addEventListener('click', () => this.displayStudentDetail(student.id));
            this.elements.studentList.appendChild(el);
        });
    },

    filterStudents() {
        this.renderStudentList();
    },

    displayStudentDetail(studentId) {
        if (!this.state.students[studentId]) {
            console.error("Aluno não encontrado:", studentId);
            return;
        }

        this.state.currentStudentId = studentId;
        const student = this.state.students[studentId];

        this.elements.studentNameHeader.textContent = student.nome;
        this.elements.studentResponsible.textContent = student.responsavel || 'N/A';
        this.elements.studentContact.textContent = student.contact || 'N/A';
        
        this.elements.mathStage.value = student.mathStage || '';
        this.elements.portStage.value = student.portStage || '';
        this.elements.engStage.value = student.engStage || '';

        // Renderiza históricos
        this.renderHistory(this.elements.gradeHistory, student.historico_boletins, this.createGradeCard);
        this.renderHistory(this.elements.meetingHistory, student.meetingHistory, this.createMeetingCard.bind(this));
        
        // NOVO (V2): Renderiza o log de performance
        this.renderHistory(this.elements.performanceLogContainer, student.performanceLog, this.createPerformanceLogItem);

        // Ativa a aba principal
        this.openTab(null, 'tabBoletim');
        // Garante que a primeira aba esteja ativa visualmente
        document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
        document.querySelector('.tab-link[onclick*="tabBoletim"]').classList.add('active');


        // Atualiza a lista de alunos para mostrar o 'active'
        this.renderStudentList();
        
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.studentDetail.classList.remove('hidden');
    },

    renderHistory(container, historyData, cardCreator) {
        container.innerHTML = '';
        if (!historyData) {
            container.innerHTML = '<p class="empty-list">Nenhum registro encontrado.</p>';
            return;
        }
        
        // Converte o objeto de histórico em array e ordena (mais novo primeiro)
        const historyArray = Object.values(historyData).sort((a, b) => {
            const dateA = a.date || a.createdAt;
            const dateB = b.date || b.createdAt;
            return new Date(dateB) - new Date(dateA);
        });

        if (historyArray.length === 0) {
            container.innerHTML = '<p class="empty-list">Nenhum registro encontrado.</p>';
            return;
        }

        historyArray.forEach(item => {
            const card = cardCreator(item);
            container.appendChild(card);
        });
    },

    // =====================================================================
    // ======================== LÓGICA DE ALUNOS (CRUD) ====================
    // =====================================================================
    
    openStudentModal(studentId = null) {
        this.elements.studentForm.reset();
        this.elements.studentId.value = '';
        this.elements.deleteStudentBtn.classList.add('hidden');

        if (studentId && this.state.students[studentId]) {
            // Editando
            const student = this.state.students[studentId];
            this.elements.studentModalTitle.textContent = "Editar Aluno";
            this.elements.studentId.value = student.id;
            this.elements.studentName.value = student.nome;
            document.getElementById('studentResponsible').value = student.responsavel || '';
            document.getElementById('studentContact').value = student.contact || '';
            this.elements.deleteStudentBtn.classList.remove('hidden');
        } else {
            // Adicionando
            this.elements.studentModalTitle.textContent = "Adicionar Novo Aluno";
        }
        this.elements.studentModal.classList.remove('hidden');
    },

    closeStudentModal() {
        this.elements.studentModal.classList.add('hidden');
    },

    handleStudentSubmit(e) {
        e.preventDefault();
        const id = this.elements.studentId.value || new Date().getTime().toString();
        const studentData = {
            id: id,
            nome: this.elements.studentName.value,
            responsavel: document.getElementById('studentResponsible').value,
            contact: document.getElementById('studentContact').value,
            // Mantém os estágios existentes se estiver editando
            mathStage: this.state.students[id]?.mathStage || '',
            portStage: this.state.students[id]?.portStage || '',
            engStage: this.state.students[id]?.engStage || '',
            // (Preserva históricos)
            historico_boletins: this.state.students[id]?.historico_boletins || {},
            meetingHistory: this.state.students[id]?.meetingHistory || {},
            performanceLog: this.state.students[id]?.performanceLog || {}
        };

        this.getNodeRef(`alunos/lista_alunos/students/${id}`).set(studentData)
            .then(() => {
                this.closeStudentModal();
                this.updateBrainFromStudents(); // Atualiza o cérebro
            })
            .catch(err => alert("Erro ao salvar aluno: " + err.message));
    },

    handleDeleteStudent() {
        const id = this.elements.studentId.value;
        if (!id) return;
        
        if (confirm(`Tem certeza que deseja excluir o aluno "${this.state.students[id].nome}"?\nTODOS os dados (boletins, reuniões, etc) serão perdidos.`)) {
            this.getNodeRef(`alunos/lista_alunos/students/${id}`).remove()
                .then(() => {
                    this.closeStudentModal();
                    this.elements.welcomeScreen.classList.remove('hidden');
                    this.elements.studentDetail.classList.add('hidden');
                    this.state.currentStudentId = null;
                    this.updateBrainFromStudents(); // Atualiza o cérebro
                })
                .catch(err => alert("Erro ao excluir: " + err.message));
        }
    },

    saveStudentStages() {
        if (!this.state.currentStudentId) return;
        const id = this.state.currentStudentId;
        
        const updates = {
            mathStage: this.elements.mathStage.value,
            portStage: this.elements.portStage.value,
            engStage: this.elements.engStage.value
        };

        this.getNodeRef(`alunos/lista_alunos/students/${id}`).update(updates)
            .then(() => {
                alert("Estágios atualizados!");
                this.updateBrainFromStudents(); // Atualiza o cérebro
            })
            .catch(err => alert("Erro ao salvar estágios: " + err.message));
    },

    // =====================================================================
    // =================== LÓGICA DE BOLETIM (Cloudinary) ==================
    // =====================================================================

    openGradeModal() {
        this.elements.gradeForm.reset();
        this.elements.attachmentStatus.textContent = '';
        this.elements.gradeAttachmentUrl.value = '';
        this.elements.gradeModal.classList.remove('hidden');
    },
    
    closeGradeModal() {
        this.elements.gradeModal.classList.add('hidden');
    },

    uploadAttachment() {
        if (!cloudinaryConfig || !cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
            alert("Erro: Configuração do Cloudinary não encontrada em config.js");
            return;
        }

        const file = this.elements.gradeAttachment.files[0];
        if (!file) return;

        this.elements.uploadAttachmentBtn.disabled = true;
        this.elements.attachmentStatus.textContent = "Enviando arquivo...";
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);

        fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                this.elements.gradeAttachmentUrl.value = data.secure_url;
                this.elements.attachmentStatus.textContent = "Anexo enviado com sucesso!";
                this.elements.uploadAttachmentBtn.disabled = false;
            } else {
                throw new Error(data.error.message || 'Falha no upload');
            }
        })
        .catch(err => {
            this.elements.attachmentStatus.textContent = "Erro no upload: " + err.message;
            this.elements.uploadAttachmentBtn.disabled = false;
        });
    },

    handleGradeSubmit(e) {
        e.preventDefault();
        const id = new Date().getTime().toString();
        const studentId = this.state.currentStudentId;
        
        const gradeData = {
            id: id,
            date: document.getElementById('gradeDate').value,
            subject: document.getElementById('gradeSubject').value,
            grade: document.getElementById('gradeValue').value,
            attachmentUrl: this.elements.gradeAttachmentUrl.value || null,
            createdAt: new Date().toISOString()
        };

        this.getNodeRef(`alunos/lista_alunos/students/${studentId}/historico_boletins/${id}`).set(gradeData)
            .then(() => this.closeGradeModal())
            .catch(err => alert("Erro ao salvar boletim: " + err.message));
    },

    createGradeCard(item) {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `
            <div class="history-item-header">
                <strong>${item.date} - ${item.subject}</strong>
                <span>Nota/Conceito: ${item.grade}</span>
            </div>
            ${item.attachmentUrl ? `<a href="${item.attachmentUrl}" target="_blank" class="attachment-link"><i class='bx bx-paperclip'></i> Ver Anexo</a>` : ''}
        `;
        return el;
    },

    // =====================================================================
    // =================== LÓGICA DE REUNIÃO (IA Texto V1) =================
    // =====================================================================

    openMeetingModal() {
        this.elements.meetingForm.reset();
        this.elements.analysisResult.innerHTML = "Aguardando geração da análise...";
        this.elements.generateAnalysisBtn.disabled = false;
        this.state.reportData = null;
        this.elements.meetingModal.classList.remove('hidden');
    },

    closeMeetingModal() {
        this.elements.meetingModal.classList.add('hidden');
    },

    async handleMeetingSubmit(e) {
        e.preventDefault();
        if (this.state.reportData) {
            // Se a análise já foi gerada, o botão agora salva
            this.saveMeetingReport();
        } else {
            // Se não, ele gera a análise
            this.elements.generateAnalysisBtn.disabled = true;
            this.elements.analysisResult.innerHTML = '<div class="loader-small"></div> Gerando análise... Isso pode levar um minuto.';
            
            try {
                const student = this.state.students[this.state.currentStudentId];
                const transcription = document.getElementById('meetingTranscription').value;
                
                // 1. Pega o Cérebro Base (do brain.json)
                const baseBrain = await (await fetch('brain.json')).json();
                
                // 2. Pega o Cérebro Dinâmico (do Firebase)
                const dynamicBrainSnapshot = await this.getNodeRef('brain').once('value');
                const dynamicBrain = dynamicBrainSnapshot.val() || {};
                
                // 3. Mescla os cérebros
                const brain = { ...baseBrain, ...dynamicBrain };

                // 4. Prepara o System Prompt (Contexto)
                const systemPrompt = `
                    Você é uma Orientadora Sênior do Método Kumon com mais de 20 anos de experiência.
                    Sua função é analisar o contexto da unidade (brain) e os dados de um aluno específico (aluno) em conjunto com a transcrição de uma reunião com os pais (transcricao) para gerar um relatório estruturado em JSON.
                    
                    Seja técnica, precisa e use a terminologia do Kumon (Estágios, Ponto de Partida, Bloqueio, Material Pré-requisito).
                    
                    Contexto da Unidade (Brain): ${JSON.stringify(brain.alunos)}
                `;
                
                // 5. Prepara o User Prompt (Dados)
                const userPrompt = `
                    Aluno: ${JSON.stringify(student)}
                    Transcrição da Reunião: "${transcription}"
                    
                    Por favor, gere a análise. Responda APENAS com o objeto JSON estruturado contendo:
                    1. "diagnostico_kumon": (Análise técnica do estágio, bloqueios, ponto de partida, etc.)
                    2. "analise_psicopedagogica": (Análise comportamental, ansiedade dos pais, rotina em casa, etc.)
                    3. "plano_acao_imediato": (Próximos passos para o aluno, ex: repetir blocos, avançar, etc.)
                    4. "orientacao_aos_pais": (O que os pais devem fazer em casa.)
                    5. "ajuste_programacao": (O que a orientadora deve ajustar no planejamento do aluno.)
                `;

                // 6. Chama a API (V1 - Texto)
                const responseText = await this.callGeminiAPI(systemPrompt, userPrompt);
                
                // 7. Salva o resultado no estado
                this.state.reportData = JSON.parse(responseText);
                
                this.elements.analysisResult.innerHTML = `
                    <h4>Análise Gerada com Sucesso!</h4>
                    <p><strong>Diagnóstico Kumon:</strong> ${this.state.reportData.diagnostico_kumon}</p>
                    <p><strong>Plano de Ação:</strong> ${this.state.reportData.plano_acao_imediato}</p>
                    <p><strong>Orientação aos Pais:</strong> ${this.state.reportData.orientacao_aos_pais}</p>
                `;
                this.elements.generateAnalysisBtn.disabled = false;
                this.elements.generateAnalysisBtn.textContent = "Salvar Relatório no Histórico";
                this.elements.generateAnalysisBtn.classList.replace('btn-primary', 'btn-success');
                
            } catch (err) {
                console.error("Erro ao gerar análise:", err);
                this.elements.analysisResult.innerHTML = `<p class="error-message">Falha ao gerar análise: ${err.message}</p>`;
                this.elements.generateAnalysisBtn.disabled = false;
            }
        }
    },

    saveMeetingReport() {
        if (!this.state.reportData || !this.state.currentStudentId) return;

        const id = new Date().getTime().toString();
        const studentId = this.state.currentStudentId;
        
        const report = {
            id: id,
            date: document.getElementById('meetingDate').value,
            transcription: document.getElementById('meetingTranscription').value,
            createdAt: new Date().toISOString(), // Adicionado
            ...this.state.reportData // Adiciona o JSON gerado pela IA
        };

        this.getNodeRef(`alunos/lista_alunos/students/${studentId}/meetingHistory/${id}`).set(report)
            .then(() => {
                this.closeMeetingModal();
                this.state.reportData = null;
                this.elements.generateAnalysisBtn.textContent = "Gerar Análise";
                this.elements.generateAnalysisBtn.classList.replace('btn-success', 'btn-primary');
            })
            .catch(err => alert("Erro ao salvar relatório: " + err.message));
    },

    createMeetingCard(item) {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `
            <div class="history-item-header">
                <strong>Reunião de ${item.date}</strong>
            </div>
            <p><strong>Plano de Ação:</strong> ${item.plano_acao_imediato || 'N/A'}</p>
        `;
        el.addEventListener('click', () => this.openReportModal(item));
        return el;
    },
    
    openReportModal(report) {
        this.elements.reportModalTitle.textContent = `Relatório da Reunião (${report.date})`;
        // Formata o JSON da IA para exibição
        const formattedReport = JSON.stringify(
            {
                diagnostico_kumon: report.diagnostico_kumon,
                analise_psicopedagogica: report.analise_psicopedagogica,
                plano_acao_imediato: report.plano_acao_imediato,
                orientacao_aos_pais: report.orientacao_aos_pais,
                ajuste_programacao: report.ajuste_programacao
            }, 
            null, 
            2 // Indentação de 2 espaços
        );
        
        this.elements.reportModalBody.innerHTML = `
            <h4>Transcrição Original:</h4>
            <p class="report-transcription" style="white-space: pre-wrap; background: #f9f9f9; padding: 10px; border-radius: 5px;">${report.transcription}</p>
            <hr style="margin: 15px 0;">
            <h4>Análise e Plano de Ação (IA):</h4>
            <pre class="report-content" style="background: #f0f8ff; padding: 10px; border-radius: 5px;">${formattedReport}</pre>
        `;
        this.elements.reportModal.classList.remove('hidden');
    },

    closeReportModal() {
        this.elements.reportModal.classList.add('hidden');
    },

    // =====================================================================
    // ================== LÓGICA DE ADMIN (Cérebro, Dashboard) =============
    // =====================================================================
    
    promptForReset() { 
        const code = prompt('Código de Administrador:');
        if (code !== '*177') {
            if (code !== null) alert("Código incorreto.");
            return;
        }

        const choice = prompt("Opções de Admin:\n\nDigite 1 - RESETAR UNIDADE\nDigite 2 - ATUALIZAR CÉREBRO IA");

        if (choice === '1') {
            if (prompt('Esta ação é irreversível. Digite APAGAR TUDO para confirmar.')==='APAGAR TUDO') {
                this.hardResetUserData(); 
            } else {
                alert("Reset cancelado.");
            }
        } else if (choice === '2') {
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
            alert("Falha no reset: " + e.message);
        }
    },
    
    // Atualiza o 'brain' no Firebase com o brain.json local
    // Esta é a função que sincroniza o Cérebro Dinâmico (Store 2)
    async updateBrainFromStudents() {
        console.log("Sincronizando Cérebro (Store 2)...");
        const students = this.state.students;
        const brainData = {};

        // Formata os dados dos alunos para o cérebro
        Object.values(students).forEach(student => {
            brainData[student.id] = {
                id: student.id,
                nome: student.nome,
                estagio_matematica: student.mathStage || null,
                estagio_portugues: student.portStage || null,
                estagio_ingles: student.engStage || null,
                // (Adicionar mais KPIs se necessário)
            };
        });

        try {
            await this.getNodeRef('brain/alunos').set(brainData);
            console.log("Cérebro da IA atualizado com sucesso.");
        } catch (err) {
            console.error("Erro ao atualizar cérebro:", err);
        }
    },
    
    // Envia um NOVO brain.json para o Firebase
    handleBrainUploadModal() {
        const fileInput = document.getElementById('brainFileUploadModal');
        const file = fileInput.files[0];
        if (!file) {
            alert("Por favor, selecione um arquivo JSON.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const newBrainData = JSON.parse(event.target.result);
                // ATENÇÃO: Isso substitui o nó 'brain' inteiro
                this.getNodeRef('brain').set(newBrainData)
                    .then(() => {
                        alert("Cérebro da IA (brain.json) atualizado com sucesso!");
                        this.closeBrainModal();
                    })
                    .catch(err => alert("Erro ao salvar o cérebro: " + err.message));
            } catch (e) {
                alert("Erro: O arquivo enviado não é um JSON válido. " + e.message);
            }
        };
        reader.readAsText(file);
    },

    openDashboardModal() {
        this.elements.dashboardModal.classList.remove('hidden');
        this.renderDashboardCharts();
    },

    closeDashboardModal() {
        this.elements.dashboardModal.classList.add('hidden');
    },

    renderDashboardCharts() {
        const students = Object.values(this.state.students);
        
        // KPIs
        this.elements.kpiTotalAlunos.textContent = students.length;
        this.elements.kpiAlunosMat.textContent = students.filter(s => s.mathStage).length;
        this.elements.kpiAlunosPort.textContent = students.filter(s => s.portStage).length;
        this.elements.kpiAlunosEng.textContent = students.filter(s => s.engStage).length;
        
        // Gráfico (Destrói gráfico antigo se existir)
        if (this.state.charts.stageChart) {
            this.state.charts.stageChart.destroy();
        }
        
        // Mapeia estágios (simplificado)
        const stageMap = { 'Matemática': {}, 'Português': {}, 'Inglês': {} };
        students.forEach(s => {
            if(s.mathStage) {
                const stage = s.mathStage.charAt(0); // Pega só a letra (A, B, C)
                stageMap['Matemática'][stage] = (stageMap['Matemática'][stage] || 0) + 1;
            }
            if(s.portStage) {
                const stage = s.portStage.replace(/[0-9]/g, ''); // Pega só a letra (AI, AII, BI)
                stageMap['Português'][stage] = (stageMap['Português'][stage] || 0) + 1;
            }
            if(s.engStage) {
                const stage = s.engStage.charAt(0);
                stageMap['Inglês'][stage] = (stageMap['Inglês'][stage] || 0) + 1;
            }
        });

        const ctx = document.getElementById('stageChart').getContext('2d');
        this.state.charts.stageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(stageMap['Matemática']), // Mostra só matemática por padrão
                datasets: [{
                    label: 'Nº de Alunos em Matemática por Estágio',
                    data: Object.values(stageMap['Matemática']),
                    backgroundColor: 'rgba(0, 120, 193, 0.7)',
                    borderColor: 'rgba(0, 120, 193, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    },
    
    // =====================================================================
    // ==================== LÓGICA DA IA (V1 e V2) =========================
    // =====================================================================

    /**
     * NOVO (V2): Converte um arquivo de imagem para Base64
     * @param {File} file - O arquivo de imagem do input
     * @returns {Promise<string>} - A string Base64 (sem o data-prefix)
     */
    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remove o prefixo "data:image/jpeg;base64,"
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    },

    /**
     * ATUALIZADO (V2): Chama a API Gemini (Texto V1 ou Multimodal V2)
     * @param {string} systemPrompt - O prompt de sistema (contexto)
     * @param {string} userPrompt - O prompt do usuário (dados)
     * @param {string | null} imageBase64 - (Opcional V2) A imagem em Base64
     * @returns {Promise<string>} - A resposta em texto (JSON) da IA
     */
    async callGeminiAPI(systemPrompt, userPrompt, imageBase64 = null) {
        if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY.includes("COLE_SUA_CHAVE")) {
            throw new Error("Chave da API Gemini não configurada em js/config.js");
        }

        const apiKey = window.GEMINI_API_KEY;
        const model = this.state.geminiModel; // gemini-2.5-flash-preview-09-2025
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Prepara o payload
        let payload;

        if (imageBase64) {
            // --- PAYLOAD MULTIMODAL (V2 - Análise de Tarefa) ---
            payload = {
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: userPrompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg", // Assumimos JPEG por padrão
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ],
                // Força a saída a ser JSON
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };
        } else {
            // --- PAYLOAD DE TEXTO (V1 - Diário de Reunião) ---
            payload = {
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userPrompt }]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };
        }
        
        // Faz a chamada de API
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Erro da API Gemini:", errorBody);
            throw new Error(`Falha na API: ${errorBody.error.message}`);
        }

        const result = await response.json();
        
        // Extrai o texto da resposta
        if (result.candidates && result.candidates.length > 0) {
            const parts = result.candidates[0].content.parts;
            if (parts && parts.length > 0 && parts[0].text) {
                return parts[0].text;
            }
        }
        
        throw new Error("Resposta da IA inválida ou vazia.");
    },

    // =====================================================================
    // ================= NOVO (V2): Análise de Tarefas (IA Multimodal) =====
    // =====================================================================

    openTaskAnalysisModal() {
        // Reseta o formulário
        this.elements.taskAnalysisForm.reset();
        this.elements.taskAnalysisStatusContainer.classList.add('hidden');
        this.elements.taskAnalysisProgressBar.style.width = '0%';
        this.elements.taskAnalysisProgressBar.textContent = '0%';
        this.elements.taskAnalysisStatus.textContent = 'Aguardando arquivos...';
        this.elements.startTaskAnalysisBtn.disabled = false;
        
        this.elements.taskAnalysisModal.classList.remove('hidden');
    },

    closeTaskAnalysisModal() {
        this.elements.taskAnalysisModal.classList.add('hidden');
    },

    /**
     * NOVO (V2): Lida com o submit do form de análise de tarefas
     */
    async handleTaskAnalysisSubmit(e) {
        e.preventDefault();
        
        const files = this.elements.taskFilesInput.files;
        if (!files || files.length === 0) {
            alert("Por favor, selecione pelo menos uma imagem.");
            return;
        }

        this.elements.startTaskAnalysisBtn.disabled = true;
        this.elements.taskAnalysisStatusContainer.classList.remove('hidden');

        const studentId = this.state.currentStudentId;
        const performanceLog = []; // Array temporário para os resultados

        // O Prompt de Sistema (Sênior Orientadora)
        const systemPrompt = `
            Você é uma Orientadora Sênior do Método Kumon com 20 anos de experiência, especializada em análise de material.
            Sua função é analisar a imagem de UMA única folha de tarefa ou boletim do Kumon.
            Você DEVE retornar APENAS um objeto JSON. Não inclua markdown (\`\`\`json) ou qualquer outro texto.
            
            O JSON deve ter esta estrutura:
            {
              "data": "DD/MM/AAAA" (A data em que a tarefa foi feita, escrita na folha),
              "estagio": "X" (O estágio, ex: "C", "D", "CII"),
              "folha": "YYYa/b" (O número da folha, ex: "131a", "140b", "100"),
              "tempoTotal": "X min" (O tempo total gasto, ex: "15 min", "20 min"),
              "nota": "XXX" (A nota, ex: "100", "90", "A", "C"),
              "observacao": "qualquer anotação relevante, como 'REPETIÇÃO' ou 'ACIMA DE 2 ERROS'"
            }
            
            Se um campo NÃO for claramente visível na imagem (ex: a data está cortada), retorne null para aquele campo.
            Seja 100% factual com base APENAS no que está na imagem.
        `;

        // O Prompt de Usuário (Contexto)
        const userPrompt = "Analise a imagem desta tarefa e retorne o JSON estruturado.";

        // Inicia a fila de processamento
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const total = files.length;
            
            // Atualiza a UI de progresso
            const progressPercent = Math.round(((i + 1) / total) * 100);
            this.elements.taskAnalysisStatus.textContent = `Processando imagem ${i + 1} de ${total} (${file.name})...`;
            this.elements.taskAnalysisProgressBar.style.width = `${progressPercent}%`;
            this.elements.taskAnalysisProgressBar.textContent = `${progressPercent}%`;

            try {
                // 1. Converte a imagem para Base64
                const imageBase64 = await this.imageToBase64(file);
                
                // 2. Chama a API Gemini (Multimodal)
                const responseText = await this.callGeminiAPI(systemPrompt, userPrompt, imageBase64);
                
                // 3. Valida e adiciona ao log
                const resultJson = JSON.parse(responseText);
                resultJson.id = new Date().getTime().toString() + i; // ID único
                resultJson.createdAt = new Date().toISOString();
                performanceLog.push(resultJson);
                
                console.log(`Sucesso Imagem ${i+1}:`, resultJson);

            } catch (err) {
                console.error(`Falha ao processar imagem ${i + 1} (${file.name}):`, err);
                // Se uma falhar, registramos no log e continuamos
                performanceLog.push({
                    id: new Date().getTime().toString() + i,
                    createdAt: new Date().toISOString(),
                    data: "FALHA",
                    estagio: file.name,
                    folha: "FALHA",
                    tempoTotal: null,
                    nota: null,
                    observacao: `Erro ao analisar: ${err.message}`
                });
            }
        }

        // 4. Loop terminou. Salva o log completo no Firebase.
        this.elements.taskAnalysisStatus.textContent = "Análise concluída! Salvando no banco de dados...";
        
        try {
            // Pega o log antigo (se existir) e mescla com o novo
            const logRef = this.getNodeRef(`alunos/lista_alunos/students/${studentId}/performanceLog`);
            const snapshot = await logRef.once('value');
            const existingLog = snapshot.val() || {};
            
            const newLogObject = {};
            performanceLog.forEach(log => {
                newLogObject[log.id] = log;
            });
            
            // Mescla o log antigo com o novo
            const combinedLog = { ...existingLog, ...newLogObject };

            // Salva o log combinado
            await logRef.set(combinedLog);
            
            this.elements.taskAnalysisStatus.textContent = "Sucesso! Log de performance atualizado.";
            this.elements.startTaskAnalysisBtn.disabled = false;
            
            // Fecha o modal após 2 segundos
            setTimeout(() => {
                this.closeTaskAnalysisModal();
            }, 2000);

        } catch (err) {
            console.error("Erro ao salvar o log de performance:", err);
            this.elements.taskAnalysisStatus.textContent = "Erro ao salvar no banco de dados.";
            this.elements.startTaskAnalysisBtn.disabled = false;
        }
    },
    
    /**
     * NOVO (V2): Cria o item de UI para o Log de Performance
     */
    createPerformanceLogItem(item) {
        const el = document.createElement('div');
        el.className = 'log-item';
        // Define a cor da nota
        let notaColor = 'var(--text-color)';
        if (item.nota === '100') notaColor = 'var(--success)';
        if (item.nota === 'C' || item.observacao?.includes('REPETIÇÃO')) notaColor = 'var(--kumon-red)';

        el.innerHTML = `
            <span class="log-item-date">${item.data || 'N/A'}</span>
            <div class="log-item-details">
                <span>${item.estagio || '?'} - ${item.folha || '?'}</span>
                <span class="log-time"><i class='bx bx-time-five'></i> ${item.tempoTotal || 'N/A'}</span>
                <span class="log-note" style="color: ${notaColor}; font-weight: bold;"><i class='bx bx-check-double'></i> ${item.nota || 'N/A'}</span>
            </div>
        `;
        // (Opcional: Adicionar um clique para ver a imagem original)
        return el;
    },


    // =====================================================================
    // ======================== UTILIDADES (Abas, etc) =====================
    // =====================================================================

    openTab(evt, tabName) {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].classList.remove("active");
        }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }
        document.getElementById(tabName).classList.add("active");
        if (evt) {
            evt.currentTarget.classList.add("active");
        }
    }
};
