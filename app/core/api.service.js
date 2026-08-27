window.HA = window.HA || {};

HA.Api = {
    showLoad(msg) { 
        const txt = document.getElementById('loadingText'); const overlay = document.getElementById('loadingOverlay');
        if(txt && overlay) { txt.innerText = msg || "Processando..."; overlay.classList.remove('hidden'); overlay.classList.add('flex'); }
    },
    hideLoad() { 
        const overlay = document.getElementById('loadingOverlay'); if(overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
    },

    getVal(obj, possibleKeys) {
        for(let k of possibleKeys) { if(obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]; }
        return '';
    },

    loadFromCloud(silent = false) {
        return this.fetchCloudData(silent);
    },

    async fetchCloudData(silent = false) {
        if(!silent) this.showLoad("Lendo Banco de Dados (Excel)...");
        try {
            const response = await fetch(HA.Config.URL_LER);
            if(!response.ok) throw new Error("Erro HTTP " + response.status);
            const data = await response.json();
            
            const getValSeguro = (obj, posiblesKeys) => {
                for(let key of posiblesKeys) { if(obj[key] !== undefined && obj[key] !== null) return obj[key]; }
                return '';
            };

            // 1. MAPEO TREINAMENTOS (Com Backup Seguro de Metadados)
            HA.State.trainings = (data.treinamentos || []).map(t => {
                let probs = []; 
                try { probs = JSON.parse(getValSeguro(t, ['Problemas', 'problemas']) || "[]"); } catch(e){}
                
                // SE AÑADIÓ: checklist: []
                let meta = { praNotes: "", attempts: [], pdf: false, email: false, liderVal: null, accReqDate: "", accReqStatus: "", checklist: [] };
                let rawPra = getValSeguro(t, ['obsAcompanhamento', 'Pratico_Obs']);
                try { 
                    let parsed = JSON.parse(rawPra); 
                    if(parsed && typeof parsed === 'object') meta = { ...meta, ...parsed };
                    else meta.praNotes = rawPra;
                } catch(e) { meta.praNotes = rawPra; }

                return {
                    id: parseInt(getValSeguro(t, ['ID_Ficha', 'spId'])) || Date.now(), 
                    spId: getValSeguro(t, ['ID_Ficha', 'spId']).toString().trim(), 
                    userId: getValSeguro(t, ['Matricula', 'matricula']).toString().trim(), 
                    colabName: getValSeguro(t, ['Colaborador', 'colaborador']).toString(),
                    leader: getValSeguro(t, ['Lider', 'solicitante']).toString(),
                    type: getValSeguro(t, ['Tipo', 'tipoTreinamento']).toString() || 'Primeira Entrada',
                    sector: getValSeguro(t, ['Setor', 'setorOrigem']).toString(),
                    area: getValSeguro(t, ['Area', 'setorSolicitado']).toString(),
                    stage: getValSeguro(t, ['Etapa', 'etapa']).toString() || 'Solicitado',
                    startDate: getValSeguro(t, ['Data_Inicio', 'dataInicio']).toString(),
                    endDate: getValSeguro(t, ['Data_Fim', 'dataFim']).toString(),
                    finalizationDate: getValSeguro(t, ['Data_Finalizacao', 'dataFinalizacao']).toString(),
                    score: parseInt(getValSeguro(t, ['Nota_Final', 'notaFinal'])) || 0,
                    facilitator: getValSeguro(t, ['Facilitador', 'facilitator']).toString() || 'A Definir',
                    teoNotes: getValSeguro(t, ['Teorico_Obs', 'obsTeorico']).toString(),
                    praNotes: meta.praNotes,
                    examAttempts: meta.attempts || [],
                    pdfUploaded: meta.pdf || false,
                    emailSent: meta.email || false,
                    liderValidation: meta.liderVal || getValSeguro(t, ['Lider_Validacao', 'obsLider']).toString() || null,
                    checklist: meta.checklist || [], // SE AÑADIÓ: checklist
                    problemsLog: probs,
                    
                    // 🔥 Lemos a coluna nativa. Se falhar, resgatamos do Backup (meta)!
                    accRequestDate: getValSeguro(t, ['Agendamento_Data', 'agendamentoData']).toString().trim() || meta.accReqDate || "",
                    accRequestStatus: getValSeguro(t, ['Agendamento_Status', 'agendamentoStatus']).toString().trim() || meta.accReqStatus || 'Pendente',
                    
                    accTeoDone: getValSeguro(t, ['Teorico_Check', 'teoricoCheck']).toString() === 'Sim', 
                    accPraDone: getValSeguro(t, ['Pratico_Check', 'praticoCheck']).toString() === 'Sim'
                };
            });

            // 2. MAPEO COLABORADORES
            HA.State.colabs = (data.colaboradores || []).map(c => ({
                spId: getValSeguro(c, ['spId', 'matricula', 'Matricula']).toString().trim(), 
                id: getValSeguro(c, ['matricula', 'Matricula']).toString().trim(), 
                name: getValSeguro(c, ['nome', 'Nome', 'Colaborador']).toString(), 
                leader: getValSeguro(c, ['lider', 'Lider']).toString(), 
                status: getValSeguro(c, ['status', 'Status']).toString() || 'Ativo',
                sector: getValSeguro(c, ['treinamentosFinalizados', 'Setor_Principal', 'setor']).toString(),
                photo: getValSeguro(c, ['FotoBase64', 'foto']).toString(),
                turno: getValSeguro(c, ['Turno', 'turno']).toString() || 'Geral' // SE AÑADIÓ: turno
            }));

            // 3. MAPEO USUARIOS
            HA.State.users = (data.usuarios || []).map(u => ({
                spId: getValSeguro(u, ['spId', 'ID_User', 'usuario']).toString().trim(), 
                id: getValSeguro(u, ['ID_User', 'usuario']).toString().trim(), 
                pass: getValSeguro(u, ['Senha', 'senha']).toString().trim(), 
                name: getValSeguro(u, ['Nome', 'nome']).toString(), 
                role: getValSeguro(u, ['Role', 'cargo', 'permissoes']).toString(),
                photo: getValSeguro(u, ['foto', 'FotoBase64']).toString() // SE AÑADIÓ: photo
            }));

            if(!HA.State.users.find(u => u.id === '4dm1n')) HA.State.users.push(HA.Constants.DefaultUsers[0]);

            localStorage.setItem('hennings_trainings', JSON.stringify(HA.State.trainings)); 
            localStorage.setItem('hennings_colabs', JSON.stringify(HA.State.colabs));
            localStorage.setItem('hennings_users', JSON.stringify(HA.State.users));
            
            if(!silent) this.hideLoad(); 
            document.dispatchEvent(new Event('SystemReady'));

        } catch(err) {
            HA.State.trainings = JSON.parse(localStorage.getItem('hennings_trainings')) || []; 
            HA.State.colabs = JSON.parse(localStorage.getItem('hennings_colabs')) || []; 
            HA.State.users = JSON.parse(localStorage.getItem('hennings_users')) || HA.Constants.DefaultUsers;
            if(!silent) { this.hideLoad(); alert("Falha de conexão. Modo Offline ativado."); }
            document.dispatchEvent(new Event('SystemReady'));
        }
    },

    async safeSave(updatedTraining = null) {
        this.showLoad("Gravando Dossiê na Nuvem...");
        try {
            if (updatedTraining && !updatedTraining.delete) {
                const tempSpId = (updatedTraining.spId || "").toString().trim();
                const isNew = tempSpId === "" || tempSpId === "0";

                const payloadTrain = {
                    spId: isNew ? "CRIAR" : tempSpId,
                    solicitante: updatedTraining.leader || "-",
                    tipoTreinamento: updatedTraining.type || "-",
                    status: updatedTraining.stage || "-",
                    matricula: updatedTraining.userId || "-",
                    colaborador: updatedTraining.colabName || "-",
                    setorOrigem: updatedTraining.sector || "-",
                    setorSolicitado: updatedTraining.area || "-",
                    dataInicio: updatedTraining.startDate || "",
                    dataFim: updatedTraining.endDate || "",
                    dataFinalizacao: updatedTraining.finalizationDate || "",
                    etapa: updatedTraining.stage || "-",
                    notaFinal: updatedTraining.score ? updatedTraining.score.toString() : "0",
                    obsTeorico: updatedTraining.teoNotes || "",
                    
                    // 🔥 BACKUP DE SEGURANÇA NO JSON
                    obsAcompanhamento: JSON.stringify({
                        praNotes: updatedTraining.praNotes || "",
                        attempts: updatedTraining.examAttempts || [],
                        pdf: updatedTraining.pdfUploaded || false,
                        email: updatedTraining.emailSent || false,
                        liderVal: updatedTraining.liderValidation || null,
                        accReqDate: updatedTraining.accRequestDate || "",
                        accReqStatus: updatedTraining.accRequestStatus || "Pendente",
                        checklist: updatedTraining.checklist || [] // SE AÑADIÓ: checklist
                    }),
                    
                    problemas: JSON.stringify(updatedTraining.problemsLog || []),
                    facilitador: updatedTraining.facilitator || "-",
                    
                    // Colunas Nativas
                    agendamentoData: updatedTraining.accRequestDate || "",
                    agendamentoStatus: updatedTraining.accRequestStatus || "Pendente",
                    
                    teoricoCheck: updatedTraining.accTeoDone ? "Sim" : "Não",
                    praticoCheck: updatedTraining.accPraDone ? "Sim" : "Não",
                    obsLider: updatedTraining.liderValidation || "",
                    ID_Ficha: updatedTraining.id.toString()
                };

                const res = await fetch(HA.Config.URL_SALVAR_TREINAMENTO, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadTrain) 
                });
                
                if(!res.ok) throw new Error(`Status ${res.status}`);
            }
            
            await this.fetchCloudData(true);
            this.hideLoad();
            return true;

        } catch(err) {
            if(err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
                setTimeout(() => {
                    this.fetchCloudData(true);
                    this.hideLoad();
                }, 1500);
                return true;
            } else {
                this.hideLoad(); 
                alert(`Falha no Power Automate.\nDetalhes: ${err.message}`); 
                return false;
            }
        }
    }
};

HA.Data = HA.Api;
