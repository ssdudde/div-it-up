const storageKey = 'savedAccount';
let state = Object.freeze({
    account: null
});
const URI ='//localhost:5000/api/accounts/'
function updateRoute() {
    const path = document.location.pathname;
    const route = routes[path];

    if (!route) {
        return navigate('/login');
    }

    const template = document.getElementById(route.templateId);
    const view = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(view);
    document.title = route.templateId;

    if (path === "/dashboard") {
        console.log('Dashboard is shown');
        setupDashboardListeners(); // Ensure event listeners are attached
    }

    if (typeof route.init === 'function') {
        route.init();
    }
}

const routes = {
    '/login': { templateId: 'login' },
    '/dashboard': { templateId: 'dashboard', init: refresh },
    '/credit': { templateId: 'credit' }
};

function navigate(path) {
    window.history.pushState({}, path, path);
    updateRoute();
}

function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
}

window.onpopstate = () => updateRoute();


async function register() {
    const registerForm = document.getElementById('registerForm');
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    const jsonData = JSON.stringify(data);
    const result = await createAccount(jsonData);

    if (result.error) {
        return updateElement('registerError', result.error);
    }

    console.log('Account created!', result);
    updateState('account', result);
    state.account = result;
    navigate('/dashboard');
}

async function createAccount(account) {
    try {
        const response = await fetch('//localhost:5000/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: account
        });
        return await response.json();
    } catch (error) {
        return { error: error.message || 'Unknown error' };
    }
}

async function login() {
    const loginForm = document.getElementById('loginForm');
    const user = loginForm.user.value;
    const data = await getAccount(user);

    if (data.error) {
        return updateElement('loginError', data.error);
    }

    updateState('account', data);
    state.account = data;
    navigate('/dashboard');
}

async function getAccount(user) {
    try {
        console.log("Fetching account for:", user);
        const response = await fetch(URI + encodeURIComponent(user));
        return await response.json();
    } catch (error) {
        return { error: error.message || 'Unknown error' };
    }
}

function updateElement(id, textOrNode) {
    const element = document.getElementById(id);
        if (!element) {
        console.warn(`updateElement: Element with ID "${id}" not found.`);
        return;
        }
    element.textContent = '';
    element.append(textOrNode);

}

function updateDashboard() {
    const account = state.account;
    if (!account) {
        return navigate('/login');
    }

    updateElement('description', account.description || 'No description');
    const balance = account.balance != undefined ? parseFloat(account.balance) : 0;

    updateElement('balance', account.balance.toFixed(2));
    updateElement('currency', account.currency);

    const transactionsRows = document.createDocumentFragment();
    for (const transaction of account.transactions) {
        const transactionRow = createTransactionRow(transaction);
        transactionsRows.appendChild(transactionRow);
    }
    updateElement('transactions', transactionsRows);
}

function createTransactionRow(transaction) {
    const template = document.getElementById('transaction');
    const transactionRow = template.content.cloneNode(true);
    const tr = transactionRow.querySelector('tr');
    tr.children[0].textContent = transaction.date;
    tr.children[1].textContent = transaction.object;
    tr.children[2].textContent = transaction.amount.toFixed(2);
    return transactionRow;
}

function updateState(property, newData) {
    state = Object.freeze({
        ...state,
        [property]: newData
    });
    localStorage.setItem(storageKey, JSON.stringify(state.account));
}

function logout() {
    updateState('account', null);
    navigate('/login');
}

function init() {
    const savedAccount = localStorage.getItem(storageKey);
    if (savedAccount) {
        
        updateState('account', JSON.parse(savedAccount));
    }

    window.onpopstate = () => updateRoute();
    updateRoute();
}

init();

async function updateAccountData() {
    const account = state.account;
    if (!account) {
        return logout();
    }

    const data = await getAccount(account.user);
    if (data.error) {
        console.error("Error fetching account data:", data.error);
        return false;
    }

    updateState('account', data);
}

async function refresh() {
    await updateAccountData();
    updateDashboard();
}

async function createRow(account) {
    console.log("User for transaction:", state.account.user);

    try {
        const response = await fetch(URI + encodeURIComponent(state.account.user) + '/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: account
        });
        return await response.json();
    } catch (error) {
        return { error: error.message || 'Unknown error' };
    }
}

// Function to attach event listeners for the dashboard
function setupDashboardListeners() {
    setTimeout(() => {
        const Btrans = document.getElementById('Btrans');
        const DTrans = document.getElementById('DTrans');
        const ok = document.getElementById('ok');
        const cancel = document.getElementById('cancel');

        if (Btrans) {
            Btrans.addEventListener('click', () => {
                console.log("Add Transaction Button Clicked!");
                DTrans.showModal();
            });
        }

        if (cancel) {
            cancel.addEventListener('click', (event) => {
                event.preventDefault();
                DTrans.close();
            });
        }

        if (ok) {
            ok.addEventListener('click', async (event) => {
                event.preventDefault();

                const transForm = document.getElementById('AddTrans');
                const formData = new FormData(transForm);
                const data = Object.fromEntries(formData);
                console.log(data)
                const jsonData = JSON.stringify(data);

                const result = await createRow(jsonData);
                if (result.error) {
                    console.log('Error in adding trans')
                    return 
                }

                console.log('Transaction Added!', result);
    // Merge the new data with the existing account to preserve the "user" property
                const updatedAccount = {
                    ...state.account,
                    transactions: result.transactions, // assuming result includes updated transactions list
                    balance: result.balance            // update any other relevant fields
                };
                updateState('account', updatedAccount);
                state.account = updatedAccount;
                refresh();
                    
                setTimeout(() => { DTrans.close(); }, 100);
                
            });
        }
    }, 100); // Small delay to ensure elements are available
}
