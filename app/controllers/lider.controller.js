// =========================================================
// LIDER CONTROLLER (Dashboard Analítico & Operações)
// =========================================================
window.HA = window.HA || {};

HA.Lider = {
    chartsInstance: {},

    init() {
        const uid = sessionStorage.getItem('ha_user_id'); 
        const urole = sessionStorage.getItem('ha_user_role');
        
        if(!uid || (!urole.includes('Lider') && !urole.includes('Supervisor'))) { 
            window.location.href = 'index.html'; 
            return; 
        }
        
        document.getElementById('userNameDisplay').innerText = sessionStorage.getItem('ha_user_name');
        document.getElementById('userRoleBadge').innerText = urole === 'Supervisor' ? 'SUPERVISOR' : 'LÍDER OPERACIONAL';
        
        if(urole === 'Supervisor') { 
            const tPanel = document.getElementById('troca-panel'); 
            if(tPanel) tPanel.classList.add('hidden'); 
        }
    },

    switchTab(viewId) {
        ['view-dash', 'view-equipe', 'view-inbox'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        
        ['tab-dash', 'tab-equipe', 'tab-inbox'].forEach(id => { 
            const btn = document.getElementById(id);
            if(btn) btn.classList.remove('nav-active'); 
        });
        
        const viewEl = document.getElementById(viewId);
        if(viewEl) viewEl.classList.remove('hidden');
        
        const activeBtn = document.getElementById(viewId.replace('view', 'tab'));
        if(activeBtn) activeBtn.classList.add('nav-active');

        if(viewId === 'view-dash') this.renderDash();
        if(viewId === 'view-equipe') this.renderEquipe();
    },

    getFilteredTrainings() { return HA.State.currentUser.role === 'Supervisor' ? [...HA.State.trainings] : HA.State.trainings.filter(t => t.leader && t.leader.includes(HA.State.currentUser.name.split(' ')[0])); },
    getFilteredTeam() { return HA.State.currentUser.role === 'Supervisor' ? [...HA.State.colabs] : HA.State.colabs.filter(c => c.leader && c.leader.includes(HA.State.currentUser.name.split(' ')[0])); },
    
    getProgress(stage) {
        if (!stage) return { pct: 0, color: 'bg-gray-500' };
        if (stage === 'Solicitado') return { pct: 5, color: 'bg-indigo-500' };
        if (stage.includes('1ª Etapa')) return { pct: 20, color: 'bg-blue-500' };
        if (stage.includes('2ª Etapa')) return { pct: 40, color: 'bg-blue-400' };
        if (stage.includes('Acompanhamento')) return { pct: 60, color: 'bg-mustard-500' };
        if (stage.includes('Aguardando')) return { pct: 80, color: 'bg-mustard-400' };
        if (stage.includes('Finalizado') || stage.includes('Reprovado')) return { pct: 100, color: stage.includes('Finalizado') ? 'bg-emerald-500' : 'bg-rose-500' };
        return { pct: 10, color: 'bg-gray-500' };
    },

    renderDash() {
        const myTeam = this.getFilteredTeam().filter(c => c.status !== 'Desligado');
        const myTrainings = this.getFilteredTrainings();
        
        // --- 1. CARREGAR FOTO DO LÍDER NA SIDEBAR ---
        const myProfile = HA.State.colabs.find(c => c.name.toLowerCase() === HA.State.currentUser.name.toLowerCase());
        const picContainer = document.getElementById('lider-pic-container');
        if (myProfile && myProfile.photo && picContainer) {
            picContainer.innerHTML = `<img src="${myProfile.photo}" class="w-full h-full object-cover">`;
        }

        // --- 2. LÓGICA DE LIMITES DE TROCA DE ÁREA ---
        if(HA.State.currentUser.role !== 'Supervisor') {
            const myActiveTrocas = myTrainings.filter(t => t.type === 'Troca de Área' && !t.stage.includes('Finalizado') && !t.stage.includes('Reprovado'));
            const trocasCount = myActiveTrocas.length; 
            const trocasLeft = 5 - trocasCount;
            const tUsed = document.getElementById('trocas-used'); 
            const availText = document.getElementById('trocas-available');
            
            if(tUsed) tUsed.innerHTML = `${trocasCount}<span class="text-2xl text-white/20 font-black">/5</span>`;
            if(availText) {
                if(trocasLeft <= 0) { 
                    availText.innerText = `⚠️ Sem vagas`; 
                    availText.className = "text-[9px] font-black text-rose-400 mt-4 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg uppercase tracking-widest shadow-sm w-full text-center"; 
                } else { 
                    availText.innerText = `🔋 ${trocasLeft} Vagas`; 
                    availText.className = "text-[9px] font-black text-emerald-400 mt-4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg uppercase tracking-widest shadow-sm w-full text-center"; 
                }
            }
        }

        // --- 3. TABELA DE ACTIVOS ---
        const tbody = document.getElementById('table-ativos'); 
        if(tbody) {
            tbody.innerHTML = '';
            let actives = myTrainings.filter(t => t.stage !== 'Finalizado' && t.stage !== 'Reprovado');

            document.getElementById('kpi-total-equipe').innerText = myTeam.length;
            document.getElementById('kpi-treinos-ativos').innerText = actives.length;
            document.getElementById('kpi-validacoes').innerText = myTrainings.filter(t => t.stage === 'Finalizado' && !t.liderValidation).length;

            if(actives.length === 0) tbody.innerHTML = `<tr><td colspan="3" class="px-8 py-10 text-center text-gray-500"><p class="font-bold text-[10px] uppercase tracking-widest">Nenhuma missão ativa no momento.</p></td></tr>`;
            
            actives.forEach(t => {
                const prog = this.getProgress(t.stage);
                const badgeType = t.type === 'Troca de Área' ? 'indigo' : 'blue';
                let stDisp = t.stage === 'Solicitado' ? '<span class="text-indigo-400 animate-pulse">Aguardando Início</span>' : t.stage;
                
                let actBtn = `<button onclick="HA.Lider.openDetails(${t.id})" class="text-mustard-400 hover:text-white p-2.5 bg-[#070b14] rounded-lg border border-white/10 transition shadow-sm hover:border-mustard-500/50" title="Acompanhar"><i data-lucide="eye" class="w-4 h-4"></i></button>`;
                if(t.accRequestStatus === 'Aguardando Líder') { actBtn = `<button onclick="HA.Lider.openDetails(${t.id})" class="text-white bg-indigo-600 hover:bg-indigo-500 py-2.5 px-4 rounded-lg transition shadow-sm text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> Decidir</button>`; }

                tbody.innerHTML += `
                <tr class="transition hover:bg-white/5 border-b border-white/5 group">
                    <td class="px-8 py-5">
                        <div class="font-bold text-white text-xs mb-1">${t.colabName}</div>
                        <div class="text-[9px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2">ID: ${t.userId} <span class="text-${badgeType}-400">${t.type}</span></div>
                    </td>
                    <td class="px-8 py-5 w-1/2">
                        <div class="flex justify-between items-end mb-2">
                            <span class="font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-tight">${stDisp}<br><span class="text-white/60">${t.sector} > ${t.area}</span></span>
                            <span class="font-black text-white text-[10px] bg-[#070b14] border border-white/5 px-2 py-1 rounded">${prog.pct}%</span>
                        </div>
                        <div class="w-full bg-[#070b14] rounded-full h-1.5 overflow-hidden border border-white/5"><div class="${prog.color} h-full transition-all duration-500 progress-bar-striped animate-[pulse_2s_ease-in-out_infinite]" style="width: ${prog.pct}%"></div></div>
                    </td>
                    <td class="px-8 py-5 text-right flex flex-col items-end gap-2">
                        ${actBtn}
                    </td>
                </tr>`;
            });

            let pendingVals = myTrainings.filter(t => t.stage === 'Finalizado' && !t.liderValidation);
            pendingVals.forEach(t => {
                tbody.innerHTML += `
                <tr class="transition bg-emerald-900/10 hover:bg-emerald-900/20 border-b border-emerald-500/20">
                    <td class="px-8 py-5">
                        <div class="font-bold text-emerald-400 text-xs mb-1 flex items-center gap-2"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ${t.colabName}</div>
                        <div class="text-[9px] text-gray-500 font-mono uppercase tracking-widest">ID: ${t.userId}</div>
                    </td>
                    <td class="px-8 py-5 w-1/2">
                        <span class="font-bold text-[9px] text-white uppercase tracking-widest leading-tight">${t.sector} > ${t.area}</span>
                        <div class="mt-1.5"><span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[8px] font-black uppercase tracking-widest inline-block animate-pulse">Requer Assinatura</span></div>
                    </td>
                    <td class="px-8 py-5 text-right flex flex-col items-end justify-center">
                        <button onclick="HA.Lider.openDetails(${t.id})" class="bg-orange-600 hover:bg-orange-500 text-white font-black text-[9px] px-4 py-2.5 rounded-lg transition uppercase tracking-widest flex items-center gap-1.5"><i data-lucide="clipboard-signature" class="w-3 h-3"></i> Validar</button>
                    </td>
                </tr>`;
            });
        }

        this.initDashboardCharts(myTeam, myTrainings);
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    initDashboardCharts(myTeam, myTrainings) {
        const sectores = {};
        myTeam.forEach(c => {
            const sec = c.sector || 'Não Definido';
            sectores[sec] = (sectores[sec] || 0) + 1;
        });

        const ctxSectores = document.getElementById('chartSectores');
        if(ctxSectores) {
            if(this.chartsInstance.sectores) this.chartsInstance.sectores.destroy();
            this.chartsInstance.sectores = new Chart(ctxSectores, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(sectores),
                    datasets: [{
                        data: Object.values(sectores),
                        backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'],
                        borderWidth: 0, hoverOffset: 4
                    }]
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 10, family: 'Inter' } } } }, 
                    cutout: '75%' 
                }
            });
        }

        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const conteoMeses = new Array(12).fill(0);
        const currentYear = new Date().getFullYear();
        
        myTrainings.forEach(t => {
            if(t.startDate) {
                const d = HA.UI.parseDate(t.startDate);
                if(d && d.getFullYear() === currentYear) {
                    conteoMeses[d.getMonth()]++;
                }
            }
        });

        const ctxEvolucion = document.getElementById('chartEvolucion');
        if(ctxEvolucion) {
            if(this.chartsInstance.evolucion) this.chartsInstance.evolucion.destroy();
            this.chartsInstance.evolucion = new Chart(ctxEvolucion, {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Treinamentos Iniciados',
                        data: conteoMeses,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        borderWidth: 2,
                        tension: 0.4, fill: true, pointBackgroundColor: '#fff', pointBorderColor: '#6366f1', pointBorderWidth: 2
                    }]
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    scales: { 
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#64748b', stepSize: 1, font: {family: 'Inter'} } }, 
                        x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', font: {family: 'Inter'} } } 
                    }, 
                    plugins: { legend: { display: false } } 
                }
            });
        }
    },

    renderEquipe() {
        const myTeam = this.getFilteredTeam().filter(c => c.status !== 'Desligado');
        
        const grid = document.getElementById('team-grid-full'); 
        if(!grid) return;
        grid.innerHTML = '';
        
        if(myTeam.length === 0) {
            grid.innerHTML = `<div class="col-span-full p-8 text-center text-gray-500 font-bold bg-[#070b14]/50 rounded-2xl border border-white/5">Nenhum colaborador encontrado sob sua liderança.</div>`;
            return;
        }

        // --- CORREÇÃO: Buscando aptidões no Histórico GLOBAL, removendo duplicatas! ---
        const getAptos = (id) => {
            const arrAptos = HA.State.trainings
                .filter(t => t.userId.toString() === id.toString() && t.stage === 'Finalizado')
                .map(t => t.area);
            return [...new Set(arrAptos)]; // Remove áreas duplicadas (ex: Reciclagens)
        };

        myTeam.forEach(c => {
            const img = c.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";
            const aptos = getAptos(c.id);
            let aptosHtml = aptos.length > 0 ? aptos.map(a => `<span class="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-[9px] font-bold m-0.5 uppercase tracking-widest"><i data-lucide="check" class="w-2.5 h-2.5 inline mr-0.5"></i> ${a.substring(0,12)}</span>`).join('') : `<span class="text-[9px] text-gray-600 italic block">Sem aptidões validadas</span>`;

            grid.innerHTML += `
            <div class="bg-[#0f1523]/80 p-6 rounded-[2rem] border border-white/5 shadow-lg flex flex-col items-center text-center hover:border-indigo-500/30 transition-all duration-300 group cursor-pointer" onclick="HA.UI.openHistory('${c.id}')">
                <div class="relative w-16 h-16 mb-4">
                    <img src="${img}" class="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:scale-105 transition-transform bg-[#070b14] shadow-md">
                </div>
                <div class="text-sm font-black text-white leading-tight mb-1 group-hover:text-indigo-400 transition-colors">${c.name}</div>
                <div class="text-[9px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-3 w-full">ID: ${c.id} • ${c.sector || 'Produção'}</div>
                <div class="w-full text-center h-12 overflow-hidden flex flex-wrap justify-center gap-1">${aptosHtml}</div>
            </div>`;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderInbox() {
        const list = document.getElementById('inbox-list'); 
        if(!list) return;
        list.innerHTML = '';
        
        const pendingAcc = this.getFilteredTrainings().filter(t => t.accRequestStatus === 'Aguardando Líder');
        const badge = document.getElementById('reqBadge');
        if(pendingAcc.length > 0) { badge.innerText = pendingAcc.length; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); }
        
        if(pendingAcc.length === 0) {
            list.innerHTML = `<div class="p-10 text-center text-gray-500 bg-[#070b14]/50 rounded-3xl border border-white/5 shadow-inner"><p class="text-xs font-bold uppercase tracking-widest">Sua mesa está limpa! Sem aprovações pendentes.</p></div>`; return;
        }
        pendingAcc.forEach(t => {
            list.innerHTML += `
            <div class="bg-[#070b14]/50 p-8 rounded-3xl border-l-[3px] border-l-mustard-500 shadow-inner border border-white/5 relative">
                <div class="flex justify-between items-start mb-5">
                    <div><h3 class="font-black text-white text-lg tracking-wide">${t.colabName}</h3><p class="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Destino: <span class="text-white">${t.area}</span></p></div>
                    <span class="bg-mustard-500/10 text-mustard-500 border border-mustard-500/20 text-[9px] font-black px-3 py-1.5 rounded uppercase tracking-widest">Aguardando Aval</span>
                </div>
                <p class="text-xs text-gray-400 mb-6 leading-relaxed">O facilitador <b class="text-white">${t.facilitator.split(' ')[0]}</b> sugeriu o dia <b class="text-mustard-400">${HA.UI.formatDateBR(t.accRequestDate).split(' ')[0]}</b> para o acompanhamento prático.</p>
                <div class="flex gap-3">
                    <button onclick="HA.Lider.responderAcompanhamento('${t.id}', 'Aprovado')" class="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><i data-lucide="check" class="w-4 h-4"></i> Autorizar</button>
                    <button onclick="HA.Lider.responderAcompanhamento('${t.id}', 'Recusado')" class="flex-1 bg-white/5 text-gray-400 font-bold py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><i data-lucide="x" class="w-4 h-4"></i> Negar</button>
                </div>
            </div>`;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ==========================================
    // LÓGICA DEL WIZARD DE SOLICITUD (NOVO)
    // ==========================================

    openWizardSolicitacao() {
        document.getElementById('wiz-cracha').value = '';
        document.getElementById('wiz-nome').value = '';
        document.getElementById('wiz-setor-atual').value = '';
        document.getElementById('wiz-setor-alvo').value = '';
        document.getElementById('wiz-area-alvo').innerHTML = '';
        document.getElementById('wiz-obs').value = '';
        this.setWizardType('Troca de Área'); 
        document.getElementById('modalWizardSolicitacao').classList.remove('hidden');
        document.getElementById('modalWizardSolicitacao').classList.add('flex');
    },

    setWizardType(tipo) {
        document.getElementById('wiz-tipo').value = tipo;
        const isTroca = (tipo === 'Troca de Área');
        const cracha = document.getElementById('wiz-cracha');
        const nome = document.getElementById('wiz-nome');
        const setorAtual = document.getElementById('wiz-setor-atual');
        
        nome.readOnly = isTroca;
        
        if(isTroca) {
            nome.classList.add('opacity-50', 'bg-black/50', 'cursor-not-allowed');
            setorAtual.classList.add('opacity-50', 'bg-black/50', 'pointer-events-none');
            document.getElementById('wiz-msg-cracha').innerText = "Digite para buscar na base...";
            document.getElementById('wiz-magic-icon').classList.remove('hidden');
        } else {
            nome.classList.remove('opacity-50', 'bg-black/50', 'cursor-not-allowed');
            setorAtual.classList.remove('opacity-50', 'bg-black/50', 'pointer-events-none');
            document.getElementById('wiz-msg-cracha').innerText = "Criação de novo perfil";
            document.getElementById('wiz-magic-icon').classList.add('hidden');
            nome.value = ''; 
            setorAtual.value = '';
        }
        
        cracha.classList.remove('border-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.3)]', 'border-rose-500');
        if(cracha.value) this.buscarColaboradorPorCracha();
    },

    buscarColaboradorPorCracha() {
        const cracha = document.getElementById('wiz-cracha');
        const val = cracha.value.trim();
        const tipo = document.getElementById('wiz-tipo').value;
        const msg = document.getElementById('wiz-msg-cracha');
        
        cracha.classList.remove('border-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.3)]', 'border-rose-500');

        if(tipo === 'Troca de Área') {
            if(val.length === 0) {
                document.getElementById('wiz-nome').value = '';
                document.getElementById('wiz-setor-atual').value = '';
                msg.innerText = "Digite para buscar na base...";
                msg.className = "text-[9px] font-bold mt-2 h-3 text-gray-500";
                return;
            }

            const colab = HA.State.colabs.find(c => c.id.toString() === val);
            
            if(colab) {
                document.getElementById('wiz-nome').value = colab.name;
                document.getElementById('wiz-setor-atual').value = colab.sector || 'Produção';
                cracha.classList.add('border-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.3)]');
                msg.innerText = "Colaborador Encontrado ✓";
                msg.className = "text-[9px] font-bold mt-2 h-3 text-emerald-400";
            } else {
                document.getElementById('wiz-nome').value = '';
                document.getElementById('wiz-setor-atual').value = '';
                cracha.classList.add('border-rose-500');
                msg.innerText = "Colaborador Não Encontrado na Base.";
                msg.className = "text-[9px] font-bold mt-2 h-3 text-rose-400";
            }
        }
    },

    updateAreasWizard() {
        const s = document.getElementById('wiz-setor-alvo').value; 
        const a = document.getElementById('wiz-area-alvo'); 
        a.innerHTML = '';
        if(HA.Constants.Sectors[s]) { 
            HA.Constants.Sectors[s].forEach(ar => a.innerHTML += `<option value="${ar}">${ar}</option>`); 
        }
    },

    async submitWizard(e) {
        e.preventDefault();
        const tipo = document.getElementById('wiz-tipo').value;
        const cracha = document.getElementById('wiz-cracha').value.trim();
        const nome = document.getElementById('wiz-nome').value.trim();
        const setorAtual = document.getElementById('wiz-setor-atual').value;
        const setorAlvo = document.getElementById('wiz-setor-alvo').value;
        const areaAlvo = document.getElementById('wiz-area-alvo').value || setorAlvo;
        const obsLider = document.getElementById('wiz-obs').value.trim();
        const cleader = HA.State.currentUser.name.split(' ')[0];

        if(!nome) return alert("Por favor, preencha ou localize o colaborador corretamente.");

        if(tipo === 'Troca de Área' && HA.State.currentUser.role !== 'Supervisor') {
            const act = HA.State.trainings.filter(t => t.leader === cleader && t.type === 'Troca de Área' && t.stage !== 'Finalizado' && t.stage !== 'Reprovado');
            if(act.length >= 5) return alert("Atenção: Limite máximo de 5 solicitações ativas de Troca de Área atingido.");
        }

        if(tipo === 'Primeira Entrada' && HA.State.colabs.some(x => x.id.toString() === cracha)) {
            return alert("Matrícula já está cadastrada na base. Mude para 'Troca de Área'.");
        }

        HA.Api.showLoad("Codificando no Mainframe DHO...");

        let probs = []; 
        if(obsLider) probs.push({ date: new Date().toISOString(), text: `OBS Comandante na Solicitação: ${obsLider}` });
        
        if(tipo === 'Primeira Entrada') {
            const payloadColab = { 
                spId: "CRIAR", 
                matricula: cracha, 
                treinamentosFinalizados: setorAtual || 'Produção', 
                nome: nome, 
                lider: cleader, 
                status: "Ativo", 
                foto: "" 
            };
            try {
                await fetch(HA.Config.URL_SALVAR_COLABORADOR, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(payloadColab) 
                });
            } catch(err) { }
        }

        const tr = { 
            id: Date.now(), spId: "CRIAR", userId: cracha, colabName: nome, leader: cleader, type: tipo, 
            sector: setorAlvo, area: areaAlvo, facilitator: 'A Definir', stage: 'Solicitado', 
            startDate: '', endDate: '', problemsLog: probs, accRequestStatus: 'Pendente' 
        };

        HA.Api.safeSave(tr).then(success => { 
            HA.UI.closeModal('modalWizardSolicitacao');
            if(success) {
                alert("🚀 Solicitação enviada com sucesso para a equipe DHO.");
                this.switchTab('view-dash');
            }
        });
    },
    
    responderAcompanhamento(id, resposta) {
        const t = HA.State.trainings.find(x => x.id.toString() === id.toString()); if(!t) return;
        t.accRequestStatus = resposta;
        if(resposta === 'Recusado') {
            const arr = Array.isArray(t.problemsLog) ? t.problemsLog : [];
            arr.unshift({ date: new Date().toISOString(), text: `Comandante recusou a data sugerida (${HA.UI.formatDateBR(t.accRequestDate).split(' ')[0]}).` });
            t.problemsLog = arr; t.accRequestDate = ""; 
        }
        HA.Api.safeSave(t).then(() => { this.switchTab('view-dash'); }); 
    },
    
    validarPratica(id) {
        const t = HA.State.trainings.find(x => x.id.toString() === id.toString()); if(!t) return;
        if(confirm(`Você atesta sob sua responsabilidade que ${t.colabName} está apto(a) a operar no setor após o Treinamento DHO?`)) {
            t.liderValidation = "Aprovado (Apto p/ Operação)";
            HA.Api.safeSave(t).then(() => HA.UI.closeModal('modalDetalhes'));
        }
    },
    
    openDetails(id) {
        const t = HA.State.trainings.find(x => x.id.toString() === id.toString()); if(!t) return;
        let probsHtml = ''; let arrProbs = Array.isArray(t.problemsLog) ? t.problemsLog : [];
        if(arrProbs.length === 0) probsHtml = '<p class="text-[10px] text-gray-500 italic text-center font-medium">Nenhuma ocorrência.</p>';
        else {
            probsHtml = `<div class="space-y-3">`;
            arrProbs.forEach(p => { probsHtml += `<div class="flex gap-3 bg-[#070b14] p-4 rounded-xl border border-white/5"><div class="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></div><div><p class="text-[9px] text-gray-500 font-mono mb-1 uppercase tracking-widest">${HA.UI.formatDateBR(p.date)}</p><p class="text-xs text-gray-300">${p.text}</p></div></div>`; });
            probsHtml += `</div>`;
        }
        const html = `
            <div class="bg-[#0f1523] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/5 animate-slide-up overflow-hidden">
                <div class="px-8 py-6 flex justify-between items-center border-b border-white/5">
                    <h2 class="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-white"><i data-lucide="file-text" class="w-4 h-4 text-indigo-500"></i> Dossiê DHO</h2>
                    <button onclick="HA.UI.closeModal('modalDetalhes')" class="text-gray-500 hover:text-white transition"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-8 overflow-y-auto custom-scroll flex-1">
                    <div class="flex justify-between items-start mb-8">
                        <div><h3 class="text-2xl font-black text-white">${t.colabName}</h3><p class="text-[10px] text-gray-400 font-mono mt-1">ID: ${t.userId} | Destino: <span class="text-indigo-400 font-bold">${t.area}</span></p></div>
                        <div class="text-right"><span class="inline-block bg-white/5 text-white text-[9px] font-bold px-3 py-1.5 rounded uppercase tracking-widest">${t.stage}</span></div>
                    </div>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-[#070b14] border border-white/5 rounded-2xl p-6"><h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Relatório Teórico</h4><p class="text-xs text-gray-400 whitespace-pre-wrap">${t.teoNotes || 'Aguardando relatórios...'}</p></div>
                            <div class="bg-[#070b14] border border-white/5 rounded-2xl p-6"><h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Avaliação Prática</h4><p class="text-xs text-gray-400 whitespace-pre-wrap">${t.praNotes || 'Aguardando relatórios...'}</p></div>
                        </div>
                        <div class="bg-[#070b14] border border-white/5 rounded-2xl p-6"><h4 class="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4">Ocorrências</h4>${probsHtml}</div>
                    </div>
                </div>
                <div class="border-t border-white/5 p-6 flex justify-end gap-3" id="modalFooterActions"></div>
            </div>`;
        const modal = document.getElementById('modalDetalhes'); modal.innerHTML = html;
        const footer = document.getElementById('modalFooterActions');
        if(t.stage === 'Finalizado' && !t.liderValidation && HA.State.currentUser.role !== 'Supervisor') {
            footer.innerHTML = `<button onclick="HA.UI.closeModal('modalDetalhes')" class="px-6 py-3 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition hover:bg-white/10">Fechar</button><button onclick="HA.Lider.validarPratica('${t.id}')" class="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition flex items-center gap-2"><i data-lucide="check" class="w-4 h-4"></i> Atestar Aptidão</button>`;
        } else { footer.innerHTML = `<button onclick="HA.UI.closeModal('modalDetalhes')" class="px-6 py-3 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition hover:bg-white/10">Fechar</button>`; }
        modal.classList.remove('hidden'); modal.classList.add('flex'); if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// GATILHOS DE INICIO
document.addEventListener('SystemReady', () => { 
    HA.Lider.init(); 
    HA.Lider.renderDash(); 
    HA.Lider.renderEquipe();
    HA.Lider.renderInbox(); 
});
document.addEventListener('DOMContentLoaded', () => { 
    HA.Lider.switchTab('view-dash'); 
});
