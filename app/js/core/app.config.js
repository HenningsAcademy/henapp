// =========================================================
// APPLICATION CONFIGURATION & STATE MANAGEMENT
// =========================================================

window.HA = window.HA || {};
    // 🔗 URLs OFICIAIS DO POWER AUTOMATE (EXCEL DATABASE)

HA.Config = {
    // FLUJO 1 (GET - Leitor Maestro)
    URL_LER: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/21/workflows/3068ae606a9d47c4967b39b43e2f157f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vnTdxDEE1wSXgDnHWTgIVh-WIuVifc8RLNbj7Y4xTtw",
    // FLUJO 2 (POST - Salvar Usuários)
    URL_SALVAR_USUARIO: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/08/workflows/a6b77f5bb818479f986d0972cf739473/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=txK260vhFVS6RJ1hahS5VlH6eE0IReW47yqamNHZDhE",
    // FLUJO 2 (POST - Salvar Usuários)
    URL_SALVAR_COLABORADOR: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/02/workflows/1b1b45bc522943dea6a7030485f680f6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FYOgLPg178X4sEFRmrgNYi9zsVwGFLpr05BkGbE6XtI",
    // FLUJO 4 (POST - Salvar Treinamentos)
    URL_SALVAR_TREINAMENTO: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/20/workflows/7beb1cb49aeb43ae97b3eebe11b4bbcd/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=K8zXArbmlM1roTfmd63pOKa54Enr8J7rzMVwQndiuao",
    
    URL_UPLOAD_PDF: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/16/workflows/27dca153a40148bca7df16a7b1a1ec29/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=BVSBVhhjo48kk7dbAtqBxDiHyYdG1TrXr3oqhsGa5I8",
    URL_ENVIAR_EMAIL: "https://default863b40a279194b128e0e7678554bee.21.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/25/workflows/b760991191ee4f929f9603aa31dfbe9b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dFd3cioggFgaY9yCxeMKroKFbMVNvIWZ6wijIh0w-tw"
};

HA.Constants = {
    Sectors: { 
        "Recebimento": ["Pré-recebimento", "Desembaraço", "Inspeção"], 
        "Armazenagem": ["Armazenagem de Peças", "Armazenagem de Mangueiras", "Reabastecimento de Peças"], 
        "Separação": ["Separação de Peças", "Separação de Mangueiras"], 
        "Expedição": ["Checkout", "Consolidação", "Expedição"] 
    },
    // Usuários padrão inquebráveis
    DefaultUsers: [
        { id: '4dm1n', pass: 'Henn1gs4cad3m1', name: 'Master Admin', role: 'Admin', supervisor: '-' },
        { id: 'f4c1l1t4d0r', pass: 'F4c!l1t@d0r_H#26', name: 'Facilitador Teste', role: 'Facilitador' },
        { id: 'l1d3r', pass: 'L1d3r@Henn!ngs$26', name: 'Líder Teste', role: 'Lider' }
    ]
};

HA.State = { currentUser: null, users: [], trainings: [], colabs: [], currentView: '', searchTerm: '' };
