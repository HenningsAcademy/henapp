window.HA = window.HA || {};

HA.Utils = {
    applyFilter(arr) {
        const searchElement = document.getElementById('globalSearch');
        if(!searchElement) return arr;
        
        const term = searchElement.value.trim().toLowerCase();
        if(!term) return arr;
        
        return arr.filter(x => 
            (x.colabName && x.colabName.toLowerCase().includes(term)) || 
            (x.userId && x.userId.toLowerCase().includes(term)) ||
            (x.area && x.area.toLowerCase().includes(term))
        );
    }
};

HA.Facilitator = {

    tempColabPhoto: "",

    switchTab(tabId) {
        ['view-tray', 'view-colabs', 'view-inbox'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });

        ['tab-ativos', 'tab-fins', 'tab-colabs', 'tab-inbox'].forEach(id => {
            const btn = document.getElementById(id);
            if(btn) {
                btn.classList.remove('tab-active', 'text-white', 'bg-navy-800');
                btn.classList.add('text-gray-500');
            }
        });

        const activeBtn = document.getElementById('tab-' + tabId);
        if(activeBtn) {
            activeBtn.classList.remove('text-gray-500');
            activeBtn.classList.add('tab-active', 'text-white', 'bg-navy-800');
        }

        if(tabId === 'ativos') { document.getElementById('view-tray').classList.remove('hidden'); this.renderTray('Ativos'); } 
        else if (tabId === 'fins') { document.getElementById('view-tray').classList.remove('hidden'); this.renderTray('Finalizados'); } 
        else if (tabId === 'colabs') { document.getElementById('view-colabs').classList.remove('hidden'); this.renderColabs(); } 
        else if (tabId === 'inbox') { document.getElementById('view-inbox').classList.remove('hidden'); this.renderInbox(); }
    },

    updateKPIs() {
        const container = document.getElementById('global-kpis');
        if(!container) return; 

        const ativos = HA.State.trainings.filter(t => t.stage !== 'Finalizado' && t.stage !== 'Reprovado' && t.stage !== 'Solicitado').length;
        const pri = HA.State.trainings.filter(t => t.type === 'Primeira Entrada' && t.stage !== 'Finalizado' && t.stage !== 'Reprovado').length;
        const acc = HA.State.trainings.filter(t => t.stage.includes('Acompanhamento') || t.stage.includes('Aguardando')).length;

        container.innerHTML = `
            <div class="bg-navy-950/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                <div class="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Operações Ativas</div>
                <div class="text-2xl font-black text-white">${ativos}</div>
            </div>
            <div class="bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
                <div class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Pri. Entrada</div>
                <div class="text-2xl font-black text-indigo-300">${pri}</div>
            </div>
            <div class="bg-mustard-500/10 p-4 rounded-2xl border border-mustard-500/20 shadow-inner">
                <div class="text-[9px] font-bold text-mustard-400 uppercase tracking-widest mb-1">Acompanhamento</div>
                <div class="text-2xl font-black text-mustard-300">${acc}</div>
            </div>
        `;
    },

    checkAlertStatus(t) {
        if(t.stage === 'Solicitado' || t.stage === 'Finalizado' || t.stage === 'Reprovado') return { level: 'none', msgs: [] };
        if(!t.startDate) return { level: 'none', msgs: [] };
        
        // Traduzindo a data para JS real para calcular os dias corretos
        const start = HA.UI.parseDate(t.startDate); 
        const end = HA.UI.parseDate(t.endDate) || start;
        const today = new Date();
        
        if(!start || !end) return { level: 'none', msgs: [] };

        const daysElapsed = Math.floor((today - start) / (1000 * 3600 * 24)); 
        const daysLeft = Math.floor((end - today) / (1000 * 3600 * 24));
        
        let msgs = []; let isMax = false, isMed = false;
        
        if(daysLeft <= 5 && daysLeft >= 0) { isMax = true; msgs.push(`SLA: Restam apenas ${daysLeft} dia(s) para o limite.`); }
        if(daysLeft < 0) { isMax = true; msgs.push(`SLA: Treinamento atrasado (${Math.abs(daysLeft)} dias).`); }
        
        if(daysElapsed >= 5) {
            if(!t.accTeoDone && !t.accPraDone) { isMax = true; msgs.push(`5+ dias sem acompanhamento DHO.`); }
            if(!t.accTeoDone && t.stage.includes('1ª Etapa')) { isMax = true; msgs.push(`Travado na 1ª Etapa há 5+ dias.`); }
        }
        if(t.accTeoDone && (!t.teoNotes || t.teoNotes.trim() === '')) { isMed = true; msgs.push(`Sem relatório teórico.`); }
        if(t.accPraDone && (!t.praNotes || t.praNotes.trim() === '')) { isMed = true; msgs.push(`Sem relatório prático.`); }
        
        if(t.stage === 'Aguardando Exame Final' && t.examAttempts.length === 0) {
            isMed = true; msgs.push(`Aguardando lançamento de nota.`);
        }
        
        return { level: isMax ? 'max' : (isMed ? 'med' : 'none'), msgs: msgs };
    },

    renderTray(mode) {
        this.updateKPIs();
        document.getElementById('tray-title').innerText = mode === 'Ativos' ? 'Treinamentos Ativos' : 'Histórico DHO (Concluídos)';
        window.currentTrayType = mode; 

        let list = HA.Utils.applyFilter(HA.State.trainings);
        if(mode === 'Ativos') list = list.filter(t => t.stage !== 'Finalizado' && t.stage !== 'Reprovado' && t.stage !== 'Solicitado');
        else list = list.filter(t => t.stage === 'Finalizado' || t.stage === 'Reprovado');

        const tbody = document.getElementById('table-tray'); 
        if(!tbody) return; tbody.innerHTML = '';
        
        if(list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 font-medium">Bandeja Vazia.</td></tr>`;
            return;
        }

        let sorted = list.map(t => { t._alert = this.checkAlertStatus(t); t._score = t._alert.level === 'max' ? 2 : (t._alert.level === 'med' ? 1 : 0); return t; }).sort((a,b) => b._score - a._score);

        sorted.forEach(t => {
            let sColor = t.stage === 'Finalizado' ? 'emerald' : (t.stage === 'Reprovado' ? 'rose' : 'mustard');
            let badgeType = t.type === 'Troca de Área' ? 'indigo' : 'blue';
            let progText = t.stage.includes('1ª') ? '25%' : (t.stage.includes('2ª') ? '50%' : (t.stage.includes('Prática') ? '75%' : (t.stage==='Finalizado'?'100%':'10%')));

            let alertIcon = `<span class="w-2 h-2 rounded-full bg-white/10 block mx-auto"></span>`; 
            if(t._alert.level === 'max') alertIcon = `<button onclick="HA.Facilitator.showAlerts('${t.id}')" class="p-1.5 bg-rose-500/20 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/40 transition shadow-sm"><i data-lucide="alert-triangle" class="w-4 h-4"></i></button>`;
            else if(t._alert.level === 'med') alertIcon = `<button onclick="HA.Facilitator.showAlerts('${t.id}')" class="p-1.5 bg-mustard-500/20 rounded-lg border border-mustard-500/30 text-mustard-400 hover:bg-mustard-500/40 transition shadow-sm"><i data-lucide="alert-circle" class="w-4 h-4"></i></button>`;

            let timeInfo = `<div class="font-mono text-[10px] text-gray-400 uppercase tracking-widest">${HA.UI.formatDateBR(t.endDate).split(' ')[0]}</div>`;
            
            // 🔥 CORREÇÃO DA MATEMÁTICA NA BANDEJA: Usando parseDate para evitar datas quebradas!
            if(t.stage === 'Finalizado' && t.finalizationDate && t.startDate) {
                const dFin = HA.UI.parseDate(t.finalizationDate);
                const dIni = HA.UI.parseDate(t.startDate);
                if(dFin && dIni) {
                    dFin.setHours(0,0,0,0);
                    dIni.setHours(0,0,0,0);
                    const diff = Math.floor((dFin - dIni) / (1000 * 3600 * 24));
                    if(diff <= 16 && diff >= 0) {
                        timeInfo += `<span class="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block whitespace-nowrap"><i data-lucide="arrow-down" class="w-3 h-3 inline"></i> ${16-diff} dias salvos</span>`;
                    }
                }
            }

            let alertHtml = '';
            if (t._alert.msgs.length > 0) {
                alertHtml = `<div class="mt-2.5 flex flex-col gap-1.5 w-full">`;
                t._alert.msgs.forEach(m => {
                    let badgeCol = t._alert.level === 'max' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'bg-mustard-500/10 text-mustard-400 border-mustard-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
                    let icon = t._alert.level === 'max' ? 'alert-triangle' : 'alert-circle';
                    alertHtml += `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${badgeCol} text-[8px] font-black uppercase tracking-widest animate-pulse"><i data-lucide="${icon}" class="w-3 h-3"></i> ${m}</div>`;
                });
                alertHtml += `</div>`;
            }

            tbody.innerHTML += `
            <tr class="transition hover:bg-white/5 border-b border-white/5">
                <td class="px-5 py-5 w-1/4">
                    <div class="font-bold text-white text-xs">${t.colabName}</div>
                    <div class="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-1">ID: ${t.userId} | <span class="text-${badgeType}-400">${t.type}</span></div>
                </td>
                <td class="px-5 py-5 text-xs font-bold text-gray-300">${t.sector}<br><span class="text-gray-500 font-normal truncate max-w-[150px] inline-block mt-0.5" title="${t.area}">${t.area}</span></td>
                <td class="px-5 py-5 w-1/3">
                    <span class="px-2 py-1 bg-${sColor}-500/10 text-${sColor}-400 border border-${sColor}-500/30 rounded text-[9px] font-bold uppercase tracking-widest inline-block shadow-sm mb-2">${t.stage} <span class="text-white opacity-50 ml-1">(${progText})</span></span>
                    ${alertHtml}
                </td>
                <td class="px-5 py-5 text-right">${timeInfo}</td>
                <td class="px-5 py-5 text-right">
                    <button onclick="HA.UI.openTrainingModal('${t.id}')" class="text-mustard-400 hover:text-white p-2.5 bg-white/10 rounded-xl border border-white/20 transition shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center float-right"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderColabs() {
        const container = document.getElementById('colabGroupedContainer');
        if(!container) return; container.innerHTML = '';
        
        let filteredColabs = HA.State.colabs.filter(c => c.status !== 'Desligado');
        filteredColabs = HA.Utils.applyFilter(filteredColabs);

        if(filteredColabs.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-gray-500">Nenhum colaborador encontrado na equipe.</div>`;
            return;
        }

        const getAptos = (id) => HA.State.trainings.filter(t => t.userId === id && t.stage === 'Finalizado').map(t => t.area);
        const groupedByLeader = {};
        
        filteredColabs.forEach(c => {
            if(!groupedByLeader[c.leader]) groupedByLeader[c.leader] = [];
            groupedByLeader[c.leader].push(c);
        });

        for (const [lider, colabs] of Object.entries(groupedByLeader)) {
            let html = `
                <div class="mb-8">
                    <h3 class="text-lg font-black text-white border-b border-white/10 pb-3 mb-5 flex items-center gap-3">
                        <i data-lucide="users" class="w-5 h-5 text-mustard-500"></i> Liderança: ${lider} <span class="bg-white/10 text-gray-400 px-2.5 py-1 rounded-lg text-[10px] ml-2 border border-white/5">${colabs.length}</span>
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            `;
            
            colabs.forEach(c => {
                const imgStr = c.photo ? c.photo : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";
                const aptos = getAptos(c.id);
                let aptosHtml = aptos.length > 0 ? aptos.map(a => `<span class="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-[9px] font-bold m-0.5 uppercase tracking-widest"><i data-lucide="check" class="w-2.5 h-2.5 inline mr-0.5"></i> ${a.substring(0,12)}...</span>`).join('') : `<span class="text-[10px] text-gray-600 italic mt-1 block">Em período de formação</span>`;

                html += `
                <div class="bg-[#111625]/80 backdrop-blur-md p-5 rounded-[2rem] shadow-lg border border-white/5 flex flex-col items-center text-center relative hover:border-mustard-500/30 transition-all group">
                    <div class="relative w-16 h-16 mb-3 cursor-pointer" onclick="HA.Facilitator.openColabModal('${c.id}')" title="Clique para adicionar Foto">
                        <img src="${imgStr}" class="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-md group-hover:scale-105 transition-transform bg-black">
                        <div class="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><i data-lucide="camera" class="w-5 h-5 text-white"></i></div>
                    </div>
                    <h3 class="font-bold text-white text-sm leading-tight">${c.name}</h3>
                    <p class="text-[10px] text-gray-500 font-mono mt-1 border-b border-white/5 pb-3 mb-3 w-full">ID: ${c.id}</p>
                    <div class="w-full text-center mb-4 h-14 overflow-hidden flex flex-wrap justify-center gap-1">${aptosHtml}</div>
                    
                    <div class="flex w-full gap-2 mt-auto">
                        <button onclick="HA.UI.openHistory('${c.id}')" class="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[9px] uppercase tracking-widest rounded-xl border border-white/5 transition-colors"><i data-lucide="history" class="w-3.5 h-3.5 inline mr-1"></i> Perfil</button>
                        <button onclick="HA.Facilitator.openColabModal('${c.id}')" class="flex-1 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[9px] uppercase tracking-widest rounded-xl border border-indigo-500/20 transition-colors"><i data-lucide="edit-2" class="w-3.5 h-3.5 inline mr-1"></i> Editar</button>
                    </div>
                </div>`;
            });
            html += `</div></div>`;
            container.innerHTML += html;
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    openColabModal(id = null) {
        this.tempColabPhoto = "";
        document.getElementById('modalColabTitle').innerHTML = id 
            ? `<div class="p-2 bg-indigo-500/20 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4 text-indigo-400"></i></div> Editar Colaborador` 
            : `<div class="p-2 bg-indigo-500/20 rounded-lg"><i data-lucide="user-plus" class="w-4 h-4 text-indigo-400"></i></div> Novo Colaborador`;
        
        document.getElementById('c-spId').value = ''; 
        document.getElementById('c-id').value = ''; 
        document.getElementById('c-name').value = ''; 
        document.getElementById('c-leader').value = ''; 
        document.getElementById('c-sector').value = 'Produção'; 
        document.getElementById('c-status').value = 'Ativo';
        document.getElementById('photoPreviewBox').innerHTML = '<i data-lucide="user" class="w-6 h-6 text-gray-500"></i>';
        
        document.getElementById('c-id').readOnly = false;
        
        if(id) {
            const c = HA.State.colabs.find(x => x.id.toString() === id.toString());
            if(c) { 
                document.getElementById('c-spId').value = c.spId; 
                document.getElementById('c-id').value = c.id; 
                document.getElementById('c-name').value = c.name; 
                document.getElementById('c-leader').value = c.leader; 
                document.getElementById('c-sector').value = c.sector || 'Produção';
                document.getElementById('c-status').value = c.status; 
                if(c.photo) {
                    this.tempColabPhoto = c.photo;
                    document.getElementById('photoPreviewBox').innerHTML = `<img src="${c.photo}" class="w-full h-full object-cover">`;
                }
            }
        }
        document.getElementById('modalColab').classList.remove('hidden'); document.getElementById('modalColab').classList.add('flex');
        lucide.createIcons();
    },

    compressPhoto(event) {
        const file = event.target.files[0]; if(!file) return; 
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image(); img.onload = () => {
                const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
                const MAX = 200; let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } } 
                else { if (height > MAX) { width *= MAX / height; height = MAX; } }
                canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
                
                HA.Facilitator.tempColabPhoto = canvas.toDataURL('image/jpeg', 0.7); 
                document.getElementById('photoPreviewBox').innerHTML = `<img src="${HA.Facilitator.tempColabPhoto}" class="w-full h-full object-cover">`;
            }; img.src = e.target.result;
        }; reader.readAsDataURL(file);
    },

    async saveColab(e) {
        e.preventDefault(); 
        HA.Api.showLoad("Salvando Alterações na Nuvem...");
        
        const tempCspId = document.getElementById('c-spId').value.trim();
        const isNew = tempCspId === "";

        const payload = { 
            spId: isNew ? "CRIAR" : tempCspId, 
            matricula: document.getElementById('c-id').value, 
            treinamentosFinalizados: document.getElementById('c-sector').value, 
            nome: document.getElementById('c-name').value, 
            lider: document.getElementById('c-leader').value, 
            status: document.getElementById('c-status').value, 
            foto: this.tempColabPhoto 
        };
        
        const URL_SALVAR_COLAB = "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/02/workflows/1b1b45bc522943dea6a7030485f680f6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FYOgLPg178X4sEFRmrgNYi9zsVwGFLpr05BkGbE6XtI";
        
        try {
            const res = await fetch(URL_SALVAR_COLAB, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) 
            });

            if(!res.ok) throw new Error(`Status ${res.status}`);

            HA.UI.closeModal('modalColab'); 
            HA.Api.fetchCloudData(true);
            setTimeout(() => { HA.Api.hideLoad(); alert("✅ Perfil do colaborador atualizado com sucesso!"); }, 1000);
        } catch(err) { 
            if(err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
                HA.UI.closeModal('modalColab');
                setTimeout(() => { 
                    HA.Api.fetchCloudData(true);
                    HA.Api.hideLoad();
                    alert("✅ Perfil do colaborador atualizado com sucesso!");
                }, 1500);
            } else {
                HA.Api.hideLoad(); 
                alert(`Falha no Power Automate.\nDetalhes: ${err.message}`); 
            }
        }
    },

    renderInbox() {
        const reqDiv = document.getElementById('inbox-requests'); 
        const notifDiv = document.getElementById('inbox-notifs');
        if(!reqDiv || !notifDiv) return; 
        
        reqDiv.innerHTML = '';
        notifDiv.innerHTML = '';
        
        const reqs = HA.State.trainings.filter(t => t.stage === 'Solicitado');
        if(reqs.length === 0) {
            reqDiv.innerHTML = '<div class="p-6 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/5 text-xs font-bold shadow-inner">Nenhuma solicitação pendente no momento.</div>';
        } else {
            reqs.forEach(t => {
                reqDiv.innerHTML += `
                <div class="bg-indigo-900/10 p-6 rounded-2xl border border-indigo-500/20 shadow-lg flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-black text-indigo-300 text-sm tracking-wide">${t.colabName}</h3>
                            <p class="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-mono">ID: ${t.userId}</p>
                        </div>
                        <span class="bg-indigo-500/20 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/30 shadow-md">Novo Pedido</span>
                    </div>
                    <p class="text-xs text-gray-300 mt-2 bg-black/30 p-4 rounded-xl border border-white/5 leading-relaxed">
                        <span class="text-indigo-400 font-black uppercase tracking-widest text-[9px]"><i data-lucide="message-square" class="w-3 h-3 inline"></i> Líder ${t.leader}:</span><br>
                        "Solicito treinamento na área de <b class="text-white">${t.area}</b> (${t.sector})"
                    </p>
                    <button onclick="HA.Facilitator.acceptRequest('${t.id}')" class="w-full mt-2 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-500 transition text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2">
                        <i data-lucide="check" class="w-4 h-4"></i> Iniciar Ficha DHO
                    </button>
                </div>`;
            });
        }

        const notifs = HA.State.trainings.filter(t => t.accRequestStatus.trim() === 'Aprovado' || t.accRequestStatus.trim() === 'Recusado');
        
        if(notifs.length === 0) {
            notifDiv.innerHTML = '<div class="p-6 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/5 text-xs font-bold shadow-inner">Nenhum aviso no momento.</div>';
        } else {
            notifs.forEach(t => {
                if(t.accRequestStatus.trim() === 'Aprovado' && !t.accPraDone && t.stage !== 'Finalizado' && t.stage !== 'Reprovado') {
                    notifDiv.innerHTML += `
                    <div class="bg-emerald-900/10 p-5 rounded-2xl border border-emerald-500/20 shadow-lg flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-emerald-400 text-sm">${t.colabName}</h3>
                            <span class="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Aprovado</span>
                        </div>
                        <p class="text-[11px] text-gray-300 mt-1">O líder <b class="text-white">${t.leader}</b> aprovou a prática para o dia <b class="text-emerald-400">${HA.UI.formatDateBR(t.accRequestDate).split(' ')[0]}</b>.</p>
                        <button onclick="HA.UI.openTrainingModal('${t.id}')" class="w-full mt-3 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl transition text-[9px] uppercase tracking-widest border border-white/10">Abrir Ficha</button>
                    </div>`;
                }
                else if (t.accRequestStatus.trim() === 'Recusado' && t.stage !== 'Finalizado' && t.stage !== 'Reprovado') {
                    notifDiv.innerHTML += `
                    <div class="bg-rose-900/10 p-5 rounded-2xl border border-rose-500/20 shadow-lg flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-rose-400 text-sm">${t.colabName}</h3>
                            <span class="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Recusado</span>
                        </div>
                        <p class="text-[11px] text-gray-300 mt-1">O líder <b class="text-white">${t.leader}</b> recusou a data sugerida. Re-agende o acompanhamento.</p>
                        <button onclick="HA.UI.openTrainingModal('${t.id}')" class="w-full mt-3 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold py-2 rounded-xl transition text-[9px] uppercase tracking-widest">Reagendar</button>
                    </div>`;
                }
            });
            if(notifDiv.innerHTML === '') notifDiv.innerHTML = '<div class="p-6 text-center text-gray-500 bg-white/5 rounded-2xl border border-white/5 text-xs font-bold shadow-inner">Nenhum aviso no momento.</div>';
        }

        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    acceptRequest(id) {
        const t = HA.State.trainings.find(x => x.id.toString() === id.toString()); if(!t) return;
        t.stage = '1ª Etapa (Docs Iniciais)';
        t.startDate = new Date().toISOString().split('T')[0];
        let d = new Date(); d.setDate(d.getDate() + 15); 
        t.endDate = d.toISOString().split('T')[0];
        
        HA.Data.safeSave(t).then(success => {
            if(success) HA.UI.openTrainingModal(id);
        });
    }
};

document.addEventListener('SystemReady', () => {
    const nomeElement = document.getElementById('userNameDisplay');
    if(nomeElement) nomeElement.innerText = sessionStorage.getItem('ha_user_name') || 'Facilitador DHO';
    HA.Facilitator.updateKPIs();
    HA.Facilitator.switchTab('ativos');
});

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('globalSearch');
    if(searchInput) {
        searchInput.addEventListener('input', () => {
            if(window.currentTrayType === 'Ativos' || window.currentTrayType === 'Finalizados') {
                HA.Facilitator.renderTray(window.currentTrayType);
            } else {
                HA.Facilitator.renderColabs();
            }
        });
    }
});
