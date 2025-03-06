let state = Object.freeze({
  account: null
  });
  function updateRoute() {
  const path =document.location.pathname
  const route=routes[path]
  if (!route) {
  return navigate('/login');
  }
  
  const template=document.getElementById(route.templateId)
  const view = template.content.cloneNode(true);
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(view);
  document.title=route.templateId
  if(path === "/dashboard"){
  console.log('Dashboard is shown') 
  }
  if (typeof route.init === 'function') {
  route.init();
  }
  }
  
  const routes = {
  '/login': { templateId: 'login'},
  '/dashboard': { templateId: 'dashboard',init: refresh},
  '/credit':{ templateId: 'credit'}
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
  updateRoute();
  
  async function register() {
  const registerForm = document.getElementById('registerForm');
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const result = await createAccount(jsonData);
  if (result.error) {
  return updateElement('registerError',result.error)
  }
  console.log('Account created!', result); 
  updateState('account',result)
  state.account=result;
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
  const loginForm = document.getElementById('loginForm')
  const user = loginForm.user.value;
  const data = await getAccount(user)
  if (data.error) {
  return updateElement('loginError', data.error);
  }
  
  updateState('account', data);
  state.account=data
  navigate('/dashboard');
  }
  async function getAccount(user) {
  try {
  console.log("Fetching acc for:",user)
  const response = await fetch('//localhost:5000/api/accounts/' + encodeURIComponent(user));
  return await response.json();
  } catch (error) {
  return { error: error.message || 'Unknown error' };
  }
  }
  function updateElement(id, textOrNode){
  const element = document.getElementById(id);
  element.textContent = '';
  element.append(textOrNode)
  }
  const account = state.account
  function updateDashboard() {
  const account = state.account;
  if (!account) {
  return navigate('/login');
  }
  updateElement('description', account.description || 'No desciption');
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
  const storageKey = 'savedAccount';
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
  // Our previous initialization code
  window.onpopstate = () => updateRoute();
  return updateRoute('/login');
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
  const AddTrans = document.getElementById("AddTrans")
  const Add_Trans = document.getElementById("Add_trans")
  const Trans = document.getElementById("Trans")
  const Ok = document.getElementById("ok")
  const cancel = document.getElementById("cancel")
  Add_Trans.addEventListener('click',() => {
  Trans.showModal()
  })
  async function createTrans(account) {
    try{
      const response = await fetch(` /api/accounts/${encodeURIComponent(account.user)}/transactions`,{
        method:'POST',
        headers:{ 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
        });
        return await response.json();
        } catch (error) {
        return { error: error.message || 'Unknown error' };
        }
        }
  Ok.addEventListener('click',(event) => {
  event.preventDefault()
  const transaction = {
  date: AddTrans.elements["Date"].value, // Use form elements
  object: AddTrans.elements["Obj"].value,
  amount: parseFloat(AddTrans.elements["Amnt"].value)
  };
  createTrans(transaction)
  console.log("Adding transaction",state.account)
  state.account.transactions.push(transaction)
  updateDashboard()
  updateAccountData()
  Trans.close()
  })
  
  cancel.addEventListener('click',() => {
  Trans.close()
  })
  