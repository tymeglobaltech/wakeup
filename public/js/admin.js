'use strict';

// ---------------------------------------------------------------------------
// Google SSO
// ---------------------------------------------------------------------------

fetch('/api/config').then(r => r.json()).then(config => {
  if (!config.googleClientId) return;
  document.getElementById('ssoDivider').style.display = '';
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleGoogleToken,
      hosted_domain: 'tymeglobal.com'
    });
    google.accounts.id.renderButton(
      document.getElementById('googleSignInBtn'),
      { theme: 'outline', size: 'large', width: 288, text: 'signin_with' }
    );
  };
  document.head.appendChild(script);
}).catch(() => { /* SSO unavailable, silent fail */ });

async function handleGoogleToken(response) {
  const errEl = document.getElementById('googleError');
  errEl.textContent = '';
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Google sign-in failed.'; return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    document.getElementById('navUsername').textContent = data.username + ' (' + data.role + ')';
    showAdminPanel();
  } catch {
    errEl.textContent = 'Connection error during Google sign-in.';
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'wuc_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

async function apiFetch(path, opts) {
  const res = await fetch(path, opts);
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    showToast('Session expired. Please log in again.', true);
    setTimeout(() => location.reload(), 1500);
    throw new Error('Unauthorized');
  }
  return res;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('inputUsername').value.trim();
  const password = document.getElementById('inputPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || 'Login failed.';
      return;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    document.getElementById('navUsername').textContent = data.username + ' (' + data.role + ')';
    showAdminPanel();
  } catch {
    errEl.textContent = 'Connection error. Is the server running?';
  }
});

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
}

// ---------------------------------------------------------------------------
// Panel routing
// ---------------------------------------------------------------------------

function showAdminPanel() {
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
  showSection('groups');
}

function showSection(name) {
  document.getElementById('sectionGroups').style.display = name === 'groups' ? '' : 'none';
  document.getElementById('sectionUsers').style.display  = name === 'users'  ? '' : 'none';
  document.getElementById('navGroups').classList.toggle('active', name === 'groups');
  document.getElementById('navUsers').classList.toggle('active', name === 'users');
  if (name === 'groups') loadGroups();
  if (name === 'users')  loadUsers();
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

async function loadGroups() {
  const res = await apiFetch('/api/admin/groups', { headers: { 'Authorization': 'Bearer ' + getToken() } });
  if (!res.ok) { showToast('Failed to load groups.', true); return; }
  const groups = await res.json();
  renderGroups(groups);
}

function renderGroups(groups) {
  const list = document.getElementById('groupsList');
  list.innerHTML = '';

  if (!groups.length) {
    list.innerHTML = '<p class="empty-msg">No groups yet. Click &ldquo;Add Group&rdquo; to create one.</p>';
    return;
  }

  groups.sort((a, b) => a.order - b.order).forEach(group => {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.dataset.id = group.id;

    const linksRows = (group.links || []).map(link =>
      `<tr>
        <td>${esc(link.label)}</td>
        <td><a class="link-url" href="${safeHref(link.url)}" target="_blank" rel="noopener" title="${esc(link.url)}">${esc(link.url || '#')}</a></td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" onclick="openLinkModal('${esc(group.id)}', ${JSON.stringify(link).split('"').join('&quot;')})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLink('${esc(group.id)}','${esc(link.id)}')">Delete</button>
        </td>
      </tr>`
    ).join('');

    card.innerHTML =
      `<div class="group-card-header" onclick="toggleCard('${esc(group.id)}')">
        <div class="color-swatch" style="background:${esc(group.color)}"></div>
        <span class="group-card-title">${esc(group.label)}</span>
        <span class="group-order-badge">order: ${esc(String(group.order))}</span>
        <div class="group-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" onclick="moveGroup('${esc(group.id)}', -1)">&#8593;</button>
          <button class="btn btn-ghost btn-sm" onclick="moveGroup('${esc(group.id)}', 1)">&#8595;</button>
          <button class="btn btn-ghost btn-sm" onclick="openGroupModal(${JSON.stringify(group).split('"').join('&quot;')})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteGroup('${esc(group.id)}')">Delete</button>
        </div>
        <span class="chevron"></span>
      </div>
      <div class="group-card-body">
        ${linksRows.length
          ? `<table class="links-table">
               <thead><tr><th>Label</th><th>URL</th><th>Actions</th></tr></thead>
               <tbody>${linksRows}</tbody>
             </table>`
          : '<p class="empty-msg">No links in this group.</p>'}
        <button class="btn btn-primary btn-sm" onclick="openLinkModal('${esc(group.id)}', null)">+ Add Link</button>
      </div>`;

    list.appendChild(card);
  });
}

function toggleCard(groupId) {
  const card = document.querySelector(`.group-card[data-id="${groupId}"]`);
  if (card) card.classList.toggle('collapsed');
}

// ---------------------------------------------------------------------------
// Group modal
// ---------------------------------------------------------------------------

let _modalSaveFn = null;

function openGroupModal(group) {
  const isEdit = !!group;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Group' : 'Add Group';
  document.getElementById('modalBody').innerHTML =
    `<div class="form-group">
       <label>Group Label</label>
       <input type="text" id="mLabel" value="${isEdit ? esc(group.label) : ''}" placeholder="e.g. GROUP A">
     </div>
     <div class="form-group">
       <label>Header Color</label>
       <input type="color" id="mColor" value="${isEdit ? esc(group.color) : '#2a7d8e'}">
     </div>
     <div class="form-group">
       <label>Display Order</label>
       <input type="number" id="mOrder" value="${isEdit ? esc(String(group.order)) : ''}" placeholder="Leave blank for auto">
     </div>`;

  _modalSaveFn = async () => {
    const label = document.getElementById('mLabel').value.trim();
    const color = document.getElementById('mColor').value;
    const order = document.getElementById('mOrder').value;
    if (!label) { showToast('Label is required.', true); return; }

    const body = { label, color };
    if (order !== '') body.order = parseInt(order);

    const url   = isEdit ? '/api/admin/groups/' + group.id : '/api/admin/groups';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Save failed.', true); return; }
    closeModal();
    loadGroups();
    showToast(isEdit ? 'Group updated.' : 'Group created.');
  };

  openModal();
}

async function deleteGroup(id) {
  if (!confirm('Delete this group and all its links?')) return;
  const res = await apiFetch('/api/admin/groups/' + id, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { const d = await res.json(); showToast(d.error || 'Delete failed.', true); return; }
  loadGroups();
  showToast('Group deleted.');
}

async function moveGroup(id, direction) {
  const res = await apiFetch('/api/admin/groups', { headers: { 'Authorization': 'Bearer ' + getToken() } });
  const groups = await res.json();
  const sorted = groups.sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex(g => g.id === id);
  if (idx === -1) return;
  const swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;

  // Swap orders
  const tmpOrder = sorted[idx].order;
  const newOrder = sorted[swapIdx].order === tmpOrder ? tmpOrder + direction : sorted[swapIdx].order;

  await apiFetch('/api/admin/groups/' + sorted[idx].id,
    { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ order: newOrder }) });
  await apiFetch('/api/admin/groups/' + sorted[swapIdx].id,
    { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ order: tmpOrder }) });
  loadGroups();
}

// ---------------------------------------------------------------------------
// Link modal
// ---------------------------------------------------------------------------

function openLinkModal(groupId, link) {
  const isEdit = !!link;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Link' : 'Add Link';
  document.getElementById('modalBody').innerHTML =
    `<div class="form-group">
       <label>Hotel / Link Label</label>
       <input type="text" id="mLinkLabel" value="${isEdit ? esc(link.label) : ''}" placeholder="e.g. Hotel Arlo NoMad">
     </div>
     <div class="form-group">
       <label>URL</label>
       <input type="url" id="mLinkUrl" value="${isEdit ? esc(link.url || '') : ''}" placeholder="https://example.com">
     </div>`;

  _modalSaveFn = async () => {
    const label = document.getElementById('mLinkLabel').value.trim();
    const url   = document.getElementById('mLinkUrl').value.trim() || '#';
    if (!label) { showToast('Label is required.', true); return; }

    const apiUrl = isEdit
      ? `/api/admin/groups/${groupId}/links/${link.id}`
      : `/api/admin/groups/${groupId}/links`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await apiFetch(apiUrl, { method, headers: authHeaders(), body: JSON.stringify({ label, url }) });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Save failed.', true); return; }
    closeModal();
    loadGroups();
    showToast(isEdit ? 'Link updated.' : 'Link added.');
  };

  openModal();
}

async function deleteLink(groupId, linkId) {
  if (!confirm('Delete this link?')) return;
  const res = await apiFetch(`/api/admin/groups/${groupId}/links/${linkId}`,
    { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { const d = await res.json(); showToast(d.error || 'Delete failed.', true); return; }
  loadGroups();
  showToast('Link deleted.');
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function loadUsers() {
  const res = await apiFetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + getToken() } });
  if (!res.ok) { showToast('Failed to load users.', true); return; }
  const users = await res.json();
  renderUsers(users);
}

function renderUsers(users) {
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${esc(user.username)}</td>
       <td>${user.email ? `<a class="link-url" href="mailto:${esc(user.email)}">${esc(user.email)}</a>` : '<span style="color:var(--text-muted);font-style:italic">—</span>'}</td>
       <td><span class="role-badge ${esc(user.role)}">${esc(user.role)}</span></td>
       <td style="white-space:nowrap">
         <button class="btn btn-ghost btn-sm" onclick="openUserModal(${JSON.stringify(user).split('"').join('&quot;')})">Edit</button>
         <button class="btn btn-danger btn-sm" onclick="deleteUser('${esc(user.id)}')">Delete</button>
       </td>`;
    tbody.appendChild(tr);
  });
}

function openUserModal(user) {
  const isEdit = !!user;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit User' : 'Add User';
  document.getElementById('modalBody').innerHTML =
    `<div class="form-group">
       <label>Username</label>
       <input type="text" id="mUsername" value="${isEdit ? esc(user.username) : ''}" placeholder="Enter username">
     </div>
     <div class="form-group">
       <label>Email Address <span style="font-weight:400;text-transform:none;font-size:11px">(used for Google SSO)</span></label>
       <input type="email" id="mEmail" value="${isEdit ? esc(user.email || '') : ''}" placeholder="agent@example.com">
     </div>
     <div class="form-group">
       <label>Password <span style="font-weight:400;text-transform:none;font-size:11px">(leave blank if using SSO)</span></label>
       <input type="password" id="mPassword" autocomplete="new-password" placeholder="Leave blank if using Google SSO">
     </div>
     <div class="form-group">
       <label>Role</label>
       <select id="mRole">
         <option value="agent" ${(!isEdit || user.role === 'agent') ? 'selected' : ''}>Agent</option>
         <option value="admin" ${(isEdit && user.role === 'admin') ? 'selected' : ''}>Admin</option>
       </select>
     </div>`;

  _modalSaveFn = async () => {
    const username = document.getElementById('mUsername').value.trim();
    const email    = document.getElementById('mEmail').value.trim();
    const password = document.getElementById('mPassword').value;
    const role     = document.getElementById('mRole').value;
    if (!username) { showToast('Username is required.', true); return; }

    const body = { username, email, role };
    if (password) body.password = password;

    const url    = isEdit ? '/api/admin/users/' + user.id : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Save failed.', true); return; }
    closeModal();
    loadUsers();
    showToast(isEdit ? 'User updated.' : 'User created.');
  };

  openModal();
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  const res = await apiFetch('/api/admin/users/' + id, { method: 'DELETE', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) { showToast(data.error || 'Delete failed.', true); return; }
  loadUsers();
  showToast('User deleted.');
}

// ---------------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------------

function openModal() {
  document.getElementById('modal').style.display = 'flex';
  // Focus first input after render
  setTimeout(() => {
    const first = document.querySelector('#modalBody input, #modalBody select');
    if (first) first.focus();
  }, 50);
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  _modalSaveFn = null;
}

function modalSave() {
  if (_modalSaveFn) _modalSaveFn();
}

// Close modal on overlay click
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function showToast(message, isError) {
  const t = document.createElement('div');
  t.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHref(url) {
  const u = String(url || '').trim();
  if (u === '#' || u.startsWith('http://') || u.startsWith('https://')) return esc(u);
  return '#';
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

(function init() {
  const token = getToken();
  if (!token) return; // stay on login

  // Verify token is still valid by loading groups
  fetch('/api/admin/groups', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        return; // stay on login
      }
      res.json().then(groups => {
        // Decode username from token payload
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          document.getElementById('navUsername').textContent =
            payload.username + ' (' + payload.role + ')';
        } catch { /* ignore */ }
        showAdminPanel();
        renderGroups(groups);
      });
    })
    .catch(() => { /* stay on login */ });
})();
