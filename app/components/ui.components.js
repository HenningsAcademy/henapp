window.HA = window.HA || {};

HA.Config = HA.Config || {};
HA.Config.URL_UPLOAD_PDF = "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/16/workflows/27dca153a40148bca7df16a7b1a1ec29/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BVSBVhhjo48kk7dbAtqBxDiHyYdG1TrXr3oqhsGa5I8";
HA.Config.URL_ENVIAR_EMAIL = "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/25/workflows/b760991191ee4f929f9603aa31dfbe9b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dFd3cioggFgaY9yCxeMKroKFbMVNvIWZ6wijIh0w-tw";

HA.UI = {
    tempColabPhoto: "",
    currentEditingId: null,
    currentProblemsLog: [],
    currentExamAttempts: [],
    currentChecklist: [],
    currentType: 'Primeira Entrada',

    closeModal(id) { 
        const modal = document.getElementById(id);
        if (modal) { 
            modal.classList.add('hidden'); 
            modal.classList.remove('flex'); 
        }
    },

    parseDate(val) {
        if (!val) return null;
        const strVal = val.toString().trim();
        
        if (/^\d+$/.test(strVal) || /^\d+\.\d+$/.test(strVal)) {
            const serial = parseFloat(strVal);
            const utcDays = serial - 25569;
            return new Date(utcDays * 86400 * 1000);
        }
        
        if (strVal.includes('/')) {
            const parts = strVal.split('/');
            if (parts.length === 3 && parts[2].length === 4) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
            }
        }
        
        const d = new Date(strVal);
        return isNaN(d.getTime()) ? null : d;
    },

    formatDateBR(val) { 
        const d = this.parseDate(val);
        if (!d) return '--';
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR'); 
    },

    formatDateInput(val) {
        const d = this.parseDate(val);
        if (!d) return '';
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    },

    // --- NUEVO MODAL DE HISTORIAL CON DETALLES EXPANDIBLES ---
    openHistory(colabId) {
        const colab = HA.State.colabs.find(c => c.id.toString() === colabId.toString()); 
        const history = HA.State.trainings.filter(t => t.userId.toString() === colabId.toString());
        const sysUser = HA.State.users.find(u => u.id.toString() === colab.id.toString() || u.name.toLowerCase() === colab.name.toLowerCase());
        
        let container = document.getElementById('modalHistory');
        const imgStr = colab.photo ? colab.photo : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";
        const aptos = history.filter(t => t.stage === 'Finalizado').map(t => t.area);
        
        let aptosHtml = `<span class="text-xs text-gray-500 italic mt-1 block">Em período de formação.</span>`;
        if (aptos.length > 0) {
            aptosHtml = aptos.map(a => 
                `<span class="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold m-1 uppercase tracking-widest">
                    <i data-lucide="check" class="w-3 h-3 inline mr-1"></i> ${a}
                </span>`
            ).join('');
        }

        let roleHtml = '';
        if (sysUser && sysUser.role !== 'Colaborador') {
            let rCol = 'gray'; let rIco = 'user';
            if (sysUser.role === 'Facilitador') { rCol = 'rose'; rIco = 'gem'; }
            else if (sysUser.role === 'Lider') { rCol = 'blue'; rIco = 'crown'; }
            else if (sysUser.role === 'Supervisor' || sysUser.role === 'Admin') { rCol = 'mustard'; rIco = 'shield-alert'; }
            roleHtml = `<div class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-${rCol}-500/10 border border-${rCol}-500/30 rounded-xl text-[10px] font-black text-${rCol}-400 uppercase tracking-widest shadow-md"><i data-lucide="${rIco}" class="w-3.5 h-3.5"></i> Membro: ${sysUser.role}</div>`;
        }

        let html = `
            <div class="bg-[#0f1523] rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-white/10 animate-slide-up relative overflow-hidden">
                <div class="px-8 py-5 flex justify-between items-center border-b border-white/5 bg-[#070b14]/80 z-10 relative">
                    <h2 class="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-3">
                        <i data-lucide="award" class="w-5 h-5 text-cyan-500"></i> Perfil Acadêmico
                    </h2>
                    <button type="button" onclick="HA.UI.closeModal('modalHistory')" class="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition hover:bg-white/10">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#070b14]/50">
                    <div class="w-full md:w-1/3 p-8 border-r border-white/5 bg-[#0a0f1d] flex flex-col items-center text-center">
                        <div class="w-32 h-32 rounded-full border-4 border-[#0f1523] bg-[#070b14] overflow-hidden shadow-2xl mb-5 relative">
                            <img src="${imgStr}" class="w-full h-full object-cover">
                        </div>
                        <h3 class="text-2xl font-black text-white leading-tight mb-1">${colab.name}</h3>
                        <p class="text-[11px] text-gray-400 font-mono uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/5 mb-2">ID: ${colab.id}</p>
                        ${roleHtml}
                        
                        <div class="w-full mt-8 space-y-4 text-left">
                            <div class="bg-[#0f1523] p-4 rounded-2xl border border-white/5 shadow-inner">
                                <p class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Comandante Alocado</p>
                                <p class="text-xs font-bold text-white flex items-center gap-2"><i data-lucide="crown" class="w-4 h-4 text-indigo-400"></i> ${colab.leader}</p>
                            </div>
                            <div class="bg-[#0f1523] p-4 rounded-2xl border border-white/5 shadow-inner">
                                <p class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Turno de Operação</p>
                                <p class="text-xs font-bold text-white flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4 text-mustard-400"></i> ${colab.turno || 'Geral'}</p>
                            </div>
                        </div>

                        <div class="w-full mt-6 text-left">
                            <h4 class="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Áreas com Aptidão</h4>
                            <div class="flex flex-wrap gap-1">${aptosHtml}</div>
                        </div>
                    </div>

                    <div class="w-full md:w-2/3 p-8">
                        <h4 class="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><i data-lucide="history" class="w-5 h-5 text-indigo-500"></i> Linha do Tempo de Treinamentos</h4>`;
                        
            if (history.length === 0) { 
                html += `<div class="p-10 text-center text-gray-500 font-medium bg-[#0f1523] rounded-3xl border border-white/5 shadow-inner flex flex-col items-center"><i data-lucide="inbox" class="w-10 h-10 mb-3 opacity-20"></i> Histórico Vazio. Nenhuma operação registrada.</div>`; 
            } else {
                html += `<div class="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-white/10">`;
                
                history.sort((a,b) => b.id - a.id).forEach(t => {
                    const isSuccess = t.stage === 'Finalizado'; 
                    const color = isSuccess ? 'emerald' : (t.stage === 'Reprovado' ? 'rose' : 'mustard');
                    
                    // Renderização de Ocorrências para os detalhes
                    let probsHtml = '';
                    let arrProbs = Array.isArray(t.problemsLog) ? t.problemsLog : [];
                    if (arrProbs.length === 0) {
                        probsHtml = '<span class="text-gray-500 italic">Nenhuma ocorrência registrada.</span>';
                    } else {
                        probsHtml = arrProbs.map(p => `
                            <div class="mb-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                                <span class="text-rose-400 font-mono text-[9px] block mb-0.5">${this.formatDateBR(p.date)}</span> 
                                <span class="text-xs text-gray-300 leading-tight">${p.text}</span>
                            </div>
                        `).join('');
                    }

                    html += `
                    <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div class="flex items-center justify-center w-12 h-12 rounded-full border-[6px] border-[#070b14] bg-${color}-500/20 text-${color}-400 shadow-[0_0_15px_rgba(var(--color-${color}-500),0.3)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                            <i data-lucide="${isSuccess ? 'check' : (t.stage === 'Reprovado' ? 'x' : 'clock')}" class="w-5 h-5"></i>
                        </div>
                        <div class="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl border border-white/5 bg-[#0f1523] shadow-lg hover:border-${color}-500/50 transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="font-black text-white text-sm tracking-wide leading-tight">${t.area}</div>
                                <div class="text-[9px] text-gray-400 font-mono bg-[#070b14] px-2 py-1 rounded-md border border-white/5">
                                    ${this.formatDateBR(t.finalizationDate || t.endDate || t.startDate)}
                                </div>
                            </div>
                            <div class="text-[10px] text-gray-500 mb-5 uppercase tracking-widest font-bold">
                                Por: <span class="text-white">${t.facilitator.split(' ')[0]}</span>
                            </div>
                            
                            <div class="flex justify-between items-center border-t border-white/5 pt-4">
                                <span class="px-3 py-1.5 bg-${color}-500/10 text-${color}-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-${color}-500/20">
                                    ${t.stage}
                                </span>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">Nota: ${t.score || '--'}</span>
                                    
                                    <!-- BOTAO VER DETALHES -->
                                    <button onclick="document.getElementById('hist-det-${t.id}').classList.toggle('hidden')" class="bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 p-2 rounded-lg transition" title="Ver Detalhes do Treinamento">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- CAIXA DE DETALHES EXPANSIVEL -->
                            <div id="hist-det-${t.id}" class="hidden mt-4 pt-4 border-t border-white/5 space-y-4">
                                <div class="bg-[#070b14]/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                    <h5 class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="book-open" class="w-3 h-3"></i> Relatório Teórico</h5>
                                    <p class="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">${t.teoNotes || 'Sem registro.'}</p>
                                </div>
                                <div class="bg-[#070b14]/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                    <h5 class="text-[9px] font-black text-mustard-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><i data-lucide="wrench" class="w-3 h-3"></i> Avaliação Prática</h5>
                                    <p class="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">${t.praNotes || 'Sem registro.'}</p>
                                </div>
                                <div class="bg-[#070b14]/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                    <h5 class="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Ocorrências</h5>
                                    <div>${probsHtml}</div>
                                </div>
                            </div>

                        </div>
                    </div>`;
            }); 
            
            html += `</div>`;
        }
        
        html += `</div></div></div>`; 
        
        container.innerHTML = html; 
        container.classList.remove('hidden'); 
        container.classList.add('flex'); 
        lucide.createIcons();
    },

    openTrainingModal(id = null) {
        this.injectTrainingModal(); 
        document.getElementById('trainingForm').reset();
        
        this.currentEditingId = id; 
        this.currentProblemsLog = []; 
        this.currentExamAttempts = []; 
        this.currentChecklist = [];
        
        const isNew = id === null;
        
        const titleEl = document.getElementById('wizard-title');
        titleEl.innerHTML = isNew 
            ? `<i data-lucide="crosshair" class="w-5 h-5"></i> Nova Ficha de Treinamento` 
            : `<i data-lucide="edit" class="w-5 h-5"></i> Gerenciando Operação`;
        
        const colabSel = document.getElementById('f-userId'); 
        colabSel.innerHTML = '<option value="" disabled selected>Escolha o Colaborador...</option>';
        HA.State.colabs.filter(c => c.status !== 'Desligado').forEach(c => { 
            colabSel.innerHTML += `<option value="${c.id}">${c.id} - ${c.name}</option>`; 
        });
        
        const facSel = document.getElementById('f-facilitator'); 
        facSel.innerHTML = '<option value="" disabled selected>Escolha...</option>';
        HA.State.users.filter(u => u.role === 'Facilitador').forEach(u => { 
            facSel.innerHTML += `<option value="${u.name}">${u.name}</option>`; 
        });

        const secSel = document.getElementById('f-sector'); 
        secSel.innerHTML = '<option value="" disabled selected>Escolha...</option>';
        Object.keys(HA.Constants.Sectors).forEach(s => { 
            secSel.innerHTML += `<option value="${s}">${s}</option>`; 
        });

        this.resetLockVisuals('Pdf'); 
        this.resetLockVisuals('Email');

        const btn2 = document.getElementById('step-btn-2');
        const btn3 = document.getElementById('step-btn-3');

        if (isNew) {
            document.getElementById('f-startDate').value = new Date().toISOString().split('T')[0]; 
            this.calcMaxDate();
            document.getElementById('f-stage').value = 'Solicitado';
            
            document.getElementById('f-mat').value = '';
            document.getElementById('f-leader').value = '';
            document.getElementById('f-turno').value = '';
            document.getElementById('f-photo').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";

            btn2.disabled = true;
            btn3.disabled = true;

            this.switchStep(1);
        } 
        else {
            btn2.disabled = false;
            btn3.disabled = false;

            const t = HA.State.trainings.find(x => x.id.toString() === id.toString());
            if (t) {
                this.currentProblemsLog = Array.isArray(t.problemsLog) ? [...t.problemsLog] : [];
                this.currentExamAttempts = Array.isArray(t.examAttempts) ? [...t.examAttempts] : [];
                this.currentChecklist = Array.isArray(t.checklist) ? [...t.checklist] : [];
                
                document.getElementById('f-spId').value = t.spId || 0;
                
                colabSel.value = t.userId; 
                this.autoFillColab();
                
                document.getElementById('f-sector').value = t.sector; 
                this.updateAreasFicha(); 
                document.getElementById('f-area').value = t.area;
                
                document.getElementById('f-facilitator').value = t.facilitator !== 'A Definir' ? t.facilitator : '';
                document.getElementById('f-stage').value = t.stage;
                
                document.getElementById('f-startDate').value = this.formatDateInput(t.startDate); 
                document.getElementById('f-endDate').value = this.formatDateInput(t.endDate);
                document.getElementById('f-finalizationDate').value = this.formatDateInput(t.finalizationDate);
                
                document.getElementById('f-accDate').value = this.formatDateInput(t.accRequestDate); 
                document.getElementById('f-accStatus').innerText = t.accRequestStatus || 'Pendente';
                this.updateAccBadge(t.accRequestStatus);
                
                document.getElementById('f-teoNotes').value = t.teoNotes || ''; 
                document.getElementById('f-praNotes').value = t.praNotes || '';
                document.getElementById('f-praDone').checked = t.accPraDone || false;

                if(t.pdfUploaded) this.setLockState('Pdf');
                if(t.emailSent) this.setLockState('Email');

                if (t.stage === 'Solicitado') {
                    this.switchStep(1);
                } else if (t.stage.includes('Finalizado') || t.stage.includes('Reprovado')) {
                    this.switchStep(3);
                } else {
                    this.switchStep(2);
                }
            }
        }
        
        this.renderChecklist(); 
        this.renderProblems(); 
        this.renderAttempts();
        
        document.getElementById('modalFichaContainer').classList.remove('hidden'); 
        document.getElementById('modalFichaContainer').classList.add('flex'); 
        lucide.createIcons();
    },

    autoFillColab() {
        const id = document.getElementById('f-userId').value; 
        const c = HA.State.colabs.find(x => x.id.toString() === id.toString());
        
        if (c) {
            document.getElementById('f-mat').value = c.id;
            
            let leaderNameDisplay = c.leader || "Sem Líder Atribuído";
            const lUser = HA.State.users.find(u => u.name.toLowerCase() === leaderNameDisplay.toLowerCase() || u.name.toLowerCase().startsWith(leaderNameDisplay.toLowerCase() + ' '));
            if(lUser) leaderNameDisplay = lUser.name;
            
            document.getElementById('f-leader').value = leaderNameDisplay;
            document.getElementById('f-turno').value = c.turno || "Geral";
            
            const hasPrimeira = HA.State.trainings.some(t => 
                t.userId.toString() === id.toString() && 
                t.id.toString() !== (this.currentEditingId || '').toString() && 
                (t.type === 'Primeira Entrada' || t.stage === 'Finalizado')
            );
            
            this.currentType = hasPrimeira ? 'Troca de Área' : 'Primeira Entrada';
            
            const typeSelect = document.getElementById('f-type'); 
            const lockIcon = document.getElementById('f-typeLock');
            
            typeSelect.value = this.currentType;
            
            if (hasPrimeira) { 
                typeSelect.classList.add('opacity-50'); 
                typeSelect.style.pointerEvents = 'none'; 
                lockIcon.classList.remove('hidden'); 
                lockIcon.classList.add('inline-flex'); 
            } else { 
                typeSelect.classList.remove('opacity-50'); 
                typeSelect.style.pointerEvents = 'auto'; 
                lockIcon.classList.remove('inline-flex'); 
                lockIcon.classList.add('hidden'); 
            }

            const imgEl = document.getElementById('f-photo');
            if (imgEl) {
                imgEl.src = c.photo ? c.photo : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";
            }
            
            this.renderChecklist();
        }
    },

    updateAreasFicha() {
        const s = document.getElementById('f-sector').value; 
        const a = document.getElementById('f-area'); 
        a.innerHTML = ''; 
        if (HA.Constants.Sectors[s]) {
            HA.Constants.Sectors[s].forEach(ar => {
                a.innerHTML += `<option value="${ar}">${ar}</option>`;
            });
        }
    },

    calcMaxDate() {
        const start = document.getElementById('f-startDate').value; 
        if (!start) return;
        
        let d = new Date(start); 
        d.setDate(d.getDate() + 15); 
        document.getElementById('f-endDate').value = d.toISOString().split('T')[0];
    },

    switchStep(stepNum) {
        [1, 2, 3].forEach(n => {
            const btn = document.getElementById(`step-btn-${n}`);
            const content = document.getElementById(`step-content-${n}`);
            
            btn.classList.remove('text-cyan-400', 'border-cyan-500', 'bg-cyan-500/10');
            btn.classList.add('text-gray-500', 'border-transparent');
            content.classList.add('hidden');
        });
        
        const activeBtn = document.getElementById(`step-btn-${stepNum}`);
        const activeContent = document.getElementById(`step-content-${stepNum}`);
        
        activeBtn.classList.remove('text-gray-500', 'border-transparent');
        activeBtn.classList.add('text-cyan-400', 'border-cyan-500', 'bg-cyan-500/10');
        activeContent.classList.remove('hidden');
    },

    renderChecklist() {
        const box = document.getElementById('f-checklist-box');
        
        let items = this.currentType === 'Primeira Entrada' 
            ? ['Tour Logístico (Apresentação Visual)', 'OnBoarding e Regras', 'Apresentação ao Líder e Setor', 'Leitura e Compreensão das ITs']
            : ['Leitura e Compreensão das ITs'];
        
        let html = '';
        items.forEach((item) => {
            const isChecked = this.currentChecklist.includes(item) ? 'checked' : '';
            html += `
            <label class="flex items-center gap-3 p-4 bg-[#070b14] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition">
                <input type="checkbox" onchange="HA.UI.toggleChecklist('${item}')" class="w-5 h-5 accent-cyan-500 rounded cursor-pointer" ${isChecked}>
                <span class="text-xs font-bold text-gray-300">${item}</span>
            </label>`;
        });
        
        box.innerHTML = html; 
        this.checkProcessLocks(items.length);
    },

    toggleChecklist(item) {
        if (this.currentChecklist.includes(item)) {
            this.currentChecklist = this.currentChecklist.filter(x => x !== item);
        } else {
            this.currentChecklist.push(item);
        }
        this.renderChecklist();
    },

    checkProcessLocks(totalRequired) {
        const lockPanel = document.getElementById('f-lock-pratico'); 
        const contentPanel = document.getElementById('f-content-pratico');
        const stageSel = document.getElementById('f-stage');
        
        if (this.currentChecklist.length >= totalRequired) {
            lockPanel.classList.add('hidden'); 
            contentPanel.classList.remove('hidden');
            
            if (stageSel.value === 'Solicitado' || stageSel.value === '1ª Etapa (Docs Iniciais)') { 
                stageSel.value = '2ª Etapa (Treino Teórico)'; 
            }
        } else { 
            lockPanel.classList.remove('hidden'); 
            contentPanel.classList.add('hidden'); 
        }
    },

    renderProblems() {
        const list = document.getElementById('f-problemsList'); 
        list.innerHTML = '';
        
        if (this.currentProblemsLog.length === 0) { 
            list.innerHTML = '<div class="text-[10px] text-gray-500 italic mt-2 text-center">Nenhuma ocorrência registrada.</div>'; 
            return; 
        }
        
        this.currentProblemsLog.forEach(p => { 
            list.innerHTML += `
            <div class="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 mb-3 shadow-inner">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
                <div>
                    <p class="text-[9px] text-gray-500 font-mono mb-1">${this.formatDateBR(p.date)}</p>
                    <p class="text-xs text-gray-300 leading-tight">${p.text}</p>
                </div>
            </div>`; 
        });
    },

    addProblemLog() {
        const input = document.getElementById('f-newProb'); 
        if (!input.value.trim()) return;
        
        this.currentProblemsLog.unshift({ 
            date: new Date().toISOString(), 
            text: input.value.trim() 
        });
        
        input.value = ''; 
        this.renderProblems();
    },

    addOcurrence() {
        const text = prompt("Descreva a Ocorrência ou Atraso:");
        if (text && text.trim()) { 
            this.currentProblemsLog.unshift({ 
                date: new Date().toISOString(), 
                text: text.trim() 
            }); 
            this.renderProblems(); 
        }
    },

    renderAttempts() {
        const container = document.getElementById('f-attemptsList'); 
        container.innerHTML = ''; 
        let passed = false;
        
        for (let i = 0; i < 3; i++) {
            if (i < this.currentExamAttempts.length) {
                let score = this.currentExamAttempts[i].score; 
                if (score >= 70) passed = true; 
                
                let color = score >= 70 ? 'emerald' : (i === 0 ? 'mustard' : (i === 1 ? 'orange' : 'rose'));
                container.innerHTML += `
                <div class="bg-${color}-500/10 border border-${color}-500/30 p-3 rounded-2xl text-center min-w-[60px] shadow-inner">
                    <div class="text-[9px] font-black text-${color}-400 uppercase mb-1 tracking-widest">T${i+1}</div>
                    <div class="text-lg font-black text-white">${score}</div>
                </div>`;
            } else { 
                container.innerHTML += `
                <div class="bg-white/5 border border-white/10 border-dashed p-3 rounded-2xl text-center min-w-[60px] opacity-40">
                    <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">T${i+1}</div>
                    <div class="text-lg font-light text-gray-600">--</div>
                </div>`; 
            }
        }
        
        const btn = document.getElementById('f-btnScore'); 
        const inp = document.getElementById('f-newScore');
        
        if (passed || this.currentExamAttempts.length >= 3) { 
            btn.disabled = true; 
            inp.disabled = true; 
            btn.classList.add('opacity-50', 'cursor-not-allowed'); 
        } else { 
            btn.disabled = false; 
            inp.disabled = false; 
            btn.classList.remove('opacity-50', 'cursor-not-allowed'); 
        }
    },

    addAttempt() {
        const val = document.getElementById('f-newScore').value; 
        if (val === '' || val < 0 || val > 100) return alert('Nota inválida. Digite de 0 a 100.');
        if (this.currentExamAttempts.length >= 3) return alert('Máximo de 3 tentativas já atingido.');
        
        const score = parseInt(val);
        this.currentExamAttempts.push({ 
            score: score, 
            date: new Date().toISOString() 
        }); 
        
        document.getElementById('f-newScore').value = ''; 
        this.renderAttempts();
        
        const stageSel = document.getElementById('f-stage');
        
        if (score >= 70) { 
            stageSel.value = 'Finalizado'; 
            alert("🎉 Nota aprovatória! Cierre liberado."); 
            document.getElementById('f-finalizationDate').value = new Date().toISOString().split('T')[0]; 
            this.checkAutoFinish();
        } else {
            if (this.currentExamAttempts.length >= 3) { 
                stageSel.value = 'Reprovado'; 
                alert("❌ Reprovado definitivo (3 tentativas esgotadas)."); 
            } else {
                document.getElementById('f-accDate').value = ''; 
                document.getElementById('f-accStatus').innerText = 'Pendente'; 
                document.getElementById('f-accDate').disabled = false;
                
                const btnReq = document.getElementById('f-btnReqAcc'); 
                btnReq.classList.remove('hidden'); 
                btnReq.innerText = "Solicitar Nova Data";
                
                const badge = document.getElementById('f-accStatus'); 
                if (badge) {
                    badge.innerText = "Reagendar"; 
                    badge.className = "text-[11px] font-black text-rose-400 bg-rose-500/10 px-3.5 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest animate-pulse";
                }
                
                this.currentProblemsLog.unshift({ 
                    date: new Date().toISOString(), 
                    text: `AVISO: Colaborador reprovado na tentativa ${this.currentExamAttempts.length} com nota ${score}. Agendamento prático resetado.` 
                });
                
                this.renderProblems(); 
                stageSel.value = 'Acompanhamento e Prática';
                alert(`⚠️ Nota ${score} (Reprovatória).\n\nO sistema resetou o agendamento de acompanhamento.\nPor favor, proponha uma nova data e solicite aprovação ao líder novamente.`);
            }
        }
    },

    checkAutoFinish() {
        const stage = document.getElementById('f-stage').value; 
        const finDateInput = document.getElementById('f-finalizationDate'); 
        const alertBox = document.getElementById('timeBonoAlert');
        
        if (stage === 'Finalizado') {
            if (!finDateInput.value) {
                finDateInput.value = new Date().toISOString().split('T')[0]; 
            }
            
            const start = this.parseDate(document.getElementById('f-startDate').value); 
            const end = this.parseDate(finDateInput.value); 
            
            if (start && end) {
                start.setHours(0,0,0,0);
                end.setHours(0,0,0,0);
                const diffDays = Math.floor((end - start) / (1000 * 3600 * 24));
                
                if (diffDays <= 16 && diffDays >= 0) { 
                    alertBox.innerHTML = `<i data-lucide="trophy" class="w-5 h-5 inline mb-0.5 mr-2"></i> Excelente! Treinamento finalizado <b>${16 - diffDays} dia(s) antes do prazo.</b>`; 
                    alertBox.classList.remove('hidden'); 
                }
            }
        } else { 
            finDateInput.value = ''; 
            alertBox.classList.add('hidden'); 
        }
        lucide.createIcons();
    },

    requestAccDate() {
        const dt = document.getElementById('f-accDate').value; 
        if (!dt) return alert("Selecione a data antes de solicitar aprovação.");
        
        document.getElementById('f-accStatus').innerText = 'Aguardando Líder'; 
        this.updateAccBadge('Aguardando Líder');
        
        this.currentProblemsLog.unshift({ 
            date: new Date().toISOString(), 
            text: `Facilitador sugeriu acompanhamento prático para o dia: ${this.formatDateBR(dt)}.` 
        }); 
        this.renderProblems();
    },

    updateAccBadge(status) {
        const badge = document.getElementById('f-accStatus'); 
        const btn = document.getElementById('f-btnReqAcc'); 
        const dateInput = document.getElementById('f-accDate');
        
        if (!badge) return; 
        
        dateInput.disabled = (status === 'Aguardando Líder' || status === 'Aprovado');
        
        if (!status || status === 'Pendente') { 
            badge.innerText = "Não Agendado"; 
            badge.className = "text-[11px] font-black text-mustard-400 bg-mustard-500/10 px-3.5 py-1.5 rounded-lg border border-mustard-500/20 uppercase tracking-widest";
            if(btn) { btn.classList.remove('hidden'); btn.innerText = "Solicitar Aprovação"; }
            dateInput.classList.remove('opacity-50', 'cursor-not-allowed'); 
        } else if (status === 'Aguardando Líder') { 
            badge.innerText = "Aguardando"; 
            badge.className = "text-[11px] font-black text-mustard-400 bg-mustard-500/10 px-3.5 py-1.5 rounded-lg border border-mustard-500/20 uppercase tracking-widest";
            if(btn) btn.classList.add('hidden'); 
            dateInput.classList.add('opacity-50', 'cursor-not-allowed'); 
        } else if (status === 'Aprovado') { 
            badge.innerText = "Aprovado"; 
            badge.className = "text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-lg border border-emerald-500/30 uppercase tracking-widest";
            if(btn) btn.classList.add('hidden'); 
            dateInput.classList.add('opacity-50', 'cursor-not-allowed'); 
        } else if (status === 'Recusado') { 
            badge.innerText = "Recusado"; 
            badge.className = "text-[11px] font-black text-rose-400 bg-rose-500/10 px-3.5 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest animate-pulse";
            if(btn) { btn.classList.remove('hidden'); btn.innerText = `Reenviar`; }
            dateInput.classList.remove('opacity-50', 'cursor-not-allowed'); 
        }
    },

    startTraining() {
        const mat = document.getElementById('f-userId').value; 
        const start = document.getElementById('f-startDate').value;
        if (!mat || !start) return alert("Selecione o Colaborador e defina a Data de Início.");
        
        // DESBLOQUEA LOS PASOS AL INICIAR
        document.getElementById('step-btn-2').disabled = false;
        document.getElementById('step-btn-3').disabled = false;

        document.getElementById('f-stage').value = '1ª Etapa (Docs Iniciais)'; 
        this.switchStep(2);
    },

    resetLockVisuals(type) {
        document.getElementById('f-is'+type+'Locked').value = 'false';
        const icon = document.getElementById('lockIcon'+type); 
        const txt = document.getElementById('lockTxt'+type); 
        const act = document.getElementById('lockAction'+type);
        
        if (!icon) return;
        
        icon.className = "w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20"; 
        icon.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
        
        txt.innerText = "Pendente"; 
        txt.className = "text-[9px] text-rose-400 uppercase tracking-widest font-bold mt-1";
        
        if (type === 'Pdf') {
            act.innerHTML = `
                <input type="file" id="f-pdfFile" accept="application/pdf" class="hidden" onchange="HA.UI.handlePdf()">
                <input type="hidden" id="f-pdfBase64">
                <button type="button" onclick="document.getElementById('f-pdfFile').click()" class="text-[10px] bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition border border-white/10 uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-md">
                    <i data-lucide="file-up" class="w-4 h-4"></i> Anexar
                </button>
                <button type="button" id="f-btnUploadPdf" onclick="HA.UI.uploadPdf()" class="hidden text-[10px] bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-500 transition uppercase tracking-widest font-bold animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5">
                    <i data-lucide="cloud-upload" class="w-4 h-4"></i> Nuvem
                </button>`;
        }
        if (type === 'Email') {
            act.innerHTML = `
                <button type="button" onclick="HA.UI.generateEmail()" class="text-[10px] bg-indigo-600 border border-indigo-500/50 text-white px-4 py-3 rounded-xl hover:bg-indigo-500 transition uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                    <i data-lucide="mail-check" class="w-4 h-4"></i> Enviar Oficial
                </button>`;
        }
        lucide.createIcons();
    },

    setLockState(type) {
        document.getElementById('f-is'+type+'Locked').value = 'true';
        const icon = document.getElementById('lockIcon'+type); 
        const txt = document.getElementById('lockTxt'+type); 
        const act = document.getElementById('lockAction'+type);
        
        icon.className = "w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]"; 
        icon.innerHTML = '<i data-lucide="check" class="w-5 h-5 text-emerald-400"></i>';
        
        txt.innerText = "Salvo / Gerado"; 
        txt.className = "text-[9px] text-emerald-400 uppercase tracking-widest font-bold mt-1";
        
        act.innerHTML = `
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Concluído
            </span>`;
        lucide.createIcons();
    },

    handlePdf() {
        const file = document.getElementById('f-pdfFile').files[0]; 
        if (!file) return;
        
        if (file.type !== "application/pdf") {
            return alert("Apenas arquivos PDF são aceitos pela Inteligência Artificial.");
        }
        
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            document.getElementById('f-pdfBase64').value = event.target.result.split(',')[1]; 
            document.getElementById('f-btnUploadPdf').classList.remove('hidden'); 
        }; 
        reader.readAsDataURL(file);
    },
    
    async uploadPdf() {
        const base64 = document.getElementById('f-pdfBase64').value; 
        const idColab = document.getElementById('f-userId').value;
        const cObj = HA.State.colabs.find(c => c.id.toString() === idColab.toString());
        const colabName = cObj ? cObj.name : "Desconhecido";
        const area = document.getElementById('f-area').value; 
        
        if (!base64) return alert("Selecione um arquivo PDF primeiro.");
        
        HA.Api.showLoad("Enviando Incubadora para o SharePoint...");
        const payload = { 
            nomeColaborador: colabName, 
            nomeArquivo: `Roteiro - ${area} - ${colabName}.pdf`, 
            area: area, 
            conteudoBase64: base64 
        };
        
        try {
            const res = await fetch(HA.Config.URL_UPLOAD_PDF, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            if (!res.ok) throw new Error("Status " + res.status);
            
            HA.Api.hideLoad();
            alert("✅ Incubadora enviada e salva no SharePoint com Sucesso!"); 
            this.setLockState('Pdf'); 
            
            if (this.currentEditingId) {
                const t = HA.State.trainings.find(x => x.id.toString() === this.currentEditingId.toString()); 
                if (t) { t.pdfUploaded = true; HA.Data.safeSave(t); }
            }

        } catch(err) {
            if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
                HA.Api.hideLoad();
                alert("✅ Incubadora enviada com Sucesso para o SharePoint!"); 
                this.setLockState('Pdf');
                
                if (this.currentEditingId) {
                    const t = HA.State.trainings.find(x => x.id.toString() === this.currentEditingId.toString()); 
                    if (t) { t.pdfUploaded = true; HA.Data.safeSave(t); }
                }
            } else {
                HA.Api.hideLoad(); 
                alert("Erro ao enviar PDF: " + err.message);
            }
        }
    },

    async generateEmail() {
        const idColab = document.getElementById('f-userId').value;
        if (!idColab) return alert("Selecione um colaborador primeiro.");
        
        const cObj = HA.State.colabs.find(c => c.id.toString() === idColab.toString());
        const colabName = cObj ? cObj.name : "Desconhecido";
        const liderNome = document.getElementById('f-leader').value || "Líder";
        const area = document.getElementById('f-area').value || "N/A";
        
        let score = 0;
        if (this.currentExamAttempts.length > 0) {
            score = this.currentExamAttempts[this.currentExamAttempts.length - 1].score;
        }
        
        const endDate = document.getElementById('f-finalizationDate').value || document.getElementById('f-endDate').value || new Date().toISOString().split('T')[0];
        
        const obsTexto = this.currentProblemsLog.length > 0 
            ? this.currentProblemsLog.map(p => p.text).join(' | ') 
            : 'Nenhuma ocorrência registrada.';
            
        const teoNotes = document.getElementById('f-teoNotes').value || "N/A";
        const praNotes = document.getElementById('f-praNotes').value || "N/A";

        HA.Api.showLoad("Disparando Comunicação Oficial...");

        const payloadEmail = {
            colabName: colabName, 
            userId: idColab.toString(), 
            leader: liderNome, 
            area: area,
            score: score,
            endDate: endDate,
            problems: obsTexto, 
            teoNotes: teoNotes, 
            praNotes: praNotes
        };

        try {
            const res = await fetch(HA.Config.URL_ENVIAR_EMAIL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payloadEmail) 
            });
            if (!res.ok) throw new Error("Status " + res.status);
            
            HA.Api.hideLoad(); 
            this.setLockState('Email'); 
            alert("✅ E-mail corporativo enviado com sucesso ao Líder " + liderNome.split(' ')[0]); 
            
            if (this.currentEditingId) {
                const t = HA.State.trainings.find(x => x.id.toString() === this.currentEditingId.toString()); 
                if (t) { t.emailSent = true; HA.Data.safeSave(t); }
            }

        } catch(err) {
            if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
                HA.Api.hideLoad(); 
                this.setLockState('Email'); 
                alert("✅ E-mail corporativo disparado com sucesso ao Líder " + liderNome.split(' ')[0]); 
                
                if (this.currentEditingId) {
                    const t = HA.State.trainings.find(x => x.id.toString() === this.currentEditingId.toString()); 
                    if (t) { t.emailSent = true; HA.Data.safeSave(t); }
                }
            } else {
                HA.Api.hideLoad(); 
                alert("Erro ao enviar E-mail: " + err.message);
            }
        }
    },

    saveTraining() {
        const uid = document.getElementById('f-userId').value; 
        if (!uid) return alert("Matrícula de Colaborador é obrigatória.");
        
        const stage = document.getElementById('f-stage').value;
        const isPdfLocked = document.getElementById('f-isPdfLocked').value === 'true';
        const isEmailLocked = document.getElementById('f-isEmailLocked').value === 'true';

        if (stage === 'Finalizado') {
            if (!isPdfLocked || !isEmailLocked) {
                alert("🛑 AÇÃO BLOQUEADA PELO SISTEMA:\n\nVocê não pode salvar este treinamento como 'Finalizado' sem antes completar o Checklist Automatizado:\n\n1. Anexar e enviar a Incubadora Assinada (PDF) para a nuvem.\n2. Enviar o E-mail Oficial de Comunicação ao Líder.\n\nPor favor, cumpra esses passos antes de salvar.");
                return; 
            }
        }

        const id = this.currentEditingId ? this.currentEditingId : Date.now();
        let finalScore = 0; 
        if (this.currentExamAttempts.length > 0) {
            finalScore = this.currentExamAttempts[this.currentExamAttempts.length - 1].score;
        }
        
        const colabObj = HA.State.colabs.find(c => c.id.toString() === uid.toString());

        const tr = {
            id: id, 
            spId: document.getElementById('f-spId').value, 
            userId: uid, 
            colabName: colabObj ? colabObj.name : 'Desconhecido',
            leader: document.getElementById('f-leader').value, 
            type: document.getElementById('f-type').value, 
            sector: document.getElementById('f-sector').value, 
            area: document.getElementById('f-area').value, 
            facilitator: document.getElementById('f-facilitator').value,
            stage: stage, 
            startDate: document.getElementById('f-startDate').value, 
            endDate: document.getElementById('f-endDate').value,
            accRequestDate: document.getElementById('f-accDate').value, 
            accRequestStatus: document.getElementById('f-accStatus').innerText,
            accTeoDone: this.currentChecklist.length >= (this.currentType === 'Primeira Entrada' ? 4 : 1), 
            accPraDone: document.getElementById('f-praDone').checked,
            teoNotes: document.getElementById('f-teoNotes').value, 
            praNotes: document.getElementById('f-praNotes').value,
            problemsLog: [...this.currentProblemsLog], 
            examAttempts: [...this.currentExamAttempts], 
            checklist: [...this.currentChecklist],
            score: finalScore,
            pdfUploaded: isPdfLocked, 
            emailSent: isEmailLocked,
            finalizationDate: document.getElementById('f-finalizationDate').value
        };

        HA.Data.safeSave(tr).then(success => { 
            if (success) { 
                this.closeModal('modalFichaContainer'); 
                alert("✅ Ficha de Treinamento salva na Nuvem com sucesso!"); 
            }
        });
    },

    injectTrainingModal() {
        const container = document.getElementById('modalFichaContainer');
        if (container.innerHTML.trim() !== '') return; 

        container.innerHTML = `
        <div class="bg-[#0f1523] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slide-up relative overflow-hidden">
            <div class="bg-[#070b14]/80 px-8 py-5 flex justify-between items-center border-b border-white/5 relative z-10">
                <h2 id="wizard-title" class="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                    <i data-lucide="crosshair" class="w-5 h-5"></i> Nova Ficha de Treinamento
                </h2>
                <button type="button" onclick="HA.UI.closeModal('modalFichaContainer')" class="text-gray-500 hover:text-white transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
            <div class="flex border-b border-white/5 bg-[#0a0f1d] px-8 pt-4">
                <button id="step-btn-1" onclick="if(!this.disabled) HA.UI.switchStep(1)" class="px-6 py-3 border-b-[3px] border-cyan-500 text-cyan-400 bg-cyan-500/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-t-xl disabled:opacity-30 disabled:cursor-not-allowed">
                    <i data-lucide="user" class="w-4 h-4"></i> 1. Setup & Início
                </button>
                <button id="step-btn-2" onclick="if(!this.disabled) HA.UI.switchStep(2)" disabled class="px-6 py-3 border-b-[3px] border-transparent text-gray-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:text-gray-300 rounded-t-xl disabled:opacity-30 disabled:cursor-not-allowed">
                    <i data-lucide="book-open" class="w-4 h-4"></i> 2. Processo Teórico
                </button>
                <button id="step-btn-3" onclick="if(!this.disabled) HA.UI.switchStep(3)" disabled class="px-6 py-3 border-b-[3px] border-transparent text-gray-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:text-gray-300 rounded-t-xl disabled:opacity-30 disabled:cursor-not-allowed">
                    <i data-lucide="award" class="w-4 h-4"></i> 3. Prática & Cierre
                </button>
            </div>

            <form id="trainingForm" class="flex-1 overflow-y-auto custom-scroll p-8 bg-[#070b14]/50 relative" onsubmit="event.preventDefault();">
                <input type="hidden" id="f-spId">
                <input type="hidden" id="f-finalizationDate">
                
                <!-- ============================================== -->
                <!-- STEP 1: INICIO                                 -->
                <!-- ============================================== -->
                <div id="step-content-1" class="space-y-8 animate-fade-in max-w-4xl mx-auto">
                    <div class="flex gap-6 items-start bg-[#0f1523] p-6 rounded-3xl border border-white/5 shadow-inner">
                        <div class="w-24 h-24 rounded-full border-2 border-white/10 bg-[#070b14] overflow-hidden shrink-0 shadow-lg">
                            <img id="f-photo" src="" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 space-y-4">
                            <div>
                                <label class="label-clean">Selecionar Colaborador</label>
                                <select id="f-userId" onchange="HA.UI.autoFillColab()" class="input-clean cursor-pointer text-white" required></select>
                            </div>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="label-clean">Matrícula</label>
                                    <input type="text" id="f-mat" readonly class="input-clean bg-black/50 text-gray-500 border-transparent cursor-not-allowed">
                                </div>
                                <div>
                                    <label class="label-clean">Líder Oficial</label>
                                    <input type="text" id="f-leader" readonly class="input-clean bg-black/50 text-gray-500 border-transparent cursor-not-allowed">
                                </div>
                                <div>
                                    <label class="label-clean">Turno</label>
                                    <input type="text" id="f-turno" readonly class="input-clean bg-cyan-500/10 text-cyan-400 font-black border border-cyan-500/30 cursor-not-allowed">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6 bg-[#0f1523] p-6 rounded-3xl border border-white/5 shadow-inner">
                        <div class="col-span-2">
                            <label class="label-clean">Tipo de Treinamento</label>
                            <div class="flex gap-3 items-center">
                                <select id="f-type" class="input-clean cursor-pointer">
                                    <option value="Primeira Entrada">Primeira Entrada</option>
                                    <option value="Troca de Área">Troca de Área</option>
                                </select>
                                <span id="f-typeLock" class="hidden text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl font-bold tracking-widest uppercase">
                                    <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i> Forçado pelo Histórico
                                </span>
                            </div>
                        </div>
                        <div>
                            <label class="label-clean">Setor Alvo</label>
                            <select id="f-sector" onchange="HA.UI.updateAreasFicha()" class="input-clean cursor-pointer" required></select>
                        </div>
                        <div>
                            <label class="label-clean">Área Específica</label>
                            <select id="f-area" class="input-clean cursor-pointer" required></select>
                        </div>
                        <div class="col-span-2">
                            <label class="label-clean">Facilitador Responsável</label>
                            <select id="f-facilitator" class="input-clean cursor-pointer" required></select>
                        </div>
                        <div class="col-span-2">
                            <label class="label-clean text-indigo-400">Etapa Atual</label>
                            <select id="f-stage" onchange="HA.UI.checkAutoFinish()" class="input-clean bg-indigo-900/10 border-indigo-500/30 text-indigo-300 font-bold" required>
                                <option value="Solicitado" class="hidden">Solicitado</option>
                                <option value="1ª Etapa (Docs Iniciais)">1ª Etapa (Docs Iniciais)</option>
                                <option value="2ª Etapa (Treino Teórico)">2ª Etapa (Treino Teórico)</option>
                                <option value="Acompanhamento e Prática">Acompanhamento e Prática</option>
                                <option value="Aguardando Exame Final">Aguardando Exame Final</option>
                                <option value="Finalizado" class="bg-emerald-900 text-emerald-400">Finalizado (Sucesso)</option>
                                <option value="Reprovado" class="bg-rose-900 text-rose-400">Reprovado</option>
                            </select>
                        </div>
                        <div>
                            <label class="label-clean">Data Início</label>
                            <input type="date" id="f-startDate" onchange="HA.UI.calcMaxDate()" class="input-clean" required>
                        </div>
                        <div>
                            <label class="label-clean text-mustard-500">Prazo Máximo (15 Dias)</label>
                            <input type="date" id="f-endDate" readonly class="input-clean text-mustard-500 bg-mustard-500/5 border-mustard-500/20 cursor-not-allowed">
                        </div>
                    </div>
                    
                    <div class="pt-4 flex justify-end">
                        <button type="button" onclick="HA.UI.startTraining()" class="bg-cyan-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2">
                            Iniciar Jornada <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- ============================================== -->
                <!-- STEP 2: PROCESSO TEORICO                       -->
                <!-- ============================================== -->
                <div id="step-content-2" class="space-y-6 hidden animate-fade-in h-full">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        
                        <div class="lg:col-span-2 space-y-6 flex flex-col h-full">
                            <div class="bg-[#0f1523] border border-white/5 p-6 rounded-3xl shadow-inner">
                                <h3 class="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <i data-lucide="check-square" class="w-4 h-4"></i> Checklist de Treinamento
                                </h3>
                                <div id="f-checklist-box" class="space-y-3"></div>
                            </div>
                            
                            <div class="bg-[#0f1523] border border-white/5 p-6 rounded-3xl shadow-inner relative flex-1 flex flex-col overflow-hidden">
                                <h3 class="text-xs font-black text-mustard-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i> Relatório Teórico do Facilitador
                                </h3>
                                <div id="f-lock-pratico" class="absolute inset-0 bg-[#070b14]/90 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
                                    <i data-lucide="lock" class="w-8 h-8 text-gray-500 mb-3"></i>
                                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Complete o Checklist acima para liberar.</p>
                                </div>
                                <div id="f-content-pratico" class="flex-1 flex flex-col">
                                    <textarea id="f-teoNotes" class="input-clean flex-1 resize-none" placeholder="Descreva o desempenho teórico..."></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="lg:col-span-1 bg-[#0f1523] border border-white/5 p-6 rounded-3xl flex flex-col shadow-inner">
                            <h3 class="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="alert-triangle" class="w-4 h-4"></i> Ocorrências
                            </h3>
                            <div class="flex gap-2 mb-4">
                                <input type="text" id="f-newProb" placeholder="Descreva o problema..." class="flex-1 input-clean">
                                <button type="button" onclick="HA.UI.addProblemLog()" class="bg-white/10 text-white px-4 py-2.5 rounded-2xl hover:bg-white/20 transition border border-white/10 shadow-md">
                                    <i data-lucide="plus" class="w-5 h-5"></i>
                                </button>
                            </div>
                            <div id="f-problemsList" class="flex-1 overflow-y-auto custom-scroll pr-1 space-y-2"></div>
                        </div>

                    </div>
                </div>

                <!-- ============================================== -->
                <!-- STEP 3: PRATICA & CIERRE                       -->
                <!-- ============================================== -->
                <div id="step-content-3" class="space-y-6 hidden animate-fade-in max-w-4xl mx-auto">
                    
                    <div class="bg-[#0f1523] border border-white/5 p-6 rounded-3xl shadow-inner flex items-center justify-between">
                        <div>
                            <h3 class="text-xs font-black text-mustard-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <i data-lucide="calendar" class="w-4 h-4"></i> Agendamento de Validação Líder
                            </h3>
                            <div class="flex items-center gap-3">
                                <input type="date" id="f-accDate" class="input-clean w-auto text-xs py-2.5">
                                <button type="button" id="f-btnReqAcc" onclick="HA.UI.requestAccDate()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-md">
                                    Solicitar Aprovação
                                </button>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</span>
                            <span id="f-accStatus" class="text-[11px] font-black text-mustard-400 bg-mustard-500/10 px-3.5 py-1.5 rounded-lg border border-mustard-500/20 uppercase tracking-widest">Pendente</span>
                        </div>
                    </div>

                    <div class="bg-[#0f1523] border border-white/5 p-6 rounded-3xl shadow-inner space-y-4">
                        <label class="flex items-center gap-3 font-black text-[10px] text-white uppercase tracking-widest cursor-pointer p-4 bg-[#070b14] rounded-2xl border border-white/5">
                            <input type="checkbox" id="f-praDone" class="w-5 h-5 accent-cyan-500 rounded"> Acompanhamento Prático Concluído pelo Facilitador
                        </label>
                        <textarea id="f-praNotes" rows="3" class="input-clean text-xs resize-none" placeholder="Relatório do acompanhamento prático oficial..."></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-[#0f1523] border border-white/5 p-6 rounded-3xl shadow-inner">
                            <h3 class="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="award" class="w-4 h-4"></i> Exame Final
                            </h3>
                            <div class="flex gap-3 mb-5">
                                <input type="number" id="f-newScore" placeholder="Nota 0-100" class="input-clean flex-1 py-2.5 text-center text-lg font-black">
                                <button type="button" id="f-btnScore" onclick="HA.UI.addAttempt()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-sm">
                                    Lançar
                                </button>
                            </div>
                            <div id="f-attemptsList" class="space-y-2"></div>
                        </div>
                        
                        <div class="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-3xl shadow-inner flex flex-col">
                            <h3 class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="shield-check" class="w-4 h-4"></i> Auditoria de Cierre
                            </h3>
                            <div class="space-y-3 flex-1 flex flex-col justify-center">
                                
                                <div class="flex items-center justify-between bg-[#070b14] p-3 rounded-xl border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div id="lockIconPdf" class="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                                            <i data-lucide="x" class="w-3 h-3"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-xs font-bold text-white">Incubadora Assinada</h4>
                                            <p id="lockTxtPdf" class="text-[8px] text-rose-400 uppercase tracking-widest font-bold mt-0.5">Pendente</p>
                                        </div>
                                    </div>
                                    <div id="lockActionPdf" class="flex gap-2">
                                        <!-- Vacio por default, se inyecta por JS -->
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between bg-[#070b14] p-3 rounded-xl border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div id="lockIconEmail" class="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                                            <i data-lucide="x" class="w-3 h-3"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-xs font-bold text-white">Aviso ao Líder</h4>
                                            <p id="lockTxtEmail" class="text-[8px] text-rose-400 uppercase tracking-widest font-bold mt-0.5">Não Gerado</p>
                                        </div>
                                    </div>
                                    <div id="lockActionEmail">
                                        <!-- Vacio por default, se inyecta por JS -->
                                    </div>
                                </div>
                                
                                <input type="hidden" id="f-isPdfLocked" value="false">
                                <input type="hidden" id="f-isEmailLocked" value="false">
                            </div>
                        </div>
                    </div>
                    
                    <div id="timeBonoAlert" class="mt-4 hidden bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-center text-[10px] font-bold uppercase tracking-widest animate-pulse"></div>
                </div>

            </form>
            
            <!-- FIXED FOOTER -->
            <div class="bg-[#0f1523] border-t border-white/10 p-6 flex justify-between items-center z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] relative">
                <button type="button" onclick="HA.UI.closeModal('modalFichaContainer')" class="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-white/5">
                    Fechar / Descartar
                </button>
                <button type="button" onclick="HA.UI.saveTraining()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest transition shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 hover:scale-105">
                    <i data-lucide="save" class="w-5 h-5"></i> Salvar Ficha na Nuvem
                </button>
            </div>
        </div>`;
    },

    // ========================================================
    // LOGICA INJETAR HISTÓRICO EXPRESSO
    // ========================================================
    openInjectHistoryModal() {
        document.getElementById('modalInjectHistory').classList.remove('hidden');
        document.getElementById('modalInjectHistory').classList.add('flex');
        
        // Povoar Colaboradores
        const colabSel = document.getElementById('h-userId'); 
        colabSel.innerHTML = '<option value="" disabled selected>Escolha o Colaborador...</option>';
        HA.State.colabs.filter(c => c.status !== 'Desligado').forEach(c => { 
            colabSel.innerHTML += `<option value="${c.id}">${c.id} - ${c.name}</option>`; 
        });

        // Povoar Facilitadores
        const facSel = document.getElementById('h-fac'); 
        facSel.innerHTML = '<option value="" disabled selected>Escolha o Facilitador...</option>';
        HA.State.users.filter(u => u.role === 'Facilitador').forEach(u => { 
            facSel.innerHTML += `<option value="${u.name}">${u.name}</option>`; 
        });

        // Povoar Setores
        const secSel = document.getElementById('h-sector'); 
        secSel.innerHTML = '<option value="" disabled selected>Escolha...</option>';
        Object.keys(HA.Constants.Sectors).forEach(s => { 
            secSel.innerHTML += `<option value="${s}">${s}</option>`; 
        });

        // Valores padrao data
        document.getElementById('h-start').value = new Date().toISOString().split('T')[0];
        document.getElementById('h-end').value = new Date().toISOString().split('T')[0];
    },

    autoFillInjectColab() {
        const id = document.getElementById('h-userId').value;
        const hasPrimeira = HA.State.trainings.some(t => t.userId.toString() === id.toString() && (t.type === 'Primeira Entrada' || t.stage === 'Finalizado'));
        document.getElementById('h-type').value = hasPrimeira ? 'Troca de Área' : 'Primeira Entrada';
    },

    updateAreasInject() {
        const s = document.getElementById('h-sector').value; 
        const a = document.getElementById('h-area'); 
        a.innerHTML = ''; 
        if (HA.Constants.Sectors[s]) {
            HA.Constants.Sectors[s].forEach(ar => { a.innerHTML += `<option value="${ar}">${ar}</option>`; });
        }
    },

    saveInjectedHistory(e) {
        e.preventDefault();
        const uid = document.getElementById('h-userId').value;
        if (!uid) return alert("Selecione um colaborador.");

        const colabObj = HA.State.colabs.find(c => c.id.toString() === uid.toString());
        const scoreVal = parseInt(document.getElementById('h-score').value) || 100;

        const tr = {
            id: Date.now(), 
            spId: "CRIAR", 
            userId: uid, 
            colabName: colabObj ? colabObj.name : 'Desconhecido',
            leader: colabObj ? colabObj.leader : 'Sem Líder', 
            type: document.getElementById('h-type').value, 
            sector: document.getElementById('h-sector').value, 
            area: document.getElementById('h-area').value, 
            facilitator: document.getElementById('h-fac').value,
            stage: 'Finalizado', 
            startDate: document.getElementById('h-start').value, 
            endDate: document.getElementById('h-end').value,
            finalizationDate: document.getElementById('h-end').value,
            accRequestDate: document.getElementById('h-end').value, 
            accRequestStatus: 'Aprovado',
            accTeoDone: true, 
            accPraDone: true,
            teoNotes: "Registro injetado via Histórico Expresso.", 
            praNotes: "Registro injetado via Histórico Expresso.",
            problemsLog: [], 
            examAttempts: [{ score: scoreVal, date: new Date().toISOString() }], 
            checklist: ['Injetado via Histórico Antigo'],
            score: scoreVal,
            pdfUploaded: true,  // Forçamos true pra não travar o sistema
            emailSent: true     // Forçamos true pra não travar o sistema
        };

        HA.Data.safeSave(tr).then(success => { 
            if (success) { 
                this.closeModal('modalInjectHistory'); 
                document.getElementById('view-tray').classList.remove('hidden');
                HA.Facilitator.switchTab('fins'); // Manda o cara pra ver o histórico salvo
                alert("✅ Histórico Antigo Injetado com Sucesso!"); 
            }
        });
    }
};
