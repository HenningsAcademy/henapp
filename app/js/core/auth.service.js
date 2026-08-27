// =========================================================
// 3. AUTH SERVICE (Gestão de Login, Sessão e Segurança)
// =========================================================

window.HA = window.HA || {};

HA.Auth = {
    init() {
        // Vincula o formulário de login (se estiver na index.html)
        const loginForm = document.getElementById('loginForm');
        if(loginForm) {
            // Removemos o onsubmit do HTML e controlamos 100% por aqui
            loginForm.onsubmit = null; 
            loginForm.addEventListener('submit', this.login.bind(this));
        }
        
        // Vincula botões de logout globais
        const btnLogout = document.getElementById('btnLogout');
        if(btnLogout) btnLogout.addEventListener('click', this.logout.bind(this));

        // Executa a barreira de proteção
        this.checkSessionAndProtect();
    },

    checkSessionAndProtect() {
        const sessionUserId = sessionStorage.getItem('ha_user_id');
        const sessionUserRole = sessionStorage.getItem('ha_user_role');
        const sessionUserName = sessionStorage.getItem('ha_user_name');
        
        const path = window.location.pathname;
        const isLoginPage = path.endsWith('index.html') || path.endsWith('/');

        // Se NÃO estiver logado e NÃO estiver na tela de login, expulsa para o login
        if (!sessionUserId) {
            if (!isLoginPage) window.location.href = 'index.html';
            return;
        }

        // Se está logado, recupera o estado
        HA.State.currentUser = { id: sessionUserId, name: sessionUserName, role: sessionUserRole };

        // Se o cara já tá logado e tentou abrir a tela de login, manda de volta pro portal dele
        if (isLoginPage) {
            this.redirectByRole(sessionUserRole);
        } else {
            // BLOQUEIO DE SEGURANÇA POR CARGO (Role-Based Access Control)
            if (path.includes('facilitador.html') && sessionUserRole !== 'Facilitador' && sessionUserRole !== 'Admin') {
                alert("Acesso Negado. Você não tem permissão de Facilitador.");
                window.location.href = 'index.html';
            }
            if (path.includes('admin.html') && sessionUserRole !== 'Admin') {
                alert("Acesso Negado. Área exclusiva de TI.");
                window.location.href = 'index.html';
            }
            // Inicia o sistema
            this.bootSystem();
        }
    },

    async login(e) {
        e.preventDefault();
        const uInput = document.getElementById('username').value.trim().toLowerCase();
        const pInput = document.getElementById('password').value.trim();
        const errorBox = document.getElementById('loginError');

        // 1. MASTER KEY (Acesso Inquebrável)
        const masterUsers = [
            { id: '4dm1n', pass: 'Henn1gs4cad3m1', name: 'Master Admin', role: 'Admin' },
            { id: 'f4c1l1t4d0r', pass: 'F4c!l1t@d0r_H#26', name: 'Facilitador Teste', role: 'Facilitador' },
            { id: 'l1d3r', pass: 'L1d3r@Henn!ngs$26', name: 'Líder Teste', role: 'Lider' }
        ];

        const masterMatch = masterUsers.find(u => u.id.toLowerCase() === uInput && u.pass === pInput);
        if(masterMatch) {
            this.processAccess(masterMatch);
            return;
        }

        // 2. ACESSO PELA NUVEM (SharePoint)
        HA.Data.showLoad("Autenticando no Microsoft 365...");
        try {
            const res = await fetch(HA.Config.URL_LER);
            if(!res.ok) throw new Error("Erro de conexão");
            const data = await res.json();
            
            const usuarios = (data.usuarios || []).map(u => ({
                id: u.ID_User || u.User || u.usuario || '',
                pass: u.Senha || u.senha || '',
                name: u.Nome || u.nome || '',
                role: u.Role || u.Rol || u.Controle || 'Lider'
            }));

            const match = usuarios.find(x => x.id.toLowerCase() === uInput && x.pass === pInput);

            if(match) {
                this.processAccess(match);
            } else {
                HA.Data.hideLoad();
                errorBox.classList.remove('hidden');
                errorBox.classList.add('animate-pulse');
                setTimeout(() => errorBox.classList.remove('animate-pulse'), 1000);
            }
        } catch (err) {
            HA.Data.hideLoad();
            alert("Erro de servidor. Tente usar a Chave Mestra.");
        }
    },

    processAccess(userObj) {
        HA.Data.hideLoad();
        
        sessionStorage.setItem('ha_user_id', userObj.id);
        sessionStorage.setItem('ha_user_name', userObj.name);
        sessionStorage.setItem('ha_user_role', userObj.role);

        const primeiroAcesso = localStorage.getItem(`regras_aceitas_${userObj.id}`);

        // Mostra regras se for o primeiro acesso (A lógica do Modal de Regras fica no index.html)
        if(!primeiroAcesso && userObj.role !== 'Admin' && typeof mostrarRegras === 'function') {
            mostrarRegras(userObj.role);
            // Injetamos a variável para o index.html saber quem é
            window.usuarioValidado = userObj; 
        } else {
            this.redirectByRole(userObj.role);
        }
    },

    redirectByRole(role) {
        HA.Data.showLoad("Iniciando Módulos...");
        setTimeout(() => {
            if(role === 'Admin') window.location.href = 'admin.html';
            else if(role === 'Facilitador') window.location.href = 'facilitador.html';
            else window.location.href = 'lider.html';
        }, 800);
    },

    logout() { 
        sessionStorage.clear(); 
        window.location.href = 'index.html'; 
    },

    bootSystem() {
        // Escreve os dados do usuário no cabeçalho
        const nameDisp = document.getElementById('userNameDisplay');
        const roleBadge = document.getElementById('userRoleBadge');
        
        if(nameDisp) nameDisp.innerText = HA.State.currentUser.name;
        if(roleBadge) {
            roleBadge.innerText = HA.State.currentUser.role;
            if(HA.State.currentUser.role === 'Admin') roleBadge.className = "text-[9px] font-black uppercase tracking-widest text-rose-400 mt-1 block";
            else if(HA.State.currentUser.role === 'Facilitador') roleBadge.className = "text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-1 block";
            else roleBadge.className = "text-[9px] font-black uppercase tracking-widest text-mustard-500 mt-1 block";
        }
        
        document.dispatchEvent(new Event('appBooted'));
        HA.Data.loadFromCloud(false); // Baixa os dados
    }
};

document.addEventListener('DOMContentLoaded', () => { 
    HA.Auth.init(); 
});
