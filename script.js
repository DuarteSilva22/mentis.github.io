function goToHome() {
    window.location.href = "index.html"; // Redireciona para a página inicial
}

const firebaseConfig = {
    apiKey: "AIzaSyDdlqwKGV2ykybe1KQGnBDFhS0nFiEdQbM",
    authDomain: "mentis-f566d.firebaseapp.com",
    projectId: "mentis-f566d",
    storageBucket: "mentis-f566d.firebasestorage.app",
    messagingSenderId: "680052083516",
    appId: "1:680052083516:web:30ac0adfa0b6dbad606c39"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

function navigateTo(page) {
    fetch(`pages/${page}.html`)
        .then(response => response.text())
        .then(content => {
            document.getElementById('content').innerHTML = content;
            setupPageScripts(page); // Configura scripts específicos da página
            history.pushState({ page }, '', `#${page}`); // Atualiza a URL
        })
        .catch(error => {
            console.error('Erro ao carregar a página:', error);
            document.getElementById('content').innerHTML = '<h2>Página não encontrada</h2>';
        });
}

function renderChart() {
    const chartData = {
        labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
        datasets: [{
            label: 'Nível de Stress',
            data: [3, 4, 5, 6, 3, 4, 5], // Dados de exemplo
            borderColor: 'red',
            fill: false
        }]
    };

    const ctx = document.getElementById('grafico').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function setupQuestionnaire() {
    const form = document.getElementById('daily-questionnaire');
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const feeling = document.querySelector('input[name="feeling"]:checked')?.value;
        const stressLevel = document.querySelector('input[name="stress"]:checked')?.value;
        const activities = Array.from(document.querySelectorAll('input[name="activities"]:checked')).map(el => el.value);

        if (!feeling || !stressLevel) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Criar o feedback baseado nas respostas
        let feedback = `<h3>Feedback do Dia</h3>`;

        if (feeling === "Feliz") feedback += `<p>Que ótimo saber que está feliz! Continue cuidando de sua saúde mental.</p>`;
        if (feeling === "Triste") feedback += `<p>Parece que você está triste. Considere escrever no diário emocional para processar seus sentimentos.</p>`;
        if (feeling === "Ansioso") feedback += `<p>A ansiedade pode ser difícil. Experimente praticar técnicas de respiração ou meditação.</p>`;
        if (feeling === "Calmo") feedback += `<p>Manter a calma é excelente! Continue com as práticas que ajudam nisso.</p>`;
        if (feeling === "Cansado") feedback += `<p>Você está cansado. Certifique-se de descansar bem e dormir o suficiente.</p>`;

        if (stressLevel === "Baixo (1-3)") feedback += `<p>Seu nível de stress está baixo, ótimo! Continue assim.</p>`;
        if (stressLevel === "Moderado (4-6)") feedback += `<p>Seu stress está moderado. Talvez seja uma boa ideia tirar um tempo para relaxar.</p>`;
        if (stressLevel === "Alto (7-10)") feedback += `<p>Seu stress está alto. Considere atividades como meditação ou exercícios para reduzir o stress.</p>`;

        if (activities.includes("Nenhuma")) {
            feedback += `<p>Tente incluir alguma atividade física em sua rotina para melhorar o bem-estar.</p>`;
        } else {
            feedback += `<p>Ótimo trabalho ao incluir atividades como ${activities.join(", ")}. Continue se movimentando!</p>`;
        }

        // Salvar as respostas no localStorage
        const questionnaireData = {
            feeling: feeling,
            stressLevel: stressLevel,
            activities: activities,
            feedback: feedback
        };

        // Armazenar no localStorage
        localStorage.setItem('dailyQuestionnaire', JSON.stringify(questionnaireData));

        // Exibir feedback no localStorage
        alert('Questionário submetido com sucesso!');

        // Redirecionar para a página de feedback
        navigateTo('feedback');
    });
}


function saveDiaryEntryLocal(event) {
    event.preventDefault(); // Evita o envio do formulário

    const entryText = document.getElementById('diary-entry').value; // Pega o conteúdo do diário

    if (!entryText) {
        alert('Por favor, escreva algo no diário!');
        return;
    }

    const entry = {
        entry: entryText,
        timestamp: new Date().toISOString()
    };

    // Pega as entradas existentes ou cria um array vazio
    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    
    // Adiciona a nova entrada ao array
    entries.push(entry);
    
    // Armazena as entradas no localStorage
    localStorage.setItem('diaryEntries', JSON.stringify(entries));

    // Limpa o campo do diário
    document.getElementById('diary-entry').value = '';

    // Atualiza as entradas na página
    loadDiaryEntriesLocal();
}


function loadFeedback() {
    const feedbackContainer = document.getElementById('personal-feedback');
    feedbackContainer.innerHTML = 'Carregando...';

    // Recuperar dados do questionário do localStorage
    const questionnaireData = JSON.parse(localStorage.getItem('dailyQuestionnaire'));

    if (!questionnaireData) {
        feedbackContainer.innerHTML = '<p>Nenhum feedback disponível. Você ainda não preencheu o questionário diário.</p>';
        return;
    }

    feedbackContainer.innerHTML = `
        <h3>Feedback do Questionário:</h3>
        <p><strong>Como você se sente hoje:</strong> ${questionnaireData.feeling}</p>
        <p><strong>Nível de Stress:</strong> ${questionnaireData.stressLevel}</p>
        <p><strong>Atividades Físicas:</strong> ${questionnaireData.activities.join(", ") || 'Nenhuma atividade selecionada'}</p>
        <hr>
        <div>${questionnaireData.feedback}</div>
    `;
}

auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        document.getElementById('user-info').innerHTML = `<span>Bem-vindo, ${user.email}!</span>`;
    } else {
        document.getElementById('user-info').innerHTML = `<a href="login.html">Login</a>`;
    }
});

function loadDiaryEntriesLocal() {
    const diaryEntriesContainer = document.getElementById('diary-entries');
    if (!diaryEntriesContainer) {
        console.warn("Elemento #diary-entries não encontrado.");
        return;
    }

    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    if (entries.length === 0) {
        diaryEntriesContainer.innerHTML = '<h3>Entradas anteriores:</h3><p>Você ainda não escreveu nada no diário.</p>';
        return;
    }

    diaryEntriesContainer.innerHTML = ` 
        <h3>Entradas anteriores:</h3>
        ${entries.map(entry => {
            const date = new Date(entry.timestamp);
            return `
                <div class="diary-entry">
                    <p><strong>${date.toLocaleDateString()} ${date.toLocaleTimeString()}:</strong></p>
                    <p>${entry.entry}</p>
                    <hr>
                </div>`;
        }).join('')}`;
}
function saveGoals(event) {
    event.preventDefault();

    // Captura os valores do formulário
    const mentalHealthGoal = document.getElementById('mental-health-goal').value;
    const physicalActivityGoal = document.getElementById('physical-activity-goal').value;
    const socialGoal = document.getElementById('social-goal').value;

    // Valida se todos os campos foram preenchidos
    if (!mentalHealthGoal || !physicalActivityGoal || !socialGoal) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Cria um objeto com as metas
    const goals = {
        mentalHealthGoal,
        physicalActivityGoal,
        socialGoal
    };

    // Armazena as metas no localStorage
    localStorage.setItem('userGoals', JSON.stringify(goals));

    // Exibe uma mensagem de sucesso
    alert("Metas salvas com sucesso!");

    // Chama a função para exibir as metas
    loadGoals();
}

// Função para carregar as metas armazenadas no localStorage
function loadGoals() {
    const userGoalsContainer = document.getElementById('user-goals');

    // Tenta recuperar as metas do localStorage
    const storedGoals = localStorage.getItem('userGoals');

    if (storedGoals) {
        // Se houver metas armazenadas, exibe-as
        const goals = JSON.parse(storedGoals);
        userGoalsContainer.innerHTML = `
            <h3>Suas Metas de Bem-Estar</h3>
            <p><strong>Meta para saúde mental:</strong> ${goals.mentalHealthGoal}</p>
            <p><strong>Meta para atividade física:</strong> ${goals.physicalActivityGoal}</p>
            <p><strong>Meta social:</strong> ${goals.socialGoal}</p>
        `;
    } else {
        // Caso não haja metas armazenadas
        userGoalsContainer.innerHTML = '<p>Você ainda não definiu suas metas.</p>';
    }
}

// Função que deve ser chamada após a página ser carregada para garantir que o formulário esteja pronto
function setupGoalsPage() {
    // Adiciona o ouvinte de evento para o envio do formulário
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) {
        goalsForm.addEventListener('submit', saveGoals);
    }

    // Carrega as metas ao carregar a página
    loadGoals();
}

function showHelpBasedOnQuestionnaire(feeling, stressLevel) {
    const helpContainer = document.getElementById('help-section'); // Assumindo que você tenha um div com id 'help-section'

    // Definir as sugestões de ajuda com base no feeling (sentimento) e stressLevel
    let helpText = "";
    let helpTitle = "Recursos de Ajuda Profissional";

    if (feeling === "Triste") {
        helpText += `
            <h3>Ajuda para Tristeza</h3>
            <ul>
                <li>Considerar a terapia para lidar com a tristeza e encontrar estratégias de enfrentamento.</li>
                <li>Linha de Apoio Psicológico: 0800-1234-5678 - disponível 24 horas.</li>
                <li>Atividades como meditação podem ajudar a melhorar o estado emocional.</li>
            </ul>
        `;
    } else if (feeling === "Ansioso") {
        helpText += `
            <h3>Ajuda para Ansiedade</h3>
            <ul>
                <li>Terapia Cognitivo-Comportamental pode ser uma opção eficaz para controlar a ansiedade.</li>
                <li>Plataforma Online de Terapia: Converse com terapeutas sobre suas preocupações.</li>
                <li>Práticas de mindfulness e respiração profunda são recomendadas para ajudar a controlar os sintomas.</li>
            </ul>
        `;
    } else if (feeling === "Cansado") {
        helpText += `
            <h3>Ajuda para Cansaço</h3>
            <ul>
                <li>Considerar buscar apoio psicológico para entender as causas do cansaço emocional.</li>
                <li>Atendimento especializado em descanso e qualidade de vida.</li>
                <li>Busque atividades relaxantes e hábitos saudáveis para melhorar o bem-estar físico e mental.</li>
            </ul>
        `;
    } else if (feeling === "Feliz") {
        helpText += `
            <h3>Continue a Cuidar de Si!</h3>
            <ul>
                <li>Manter hábitos saudáveis como meditação e exercícios físicos pode melhorar ainda mais sua saúde mental.</li>
                <li>Participe de grupos de apoio e bem-estar para continuar evoluindo.</li>
            </ul>
        `;
    }

    // Baseado no nível de stress
    if (stressLevel === "Alto (7-10)") {
        helpText += `
            <h3>Ajuda para Nível de Stress Alto</h3>
            <ul>
                <li>Considerar a terapia para aprender a lidar com o stress crônico.</li>
                <li>Se necessário, busque uma avaliação médica para orientações mais detalhadas.</li>
                <li>Linha de Apoio Psicológico: 0800-1234-5678.</li>
            </ul>
        `;
    } else if (stressLevel === "Moderado (4-6)") {
        helpText += `
            <h3>Ajuda para Nível de Stress Moderado</h3>
            <ul>
                <li>Práticas de relaxamento como yoga e meditação podem ajudar a reduzir o stress.</li>
                <li>Atendimento psicológico online ou em clínicas pode ser útil para aprender a gerenciar o stress.</li>
            </ul>
        `;
    } else if (stressLevel === "Baixo (1-3)") {
        helpText += `
            <h3>Mantenha o Equilíbrio</h3>
            <ul>
                <li>Manter hábitos saudáveis e praticar exercícios físicos regularmente é importante para prevenir o stress.</li>
                <li>Considerar continuar com atividades relaxantes como meditação.</li>
            </ul>
        `;
    }

    // Atualizar a seção de ajuda com o conteúdo
    helpContainer.innerHTML = `
        <h2>${helpTitle}</h2>
        ${helpText}
        <a href="contato.html" class="btn-help">Obter Mais Ajuda</a>
    `;
}

// Função que recupera as respostas do questionário e exibe a ajuda
function handleQuestionnaireSubmit(event) {
    event.preventDefault();

    const feeling = document.querySelector('input[name="feeling"]:checked')?.value;
    const stressLevel = document.querySelector('input[name="stress"]:checked')?.value;

    if (feeling && stressLevel) {
        // Exibe ajuda com base nas respostas
        showHelpBasedOnQuestionnaire(feeling, stressLevel);
    } else {
        alert('Por favor, preencha todas as respostas do questionário.');
    }
}

function getStoredQuestionnaireAnswers() {
    // Tenta obter as respostas do questionário armazenadas no localStorage
    const answers = localStorage.getItem('dailyQuestionnaire');
    return answers ? JSON.parse(answers) : null; // Retorna as respostas ou null se não houver
}

auth.onAuthStateChanged((user) => {
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const logoutButton = document.getElementById('logout-button');
    const userInfo = document.getElementById('user-info');

    if (user) {
        // Exibe o botão de logout e esconde login/registo
        logoutButton.style.display = 'inline-block';
        userInfo.innerHTML = `<span>Bem-vindo, ${user.email}!</span>`;
        loginButton.style.display = 'none';
        registerButton.style.display = 'none';
    } else {
        // Exibe os botões de login/registo e esconde o logout
        logoutButton.style.display = 'none';
        userInfo.innerHTML = '';
        loginButton.style.display = 'inline-block';
        registerButton.style.display = 'inline-block';
    }
});

function logoutUser() {
    localStorage.clear();

    auth.signOut().then(() => {
        console.log('Usuário deslogado');
        // Redireciona para a página inicial após o logout
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Erro ao deslogar: ", error);
    });
}



function setupPageScripts(page) {
    if (page === 'questionario') setupQuestionnaire();
    if (page === 'feedback') loadFeedback();
    if (page === 'graficos') renderChart();
    if (page === 'diario') {
        const diaryForm = document.getElementById('diary-form');
        if (diaryForm) diaryForm.addEventListener('submit', saveDiaryEntryLocal);
        loadDiaryEntriesLocal();
    }
    if (page == 'metas') setupGoalsPage();
    if (page === 'ajuda') {
        // Aqui, você pode passar os dados do questionário para a função de ajuda, 
        // mas como a página de ajuda pode não estar recebendo essas respostas diretamente,
        // você pode usar valores armazenados, como no localStorage ou na variável global.
        const storedAnswers = getStoredQuestionnaireAnswers(); // Supondo que você tenha uma função que recupere as respostas
        if (storedAnswers) {
            showHelpBasedOnQuestionnaire(storedAnswers.feeling, storedAnswers.stressLevel);
        } else {
            console.warn('Respostas do questionário não encontradas!');
        }
    }
}

window.addEventListener('popstate', (event) => {
    const page = event.state?.page || 'home';
    navigateTo(page);
});

window.addEventListener('load', () => {
    const page = window.location.hash.replace('#', '') || 'home'; // 'home' é a página padrão
    navigateTo(page);
});
   
