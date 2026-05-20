/**
 * CONFIGURAZIONE SUPABASE
 */
const SUPABASE_URL = "https://lccemvnwmkbmzdyscjqy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjY2Vtdm53bWtibXpkeXNjanF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTY5MTUsImV4cCI6MjA5MzczMjkxNX0.415aOBkflrgd59NmUpld7tXgHARaW0KN0DUlOj-y5eY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
    questionnaire: null,
    questions: [],
	answers: {},
    currentStep: 0,
    currentIndex: 0,
    sourceRef: null,
    privacyAccepted: false,
    user: {}, 
    responses: {}, 
};

const ui = {
    progressSection: document.getElementById('progress-section'),
    progressStep: document.getElementById('progress-step'),
    progressPercent: document.getElementById('progress-percent'),
    progressFill: document.getElementById('progress-fill'),
    appContent: document.getElementById('app-content'),
    loaderView: document.getElementById('loader-view'),
    errorView: document.getElementById('error-view'),
    errorMessage: document.getElementById('error-message'),
    navFooter: document.getElementById('nav-footer'),
    btnPrev: document.getElementById('btn-prev'),
    btnNext: document.getElementById('btn-next'),
};

/**
 * 1. INIZIALIZZAZIONE (Fix ID e Domande)
 */
async function init() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        // Accetta sia 'id' che 'questionnaire_id' dall'URL
        const questionnaireId = urlParams.get('id') || urlParams.get('questionnaire_id') || '2c7b1166-358e-41b0-947f-0995408da58a';
        state.sourceRef = urlParams.get('source') || urlParams.get('ref') || 'diretto';

        const { data: questionnaire, error: qError } = await supabaseClient
            .from('questionnaires')
            .select('*')
            .eq('id', questionnaireId)
            .single();

        if (qError || !questionnaire) throw new Error("ID Questionario non valido o non trovato su Supabase.");

        state.questionnaire = questionnaire;

        const { data: questions, error: qsError } = await supabaseClient
            .from('questions')
            .select('*')
            .eq('questionnaire_id', questionnaireId)
            .order('question_order', { ascending: true });

        if (qsError || !questions || questions.length === 0) throw new Error("Nessuna domanda trovata per questo questionario.");

        state.questions = questions;
        ui.loaderView.classList.add('hidden');
        renderLanding();

    } catch (err) {
        handleError(err.message);
    }
}

function renderLanding() {
    state.currentStep = 0;
    document.body.style.backgroundColor = "#05070a";
    
    ui.progressSection.classList.add('hidden');
    ui.navFooter.classList.add('hidden');

    ui.appContent.innerHTML = `
        <div class="fade-in flex flex-col items-center justify-center min-h-[75vh] space-y-6 py-4 text-center">
            
            <div class="w-full max-w-2xl px-4">
                <img src="landing.jpg" alt="Capitani di Futuro" 
                     class="mx-auto max-h-[66vh] md:max-h-[77vh] object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            </div>

            <button onclick="handleNext()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base font-bold uppercase tracking-[0.2em] px-12 py-4 rounded-2xl transition-all duration-300 shadow-lg active:scale-95">
                INIZIA
            </button>
            
        </div>
    `;
}

/**
 * 2. PRIVACY (Fix Doppia Cliccata)
 */
function renderPrivacy() {
    state.currentStep = 1;
    document.body.style.backgroundColor = "#ffffff";

    // Nascondiamo la percentuale (apparirà solo dalla domanda 1)
    ui.progressSection.classList.add('hidden');
    
    ui.navFooter.classList.remove('hidden'); 
    ui.btnPrev.style.visibility = 'visible';
    ui.btnNext.classList.remove('hidden'); 
    ui.btnNext.innerText = "Accetto e Proseguo";
    
    // Dimensioni ridotte: px-6 py-3 e text-sm per essere meno ingombrante su mobile
    ui.btnNext.className = "text-sm font-bold uppercase tracking-[0.2em] px-6 py-3.5 rounded-2xl transition-all duration-300 shadow-lg";
    
    const updateButtonState = () => {
        if (state.privacyAccepted) {
            ui.btnNext.disabled = false;
            ui.btnNext.classList.add('bg-[#05070a]', 'text-white', 'opacity-100');
            ui.btnNext.classList.remove('bg-slate-200', 'text-slate-400', 'opacity-50');
        } else {
            ui.btnNext.disabled = true;
            ui.btnNext.classList.remove('bg-[#05070a]', 'text-white', 'opacity-100');
            ui.btnNext.classList.add('bg-slate-200', 'text-slate-400', 'opacity-50');
        }
    };

    ui.appContent.innerHTML = `
        <div class="fade-in space-y-8 py-4 text-center">
            <div class="space-y-4">
                <h2 class="text-3xl font-black text-slate-900 leading-tight">Privacy & Trattamento Dati</h2>
                <p class="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                    Per procedere con l'assessment è necessario accettare l'informativa sul trattamento dei dati personali (GDPR).
                </p>
            </div>

            <label class="flex items-center gap-5 bg-white border-2 border-slate-100 rounded-[2rem] p-8 cursor-pointer hover:border-blue-500 transition-all shadow-sm group mx-auto max-w-lg text-left">
                <input type="checkbox" id="privacy-check" class="w-7 h-7 rounded-lg border-2 border-slate-300 text-blue-600 cursor-pointer shrink-0" ${state.privacyAccepted ? 'checked' : ''}>
                <span class="text-slate-700 font-bold text-lg group-hover:text-blue-900 leading-snug">
                    Dichiaro di aver letto e accetto l'informativa 
                    <a href="https://www.profexa.it/privacy-policy/" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition-colors" onclick="event.stopPropagation();">privacy</a>
                </span>
            </label>
        </div>
    `;

    updateButtonState();

    document.getElementById('privacy-check').onchange = (e) => {
        state.privacyAccepted = e.target.checked;
        updateButtonState();
    };
}

/**
 * 3. DOMANDE
 */
function renderQuestion(index) {
    if (!state.questions || !state.questions[index]) return;
    const q = state.questions[index];
    state.currentStep = index + 2; 
    
    ui.progressSection.classList.remove('hidden', 'opacity-0');
    ui.navFooter.classList.remove('hidden');
    ui.btnNext.classList.add('hidden'); 
    ui.btnPrev.style.visibility = 'visible';
    
    const savedValue = state.answers[q.id] || null;
    const cleanQuestion = q.question_text.replace(/^\d+[\.\s\-]+/, '');

    ui.appContent.innerHTML = `
        <div class="fade-in space-y-12 py-8 text-center">
            <div class="space-y-4">
                <span class="text-blue-600 font-black text-base md:text-lg uppercase tracking-[0.2em]">Domanda ${index + 1} di ${state.questions.length}</span>
                <h2 class="text-2xl md:text-4xl font-bold text-slate-900 leading-tight px-4">
                    ${cleanQuestion}
                </h2>
            </div>

            <div id="answers-grid" class="grid grid-cols-5 gap-4 md:gap-6 max-w-2xl mx-auto px-2">
                ${[1, 2, 3, 4, 5].map(num => {
                    const labels = ["Per niente", "Poco", "Sufficientemente", "Discretamente", "Molto"];
                    const isSelected = savedValue == num;
                    return `
                        <div class="flex flex-col items-center gap-4">
                            <button data-num="${num}" onclick="handleAnswer('${q.id}', ${num})" 
                                    class="answer-btn w-full aspect-square md:h-20 rounded-2xl text-xl font-bold transition-all duration-200 border-2 
                                    ${isSelected 
                                        ? 'bg-[#05070a] border-[#05070a] text-white shadow-lg scale-105' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}">
                                ${num}
                            </button>
                            <span class="text-[7px] md:text-[11px] font-normal tracking-tighter text-slate-600 text-center uppercase whitespace-nowrap block">
                                ${labels[num-1]}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // Aggiornamento progress bar
    const percent = Math.round(((index + 1) / state.questions.length) * 100);
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-step').innerText = `Completato: ${percent}%`;
}

/**
 * 4. MODULO DATI (Spostato in fondo)
 */
function renderContactData() {
    state.currentStep = 3;
    ui.progressSection.classList.add('opacity-0');
    ui.btnNext.innerText = "Invia Assessment";
    ui.btnNext.disabled = true;
    
    ui.appContent.innerHTML = `
        <div class="fade-in space-y-6">
            <h2 class="text-2xl font-bold text-slate-900">Quasi finito!</h2>
            <p class="text-slate-500 text-sm">Inserisci i tuoi dati per registrare il test.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" id="in-first-name" placeholder="Nome *" class="p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500">
                <input type="text" id="in-last-name" placeholder="Cognome *" class="p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500">
                <input type="email" id="in-email" placeholder="Email *" class="p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500">
                <input type="text" id="in-company" placeholder="Azienda *" class="p-4 border rounded-2xl outline-none focus:ring-2 ring-blue-500">
            </div>
        </div>
    `;

    const inputs = ['in-first-name', 'in-last-name', 'in-email', 'in-company'];
    inputs.forEach(id => {
        document.getElementById(id).oninput = () => {
            const allFilled = inputs.every(i => document.getElementById(i).value.trim() !== "");
            ui.btnNext.disabled = !allFilled;
        };
    });
}

/**
 * 5. NAVIGAZIONE E INVIO (Fix Crash Property Value)
 */
function handleNext() {
    if (state.currentStep === 0) {
        renderPrivacy();
    } else if (state.currentStep === 1) {
        renderQuestion(0);
    } else if (state.currentStep >= 2) {
        const currentIndex = state.currentStep - 2;
        if (currentIndex < state.questions.length - 1) {
            renderQuestion(currentIndex + 1);
        } else {
            renderFinalForm();
        }
    }
}

function handlePrev() {
    if (state.currentStep === 1) {
        renderLanding();
    } else if (state.currentStep === 2) {
        renderPrivacy();
    } else if (state.currentStep > 2) {
        renderQuestion(state.currentStep - 3);
    }
}

async function submitAll(respondentData) {
    ui.navFooter.classList.add('hidden');
    ui.appContent.innerHTML = `
        <div class="fade-in flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p class="text-slate-500 uppercase tracking-[0.2em] font-black">Salvataggio nello spazio...</p>
        </div>
    `;

    try {
        const { error: rError } = await supabaseClient
            .from('respondents')
            .insert([{
                full_name: respondentData.name,
                email: respondentData.email,
                phone: respondentData.phone,
                role: respondentData.role,
                company: respondentData.company,
                province: respondentData.province,
                company_size: respondentData.employees, // Riceve 'N/D' automaticamente se Freelance
                questionnaire_id: state.questionnaire.id,
                answers: state.answers,
                source_ref: state.sourceRef || 'web'
            }]);

        if (rError) throw rError;

        renderThankYou();

    } catch (err) {
        console.error("Errore Supabase:", err);
        
        ui.appContent.innerHTML = `
            <div class="fade-in text-center py-10 px-4">
                <div class="text-red-500 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-slate-900 font-bold text-xl mb-2">Errore di Trasmissione</h2>
                <p class="text-slate-500 mb-6 text-sm">${err.message}</p>
                <button onclick="renderFinalForm()" class="bg-[#05070a] text-white px-8 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg">
                    Riprova ora
                </button>
            </div>
        `;
    }
}

ui.btnNext.onclick = handleNext;
ui.btnPrev.onclick = handlePrev;
document.addEventListener('DOMContentLoaded', init);

// --- FUNZIONE PER GESTIRE LA RISPOSTA E L'AVANZAMENTO AUTOMATICO ---
function handleAnswer(questionId, value) {
    state.answers[questionId] = value;
    
    // Troviamo tutti i bottoni nella pagina
    const buttons = document.querySelectorAll('.answer-btn');
    
    buttons.forEach(btn => {
        if (btn.getAttribute('data-num') == value) {
            // Coloriamo di Blu Notte il tasto cliccato (senza ricaricare la pagina)
            btn.className = "answer-btn w-full aspect-square md:h-20 rounded-2xl text-xl font-bold transition-all duration-200 border-2 bg-[#05070a] border-[#05070a] text-white shadow-lg scale-105";
        } else {
            // Rendiamo neutri gli altri
            btn.className = "answer-btn w-full aspect-square md:h-20 rounded-2xl text-xl font-bold transition-all duration-200 border-2 bg-white border-slate-100 text-slate-400";
        }
    });
    
    // Aspettiamo 450ms (giusto il tempo di vedere la scelta) e poi scatta il "saltino" (fade-in) verso la prossima
    setTimeout(() => {
        handleNext();
    }, 450); 
}

function renderFinalForm() {
    state.currentStep = state.questions.length + 2;
    
    ui.progressSection.classList.add('hidden');
    ui.navFooter.classList.add('hidden'); 

    // Lista completa delle province italiane per il menu a discesa
    const provinceItaliane = ["AG","AL","AN","AO","AP","AQ","AR","AT","AV","BA","BG","BI","BL","BN","BO","BR","BS","BT","BZ","CA","CB","CE","CH","CI","CL","CN","CO","CR","CS","CT","CZ","EN","FC","FE","FG","FI","FM","FR","GE","GR","IM","IS","KR","LC","LE","LI","LO","LT","LU","MB","MC","ME","MI","MN","MO","MS","MT","NA","NO","NU","OR","PA","PC","PD","PE","PG","PI","PN","PO","PR","PT","PU","PV","PZ","RA","RC","RE","RG","RI","RM","RN","RO","SA","SI","SO","SP","SR","SS","SU","TA","TE","TN","TO","TP","TR","TS","TV","UD","VA","VB","VC","VE","VI","VR","VS","VT","VV"];

    // Creazione delle opzioni per il select della provincia
    const provinceOptions = provinceItaliane.map(p => `<option value="${p}">${p}</option>`).join('');

    ui.appContent.innerHTML = `
        <div class="fade-in space-y-8 py-4 text-center">
            <div class="space-y-2">
                <h2 class="text-3xl font-black text-slate-900 leading-tight">Ottimo lavoro!</h2>
                <p class="text-slate-500 text-lg">Inserisci i tuoi dati per completare l'assessment.</p>
            </div>

            <form id="respondent-form" class="space-y-4 max-w-md mx-auto text-left px-4">
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Nome e Cognome</label>
                    <input type="text" id="resp-name" required 
                           class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm"
                           placeholder="Il tuo nome">
                </div>
                
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Mail</label>
                    <input type="email" id="resp-email" required 
                           class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm"
                           placeholder="mario.rossi@azienda.it">
                </div>
                
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Cellulare</label>
                    <input type="tel" id="resp-phone" required 
                           class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm"
                           placeholder="333 1234567">
                </div>
                
                <div>
                <div class="mb-4">
                    <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Ruolo / Professione</label>
                    <input type="text" id="resp-job-title" required
                        class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500"
                        placeholder="Es. Marketing Manager, CEO, Consulente...">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <button type="button" id="btn-role-emp" onclick="setFreelanceMode(false)"
                        class="py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-blue-600 text-white border-blue-600">
                        Dipendente / Titolare
                    </button>
                    <button type="button" id="btn-role-free" onclick="setFreelanceMode(true)"
                        class="py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-white text-slate-500 border-slate-200">
                        Libero Professionista
                    </button>
                </div>
            </div>

                <div id="company-fields-group" class="space-y-4 transition-all duration-300">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Azienda</label>
                        <input type="text" id="resp-company" required 
                               class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm bg-white"
                               placeholder="Nome Azienda">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Provincia Azienda</label>
                        <select id="resp-province" required 
                                class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm bg-white cursor-pointer">
                            <option value="" disabled selected hidden>Seleziona provincia...</option>
                            ${provinceOptions}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Numero Dipendenti Azienda</label>
                        <select id="resp-employees" required 
                                class="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-700 shadow-sm bg-white cursor-pointer">
                            <option value="" disabled selected hidden>Seleziona una fascia...</option>
                            <option value="0-20">0-20</option>
                            <option value="21-50">21-50</option>
                            <option value="51-200">51-200</option>
                            <option value=">200">>200</option>
                        </select>
                    </div>
                </div>

                <button type="submit" 
                        class="w-full bg-[#05070a] text-white px-8 py-5 rounded-2xl text-sm font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 active:scale-95 transition-all mt-6">
                    Invia e Concludi
                </button>
            </form>
        </div>
    `;

    // Stato iniziale della scelta ruolo locale
    window.isFreelance = false;

    // Funzione interna globale per gestire il cambio ruolo al volo
    window.setFreelanceMode = function(freelance) {
        window.isFreelance = freelance;
        
        const btnEmp = document.getElementById('btn-role-emp');
        const btnFree = document.getElementById('btn-role-free');
        const companyFields = ['resp-company', 'resp-province', 'resp-employees'];
        const groupContainer = document.getElementById('company-fields-group');

        if (freelance) {
            // Attiva graficamente bottone Libero Professionista
            btnFree.className = "py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-blue-600 border-blue-600 text-white";
            btnEmp.className = "py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-white border-slate-100 text-slate-500 hover:border-slate-200";
            
            // Effetto opacità sul gruppo aziendale
            groupContainer.classList.add('opacity-40');

            // Disattiva e rimuove obbligatorietà ai campi aziendali
            companyFields.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = true;
                el.required = false;
                el.value = ""; // Svuota l'input temporaneamente sullo schermo
                el.classList.add('bg-slate-50');
            });
        } else {
            // Attiva graficamente bottone Azienda/Dipendente
            btnEmp.className = "py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-blue-600 border-blue-600 text-white";
            btnFree.className = "py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm bg-white border-slate-100 text-slate-500 hover:border-slate-200";
            
            // Ripristina opacità originale
            groupContainer.classList.remove('opacity-40');

            // Riattiva e rimette obbligatorietà
            companyFields.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = false;
                el.required = true;
                el.classList.remove('bg-slate-50');
            });
        }
    };

    document.getElementById('respondent-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = `
            <span class="flex items-center justify-center gap-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Invio in corso...
            </span>
        `;

        // Se è freelance assegna il testo fisso, altrimenti prende il valore inserito
		const respondentData = {
			name: document.getElementById('resp-name').value,
			email: document.getElementById('resp-email').value,
			phone: document.getElementById('resp-phone').value,
			role: window.isFreelance ? 'Libero Professionista' : 'Dipendente / Titolare',
			job_title: document.getElementById('resp-job-title').value,
			company: window.isFreelance ? 'N/D' : document.getElementById('resp-company').value,
			province: window.isFreelance ? 'N/D' : document.getElementById('resp-province').value,
			employees: window.isFreelance ? 'N/D' : document.getElementById('resp-employees').value
		};

        await submitAll(respondentData);
    };
}

function renderThankYou() {
    // Sfondo scuro per chiudere con lo stile Capitani di Futuro
    document.body.style.backgroundColor = "#05070a";
    document.body.style.transition = "background-color 1s ease";

    ui.appContent.innerHTML = `
        <div class="fade-in flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h2 class="text-4xl font-black text-white mb-4">Grazie, Capitano!</h2>
            <p class="text-slate-400 text-lg max-w-md mx-auto">
                Il tuo assessment è stato completato con successo. I dati sono ora in fase di elaborazione.
            </p>
            <button onclick="location.reload()" class="mt-12 text-slate-500 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-[0.3em]">
                Torna all'inizio
            </button>
        </div>
    `;
}