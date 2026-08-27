// =========================================================
// ADMIN CONTROLLER (Gestão de Usuários e Colaboradores)
// =========================================================

window.HA = window.HA || {};

window.HA.Admin = {
    
    // --- 1. RENDERIZAR USUÁRIOS ---
    renderUsers() {
        const uTbody = document.getElementById('table-users');
        if(!uTbody) return;
        
        uTbody.innerHTML = '';
        HA.State.users.forEach(u => {
            let rCol = u.role === 'Admin' ? 'rose' : (u.role === 'Facilitador' ? 'indigo' : 'mustard');
            let deleteBtn = u.id !== '4dm1n' ? `<button onclick="HA.Admin.deleteUser('${u.id}')" class="text-rose-400 hover:text-white p-1.5 bg-white/10 rounded-lg border border-white/20 transition shadow-sm ml-1" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : '';

            uTbody.innerHTML += `
            <tr class="border-b border-white/5 hover:bg-white/5 transition">
                <td class="px-6 py-4 text-xs font-mono text-gray-400 font-bold">${u.id}</td>
                <td class="px-6 py-4 text-sm font-bold text-white">${u.name} ${u.supervisor && u.supervisor !== '-' ? `<br><span class="text-[9px] text-gray-500 font-normal">Sup: ${u.supervisor}</span>` : ''}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-${rCol}-500/20 text-${rCol}-400 border border-${rCol}-500/30 rounded text-[9px] font-bold uppercase tracking-widest inline-block">${u.role}</span></td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                    <button onclick="HA.Admin.openUserModal('${u.id}')" class="text-indigo-400 hover:text-white p-1.5 bg-white/10 rounded-lg border border-white/20 transition shadow-sm"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    ${deleteBtn}
                </td>
            </tr>`;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    // --- 2. RENDERIZAR COLABORADORES ---
    renderColabs() {
        const cTbody = document.getElementById('table-colabs-admin');
        if(!cTbody) return;
        
        cTbody.innerHTML = '';
        let filteredColabs = HA.State.colabs;
        if(HA.State.searchTerm) {
            filteredColabs = HA.State.colabs.filter(c => c.name.toLowerCase().includes(HA.State.searchTerm) || c.id.includes(HA.State.searchTerm));
        }

        if(filteredColabs.length === 0) {
            cTbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-gray-500">Nenhum colaborador encontrado.</td></tr>`;
            return;
        }

        filteredColabs.forEach(c => {
            const imgStr = c.photo ? c.photo : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/%3E%3C/svg%3E";
            const statusBadge = c.status === 'Ativo' ? '<span class="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30 uppercase font-bold tracking-widest">Ativo</span>' : '<span class="text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded text-[10px] border border-rose-500/30 uppercase font-bold tracking-widest">Desligado</span>';

            cTbody.innerHTML += `
            <tr class="border-b border-white/5 hover:bg-white/5 transition ${c.status === 'Desligado' ? 'opacity-50 grayscale hover:grayscale-0' : ''}">
                <td class="px-6 py-4 flex items-center gap-3">
                    <img src="${imgStr}" class="w-10 h-10 rounded-full object-cover border border-white/20">
                    <div>
                        <div class="text-sm font-bold text-white">${c.name}</div>
                        <div class="text-[10px] text-gray-500 font-mono mt-0.5">ID: ${c.id}</div>
                    </div>
                </td>
                <td class="px-6 py-4 text-xs text-gray-300 font-bold">${c.sector}<br><span class="text-gray-500 text-[9px] uppercase tracking-widest font-normal">Líder: ${c.leader}</span></td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                    <button onclick="HA.UI.openHistory('${c.id}')" class="text-blue-400 hover:text-white p-1.5 bg-white/10 rounded-lg border border-white/20 transition shadow-sm mr-1" title="Ver Perfil Completo"><i data-lucide="award" class="w-4 h-4"></i></button>
                    <button onclick="HA.UI.openColabModal('${c.id}')" class="text-mustard-400 hover:text-white p-1.5 bg-white/10 rounded-lg border border-white/20 transition shadow-sm mr-1" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="HA.Admin.deleteColab('${c.id}')" class="text-rose-400 hover:text-white p-1.5 bg-white/10 rounded-lg border border-white/20 transition shadow-sm" title="Excluir da Base"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    // --- FUNÇÕES DE USUÁRIO (Modais e Salvamento) ---
    openUserModal(id = null) {
        console.log("🟢 [ADMIN] Abrindo Modal de Usuário para ID:", id);
        const container = document.getElementById('modalUserContainer');
        if(!container) {
            console.error("🔴 ERRO: O HTML não tem a div 'modalUserContainer'!");
            alert("Erro estrutural: Contêiner do Modal não encontrado.");
            return;
        }

        container.innerHTML = `
        <div class="glass-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20 animate-fade-in bg-navy-900">
            <div class="bg-navy-950 text-white px-6 py-4 flex justify-between items-center border-b border-white/10">
                <h2 class="text-sm font-bold uppercase tracking-widest text-mustard-500">${id ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <button type="button" onclick="HA.UI.closeModal('modalUserContainer')" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <form onsubmit="HA.Admin.saveUser(event)" class="p-6 space-y-4">
                <input type="hidden" id="u-spId">
                <div><label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">ID / Login</label><input type="text" id="u-id" required class="input-clean" ${id ? 'readonly' : ''}></div>
                <div><label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Senha</label><input type="text" id="u-pass" required class="input-clean"></div>
                <div><label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Nome Completo</label><input type="text" id="u-name" required class="input-clean"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Nível (Role)</label>
                        <select id="u-role" onchange="HA.Admin.toggleSupervisorField()" required class="input-clean font-bold">
                            <option value="Admin">Administrador</option>
                            <option value="Facilitador">Facilitador</option>
                            <option value="Lider">Líder de Setor</option>
                        </select>
                    </div>
                    <div id="supervisorBox">
                        <label class="block text-[10px] text-mustard-400 uppercase tracking-widest mb-1">Supervisor</label>
                        <select id="u-supervisor" class="input-clean">
                            <option value="João Mauricio">João Mauricio</option>
                            <option value="-">Nenhum</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="w-full bg-mustard-500 text-navy-950 py-3 rounded-xl text-sm font-bold uppercase tracking-widest mt-4 hover:bg-mustard-400 transition shadow-[0_0_15px_rgba(245,158,11,0.2)]">Salvar e Enviar p/ Nuvem</button>
            </form>
        </div>`;
        
        if(id) {
            const u = HA.State.users.find(x => x.id === id); 
            if(u) {
                document.getElementById('u-spId').value = u.spId || 0;
                document.getElementById('u-id').value = u.id; 
                document.getElementById('u-pass').value = u.pass; 
                document.getElementById('u-name').value = u.name; 
                document.getElementById('u-role').value = u.role;
            }
        }
        
        HA.Admin.toggleSupervisorField();
        container.classList.remove('hidden');
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    toggleSupervisorField() {
        const role = document.getElementById('u-role').value;
        const box = document.getElementById('supervisorBox');
        if(box) {
            if(role === 'Lider') box.classList.remove('hidden');
            else box.classList.add('hidden');
        }
    },

    saveUser(e) {
        e.preventDefault(); 
        const newUser = { 
            spId: document.getElementById('u-spId').value,
            id: document.getElementById('u-id').value, 
            pass: document.getElementById('u-pass').value, 
            name: document.getElementById('u-name').value, 
            role: document.getElementById('u-role').value 
        };
        
        HA.Data.safeSave(null, null, newUser).then(success => { 
            if(success) {
                HA.UI.closeModal('modalUserContainer');
                alert("Usuário salvo com sucesso no SharePoint!");
            }
        });
    },

    deleteUser(id) {
        if(id === '4dm1n') return alert("O Master Admin não pode ser excluído.");
        if(confirm(`Deseja excluir o acesso do usuário "${id}"?`)) {
            HA.Data.safeSave(null, null, { id: id, delete: true });
        }
    },

    deleteColab(id) {
        if(confirm("ATENÇÃO: Deseja excluir permanentemente este colaborador da base?\n\nIsso apagará também o histórico de treinamentos dele.")) {
            HA.State.colabs = HA.State.colabs.filter(c => c.id !== id);
            HA.State.trainings = HA.State.trainings.filter(t => t.userId !== id);
            HA.Data.safeSave();
        }
    }
};

// Pontes para o Roteador Global
window.runRenderAdminUsers = function() { HA.Admin.renderUsers(); };
window.runRenderAdminColabs = function() { HA.Admin.renderColabs(); };
