/**
 * Talk integration - Add "Create External Conversation" button to Talk sidebar
 */

(function() {
    'use strict';

    // Wait for Talk app to be ready
    const waitForTalk = setInterval(function() {
        if (window.OCA && window.OCA.Talk) {
            clearInterval(waitForTalk);
            initTalkIntegration();
        }
    }, 100);

    function initTalkIntegration() {
        console.log('[CreateExternalConversation] Initializing Talk integration');

        // Add button to Talk dashboard
        addButtonToDashboard();

        // Add button to top-bar for adding participants to existing conversations
        // Delay initial call to allow Talk to load conversation
        setTimeout(() => addParticipantButton(), 1000);

        // Watch for URL changes (SPA navigation)
        window.addEventListener('hashchange', () => {
            console.log('[CreateExternalConversation] Hash changed to:', window.location.hash);
            setTimeout(addParticipantButton, 500);
        });
    }

    function addParticipantButton() {
        try {
            const wrapper = document.querySelector('.top-bar__wrapper');
            if (!wrapper) {
                return;
            }

            // Check if button already exists
            if (wrapper.querySelector('.add-external-participant-btn')) {
                return;
            }

            // Create button with text
            const button = document.createElement('button');
            button.className = 'add-external-participant-btn';
            button.type = 'button';
            button.title = 'Add participant to external conversation';
            button.setAttribute('aria-label', 'Add participant');
            button.textContent = '+ Add Participant';

            button.addEventListener('click', showAddParticipantModal);
            
            // Append to wrapper
            wrapper.appendChild(button);
        } catch (e) {
            console.error('[CreateExternalConversation] Error adding participant button:', e);
        }
    }

    function getConversationToken() {
        try {
            // Try from pathname: /call/TOKEN
            const pathnameMatch = window.location.pathname.match(/\/call\/([a-zA-Z0-9]+)/);
            if (pathnameMatch?.[1]) {
                console.log('[CreateExternalConversation] Token from pathname:', pathnameMatch[1]);
                return pathnameMatch[1];
            }

            // Try from URL hash: #conversation/TOKEN
            const hashMatch = window.location.hash.match(/#conversation\/([^/?]+)/);
            if (hashMatch?.[1]) {
                console.log('[CreateExternalConversation] Token from URL hash:', hashMatch[1]);
                return hashMatch[1];
            }

            // Try Talk store
            const token = window.OCA?.Talk?.store?.getters?.currentConversation?.token;
            if (token) {
                console.log('[CreateExternalConversation] Token from Talk store:', token);
                return token;
            }

            // Try from data attribute
            const convElement = document.querySelector('[data-conversation-token]');
            if (convElement) {
                const tokenFromData = convElement.getAttribute('data-conversation-token');
                console.log('[CreateExternalConversation] Token from data attribute:', tokenFromData);
                return tokenFromData;
            }

            // Log debug info
            console.log('[CreateExternalConversation] Could not find token. Debug info:');
            console.log('  window.location.hash:', window.location.hash);
            console.log('  window.location.pathname:', window.location.pathname);
            console.log('  window.OCA?.Talk exists:', !!window.OCA?.Talk);

            return null;
        } catch (e) {
            console.error('[CreateExternalConversation] Error getting token:', e);
            return null;
        }
    }

    function showAddParticipantModal() {
        // Check if this is an external conversation (created via external conversation feature)
        // For now, we can only add participants to external conversations
        // External conversations are identified by looking for a marker in the page
        
        // Create modal using inline styles like in federatedtalklink
        const modal = document.createElement('div');
        modal.className = 'add-participant-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'add-participant-modal-content';
        modalContent.style.cssText = `
            background: var(--color-main-background, white);
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            max-height: 80vh;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Add Participant to External Conversation</h2>
            <form id="add-participant-form">
                <div class="form-group">
                    <label for="participant-search" style="display: block; font-weight: 500; margin-bottom: 8px;">Search users</label>
                    <input type="text" id="participant-search" placeholder="Search users..." autocomplete="off" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                    <div id="participant-search-results" class="search-results" style="display: none; margin-top: 8px;"></div>
                    <div id="selected-participants" class="selected-participants" style="margin-top: 12px;"></div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--color-primary, #0082c9);
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                    ">Add</button>
                    <button type="button" class="btn btn-secondary" id="cancel-btn" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        background: transparent;
                        cursor: pointer;
                        font-weight: 500;
                    ">Cancel</button>
                </div>
            </form>
            <div id="result-container" style="display: none; margin-top: 20px;">
                <div class="result-success" style="padding: 12px; background: var(--color-success-light, #f0f9ff); border-radius: 6px; color: var(--color-success, #46ba61);">
                    <p style="margin: 0 0 8px 0;"><strong>Success!</strong></p>
                    <p style="margin: 0;">Participant added: <span id="added-participant"></span></p>
                </div>
            </div>
            <div id="error-container" style="display: none; margin-top: 20px;">
                <div style="padding: 12px; background: var(--color-error-light, #fff5f5); border-radius: 6px; color: var(--color-error, #e74c3c);">
                    <p id="error-message" style="margin: 0;"></p>
                </div>
            </div>
            <div id="info-container" style="display: none; margin-top: 20px;">
                <div style="padding: 12px; background: var(--color-info-light, #f0f5ff); border-radius: 6px; color: var(--color-info, #0082c9);">
                    <p id="info-message" style="margin: 0;"></p>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Store selected participant
        const selectedParticipants = new Set();

        // Handle participant search
        const searchInput = modalContent.querySelector('#participant-search');
        const searchResults = modalContent.querySelector('#participant-search-results');
        const selectedContainer = modalContent.querySelector('#selected-participants');
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchLocalUsers(query, searchResults, selectedParticipants, selectedContainer);
            }, 300);
        });

        // Handle close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        modalContent.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());

        // Handle form submit
        const form = modalContent.querySelector('#add-participant-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (selectedParticipants.size === 0) {
                const errorContainer = modalContent.querySelector('#error-container');
                errorContainer.style.display = 'block';
                modalContent.querySelector('#error-message').textContent = 'Please select a participant';
                return;
            }
            const participant = Array.from(selectedParticipants)[0];
            handleAddParticipant(modal, participant);
        });
    }

    function handleAddParticipant(modal, federatedId) {
        // Get token at the time of adding (might have loaded by now)
        const localToken = getConversationToken();

        if (!localToken) {
            modal.querySelector('#error-container').style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: Could not find conversation token. Please reload the page.';
            return;
        }

        // Try to find external token from localStorage
        let externalToken = null;
        const externalTokens = JSON.parse(localStorage.getItem('externalConversationTokens') || '{}');
        externalToken = Object.keys(externalTokens).find(token => externalTokens[token].token) || null;

        // If not found in localStorage, prompt user to enter external conversation ID
        if (!externalToken) {
            showExternalTokenModal((token) => {
                if (token) {
                    // Retry with provided token
                    addParticipantToExternalConversation(modal, federatedId, token);
                }
            });
            return;
        }

        console.log('[CreateExternalConversation] handleAddParticipant - localToken:', localToken, 'externalToken:', externalToken, 'federatedId:', federatedId);
        addParticipantToExternalConversation(modal, federatedId, externalToken);
    }

    function addParticipantToExternalConversation(modal, federatedId, externalToken) {
        const form = modal.querySelector('#add-participant-form');
        const resultContainer = modal.querySelector('#result-container');
        const errorContainer = modal.querySelector('#error-container');

        // Use external token instead of local token
        const url = `/ocs/v2.php/apps/create_external_conversation/api/v1/conversation/${encodeURIComponent(externalToken)}/participants?format=json`;
        console.log('[CreateExternalConversation] Calling:', url);

        // Prepare form data
        const formData = new FormData();
        formData.append('federatedId', federatedId);

        // Make request to add participant
        fetch(url, {
            method: 'POST',
            headers: {
                'OCS-APIRequest': 'true',
                'requesttoken': OC.requestToken,
            },
            body: formData,
        })
        .then(response => {
            console.log('[CreateExternalConversation] Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('[CreateExternalConversation] Response data:', data);
            if (data.ocs.meta.statuscode === 200 && data.ocs.data.success) {
                form.style.display = 'none';
                resultContainer.style.display = 'block';
                errorContainer.style.display = 'none';
                modal.querySelector('#added-participant').textContent = federatedId;

                // Store external token in localStorage for future use
                const externalTokens = JSON.parse(localStorage.getItem('externalConversationTokens') || '{}');
                if (!externalTokens[externalToken]) {
                    externalTokens[externalToken] = {
                        token: externalToken,
                        createdAt: new Date().toISOString(),
                    };
                    localStorage.setItem('externalConversationTokens', JSON.stringify(externalTokens));
                    console.log('[CreateExternalConversation] Stored external token:', externalToken);
                }

                // Close modal after 2 seconds
                setTimeout(() => modal.remove(), 2000);
            } else {
                throw new Error(data.ocs.data.error || data.ocs.meta.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('[CreateExternalConversation] Error:', error);
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: ' + error.message;
        });
    }

    function showExternalTokenModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'external-token-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'external-token-modal-content';
        modalContent.style.cssText = `
            background: var(--color-main-background, white);
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">External Conversation ID</h2>
            <p style="margin: 0 0 16px 0; color: var(--color-text-lighter, #666); font-size: 14px;">
                This conversation was created externally. Please enter the conversation ID from the external Nextcloud server (the ID in the URL after /call/)
            </p>
            <form id="external-token-form">
                <div class="form-group">
                    <label for="external-token-input" style="display: block; font-weight: 500; margin-bottom: 8px;">External Conversation ID</label>
                    <input type="text" id="external-token-input" placeholder="e.g. iioe3kww" autocomplete="off" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                    <p style="margin: 8px 0 0 0; color: var(--color-text-lighter, #666); font-size: 12px;">
                        You can find this in the external server URL: ext.example.com/call/<strong>iioe3kww</strong>
                    </p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px;">
                    <button type="submit" class="btn btn-primary" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--color-primary, #0082c9);
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                    ">Use</button>
                    <button type="button" class="btn btn-secondary" id="cancel-token-btn" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        background: transparent;
                        cursor: pointer;
                        font-weight: 500;
                    ">Cancel</button>
                </div>
            </form>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Handle close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                callback(null);
            }
        });
        modalContent.querySelector('#cancel-token-btn').addEventListener('click', () => {
            modal.remove();
            callback(null);
        });

        // Handle form submit
        const form = modalContent.querySelector('#external-token-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const token = modalContent.querySelector('#external-token-input').value.trim();
            if (token) {
                modal.remove();
                callback(token);
            }
        });

        // Focus input field
        modalContent.querySelector('#external-token-input').focus();
    }

    function addButtonToDashboard() {
        // Look for talk-dashboard__actions container
        const dashboardActions = document.querySelector('.talk-dashboard__actions');

        if (!dashboardActions) {
            console.log('[CreateExternalConversation] Dashboard actions not found yet, retrying...');
            setTimeout(addButtonToDashboard, 500);
            return;
        }

        console.log('[CreateExternalConversation] Found dashboard actions');

        // Add styles
        addStyles();

        // Create button
        const button = document.createElement('button');
        button.className = 'create-external-conversation-dashboard-btn talk-dashboard-btn button-vue button-vue--size-normal button-vue--secondary';
        button.type = 'button';
        button.title = 'Create a conversation on external Nextcloud server';
        button.innerHTML = `
            <svg class="material-design-icon__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39Z"/>
            </svg>
            <span class="text">External conversation</span>
        `;

        // Add click handler
        button.addEventListener('click', showCreateConversationModal);

        // Add to dashboard actions - insert as 3rd element (after first 2)
        const children = Array.from(dashboardActions.children);
        if (children.length >= 2) {
            // Insert before 3rd child (at index 2)
            dashboardActions.insertBefore(button, children[2]);
        } else {
            // Otherwise just append at end
            dashboardActions.appendChild(button);
        }
        
        console.log('[CreateExternalConversation] Button added to dashboard at position ' + (dashboardActions.children.length - 1));
    }

    function showCreateConversationModal() {
        console.log('[CreateExternalConversation] Opening modal');

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'create-external-conversation-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create External Conversation</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="create-external-conversation-form">
                        <div class="form-group">
                            <label for="conversation-name">Conversation Name</label>
                            <input type="text" id="conversation-name" name="conversationName" required placeholder="Enter conversation name">
                        </div>
                        <div class="form-group">
                            <label for="participant-search">Add Participants (optional)</label>
                            <input type="text" id="participant-search" placeholder="Search users..." autocomplete="off">
                            <div id="participant-search-results" class="search-results" style="display: none;"></div>
                            <div id="selected-participants" class="selected-participants"></div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Create</button>
                            <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                        </div>
                    </form>
                    <div id="result-container" style="display: none;" class="result-container">
                        <div class="result-success">
                            <p><strong>Success!</strong></p>
                            <p>Conversation created with <span id="participants-count">0</span> participant(s)</p>
                            <input type="text" id="result-link" readonly class="result-link">
                            <div class="result-actions">
                                <button type="button" class="btn btn-primary" id="copy-link-btn">Copy Link</button>
                                <button type="button" class="btn btn-secondary" id="open-link-btn">Open</button>
                            </div>
                        </div>
                    </div>
                    <div id="error-container" style="display: none;" class="error-container">
                        <p id="error-message"></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Store selected participants
        const selectedParticipants = new Set();

        // Handle participant search
        const searchInput = modal.querySelector('#participant-search');
        const searchResults = modal.querySelector('#participant-search-results');
        const selectedContainer = modal.querySelector('#selected-participants');
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchLocalUsers(query, searchResults, selectedParticipants, selectedContainer);
            }, 300);
        });

        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());

        // Handle form submit
        const form = modal.querySelector('#create-external-conversation-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateConversation(modal, Array.from(selectedParticipants));
        });

        // Handle result actions
        modal.querySelector('#copy-link-btn')?.addEventListener('click', () => {
            const link = modal.querySelector('#result-link');
            link.select();
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        });

        modal.querySelector('#open-link-btn')?.addEventListener('click', () => {
            const link = modal.querySelector('#result-link').value;
            window.open(link, '_blank');
        });
    }

    function handleCreateConversation(modal, participants = []) {
        const conversationName = modal.querySelector('#conversation-name').value.trim();
        const form = modal.querySelector('#create-external-conversation-form');
        const resultContainer = modal.querySelector('#result-container');
        const errorContainer = modal.querySelector('#error-container');

        if (!conversationName) {
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Please enter a conversation name';
            return;
        }

        // Make request to create conversation
        fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation?format=json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OCS-APIRequest': 'true',
                'requesttoken': OC.requestToken,
            },
            body: JSON.stringify({
                conversationName: conversationName,
                participants: participants,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.ocs.meta.statuscode === 200 && data.ocs.data.success) {
                form.style.display = 'none';
                resultContainer.style.display = 'block';
                errorContainer.style.display = 'none';
                modal.querySelector('#result-link').value = data.ocs.data.link;
                modal.querySelector('#participants-count').textContent = data.ocs.data.participantsAdded || 0;

                // Store external token in localStorage for later use when adding participants
                if (data.ocs.data.token) {
                    const externalToken = data.ocs.data.token;
                    const externalTokens = JSON.parse(localStorage.getItem('externalConversationTokens') || '{}');
                    externalTokens[externalToken] = {
                        token: externalToken,
                        createdAt: new Date().toISOString(),
                        link: data.ocs.data.link,
                    };
                    localStorage.setItem('externalConversationTokens', JSON.stringify(externalTokens));
                    console.log('[CreateExternalConversation] Stored external token:', externalToken);
                }

                // Try to refresh Talk conversations without full page reload
                refreshTalkList();
            } else {
                throw new Error(data.ocs.data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('[CreateExternalConversation] Error:', error);
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: ' + error.message;
        });
    }

    function searchLocalUsers(query, resultsContainer, selectedParticipants, selectedContainer) {
        // Show loading state
        resultsContainer.innerHTML = '<div class="search-result-item">Searching...</div>';
        resultsContainer.style.display = 'block';

        const serverHost = window.location.hostname;

        // 1) Try sharees search (works for běžné uživatele)
        // Sharees API (works for běžné uživatele); itemType required to avoid 400
        fetch(`/ocs/v2.php/apps/files_sharing/api/v1/sharees?format=json&search=${encodeURIComponent(query)}&perPage=30&itemType=folder&lookup=true`, {
            credentials: 'same-origin',
            headers: {
                'OCS-APIRequest': 'true',
                'Accept': 'application/json',
                'requesttoken': OC.requestToken,
            },
        })
        .then(resp => {
            if (!resp.ok) throw new Error('sharees-http');
            return resp.json();
        })
        .then(data => {
            const users = data?.ocs?.data?.users || [];
            if (Array.isArray(users)) {
                const mapped = users
                    .map(u => ({ id: u.value?.shareWith || u.label, displayName: u.label || u.value?.shareWith, federatedId: `${(u.value?.shareWith || u.label)}@${serverHost}` }))
                    .filter(u => u.id && u.id !== OC.currentUser);

                if (mapped.length > 0) {
                    displaySearchResults(mapped, resultsContainer, selectedParticipants, selectedContainer);
                    return;
                }
            }
            throw new Error('sharees-empty');
        })
        .catch(() => {
            // 2) Try our app route (no subadmin rights needed)
            const appUrl = OC.generateUrl('/apps/create_external_conversation/local-users') + `?search=${encodeURIComponent(query)}&format=json`;
            fetch(appUrl, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'requesttoken': OC.requestToken,
                },
            })
            .then(resp => {
                if (!resp.ok) throw new Error('app-http');
                return resp.json();
            })
            .then(data => {
                if (data?.users) {
                    displaySearchResults(data.users, resultsContainer, selectedParticipants, selectedContainer);
                    return;
                }
                throw new Error('app-invalid');
            })
            .catch(() => {
                // 3) Fallback to provisioning API (may require subadmin)
                fetch(`/ocs/v2.php/cloud/users?search=${encodeURIComponent(query)}&format=json`, {
                    credentials: 'same-origin',
                    headers: {
                        'OCS-APIRequest': 'true',
                        'Accept': 'application/json',
                        'requesttoken': OC.requestToken,
                    },
                })
                .then(response => {
                    if (!response.ok) throw new Error('ocs-failed');
                    return response.json();
                })
                .then(data => {
                    const statusCode = data?.ocs?.meta?.statuscode;
                    const statusText = data?.ocs?.meta?.status;
                    const rawUsers = data?.ocs?.data?.users;

                    if ((statusCode === 100 || statusCode === 200 || statusText === 'ok') && Array.isArray(rawUsers)) {
                        const users = rawUsers
                            .map(u => (typeof u === 'string' ? { id: u, displayName: u, federatedId: `${u}@${serverHost}` } : { id: u.id, displayName: u.displayname || u.id, federatedId: `${u.id}@${serverHost}` }))
                            .filter(u => u.id && u.id !== OC.currentUser);

                        if (users.length > 0) {
                            displaySearchResults(users, resultsContainer, selectedParticipants, selectedContainer);
                            return;
                        }
                    }
                    throw new Error('ocs-invalid');
                })
                .catch(() => {
                    resultsContainer.innerHTML = '<div class="search-result-item">No results (insufficient rights?)</div>';
                    resultsContainer.style.display = 'block';
                });
            });
        });
    }

    function displaySearchResults(users, resultsContainer, selectedParticipants, selectedContainer) {
        resultsContainer.innerHTML = '';

        if (!users || users.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No users found</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        users.forEach(user => {
            if (selectedParticipants.has(user.federatedId)) {
                return; // Skip already selected
            }

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = `${user.displayName} (${user.id})`;
            item.dataset.federatedId = user.federatedId;
            item.dataset.displayName = user.displayName;
            
            item.addEventListener('click', () => {
                selectedParticipants.add(user.federatedId);
                addSelectedParticipant(user, selectedParticipants, selectedContainer);
                resultsContainer.style.display = 'none';
            });

            resultsContainer.appendChild(item);
        });

        resultsContainer.style.display = 'block';
    }

    function addSelectedParticipant(user, selectedParticipants, selectedContainer) {
        const chip = document.createElement('div');
        chip.className = 'participant-chip';
        chip.innerHTML = `
            <span>${user.displayName}</span>
            <button type="button" class="remove-participant">&times;</button>
        `;
        
        chip.querySelector('.remove-participant').addEventListener('click', () => {
            selectedParticipants.delete(user.federatedId);
            chip.remove();
        });

        selectedContainer.appendChild(chip);
    }

    function refreshTalkList() {
        try {
            // Preferred: refresh existing Talk collections if available
            if (window.OCA?.Talk?.Collections?.conversations?.fetch) {
                window.OCA.Talk.Collections.conversations.fetch({ reset: true });
                return;
            }
            if (window.OCA?.Talk?.conversations?.fetch) {
                window.OCA.Talk.conversations.fetch({ reset: true });
                return;
            }
        } catch (e) {
            console.warn('[CreateExternalConversation] refreshTalkList error:', e);
        }
    }

    function addStyles() {
        // Check if styles already added
        if (document.getElementById('create-external-conversation-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'create-external-conversation-styles';
        style.textContent = `
            .create-external-conversation-dashboard-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background-color: var(--color-primary, #0082c9);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            }

            .create-external-conversation-dashboard-btn:hover {
                background-color: var(--color-primary-hover, #006ba3);
            }

            .create-external-conversation-dashboard-btn .material-design-icon__svg {
                display: inline-block;
                width: 20px;
                height: 20px;
                vertical-align: middle;
                margin-right: 8px;
                fill: currentColor;
            }

            .create-external-conversation-button-container {
                padding: 5px 0;
            }

            .create-external-conversation-btn {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 15px;
                margin-bottom: 10px;
                background-color: var(--color-primary, #0082c9);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }

            .create-external-conversation-btn:hover {
                background-color: var(--color-primary-hover, #006ba3);
            }

            .create-external-conversation-btn .material-design-icon__svg {
                display: inline-block;
                width: 20px;
                height: 20px;
                margin-right: 8px;
                fill: currentColor;
            }

            .create-external-conversation-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 10000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            .create-external-conversation-modal .modal-overlay {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background-color: rgba(0, 0, 0, 0.5) !important;
                cursor: pointer !important;
            }

            .create-external-conversation-modal .modal-content {
                position: relative !important;
                background-color: white !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
                max-width: 500px !important;
                width: 90% !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
                z-index: 1000000 !important;
            }

            .add-participant-modal-overlay {
                /* Inline styled in JavaScript */
            }

            .add-participant-modal-content {
                /* Inline styled in JavaScript */
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }

            .modal-header h2 {
                margin: 0;
                font-size: 18px;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }

            .modal-body {
                padding: 20px;
            }

            .form-group {
                margin-bottom: 15px;
                position: relative; /* so search results anchor correctly */
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #333;
            }

            .form-group input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }

            .form-group input:focus {
                outline: none;
                border-color: var(--color-primary, #0082c9);
                box-shadow: 0 0 0 2px rgba(0, 130, 201, 0.1);
            }

            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }

            .btn-primary {
                background-color: var(--color-primary, #0082c9);
                color: white;
            }

            .btn-primary:hover {
                background-color: var(--color-primary-hover, #006ba3);
            }

            .btn-secondary {
                background-color: #f0f0f0;
                color: #333;
            }

            .btn-secondary:hover {
                background-color: #e0e0e0;
            }

            .result-container {
                padding: 20px;
                background-color: #f0f9ff;
                border-radius: 4px;
            }

            .result-success p {
                margin: 10px 0;
                color: #333;
            }

            .result-link {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 10px 0;
                font-size: 12px;
                box-sizing: border-box;
            }

            .result-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }

            .error-container {
                padding: 15px;
                background-color: #fff3cd;
                border-left: 4px solid #ff6b6b;
                border-radius: 4px;
                color: #333;
            }

            .error-container p {
                margin: 0;
            }

            .search-results {
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
                width: calc(100% - 40px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                margin-top: 2px;
            }

            .search-result-item {
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
            }

            .search-result-item:hover {
                background-color: #f5f5f5;
            }

            .search-result-item:last-child {
                border-bottom: none;
            }

            .selected-participants {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            .participant-chip {
                display: inline-flex;
                align-items: center;
                background-color: var(--color-primary-light, #e3f2fd);
                color: var(--color-primary-text, #0d47a1);
                padding: 4px 8px;
                border-radius: 16px;
                font-size: 13px;
                gap: 6px;
            }

            .participant-chip .remove-participant {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .participant-chip .remove-participant:hover {
                opacity: 0.7;
            }

            .top-bar-button {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: none;
                border: none;
                color: var(--color-text, #333);
                cursor: pointer;
                font-size: 13px;
                transition: opacity 0.2s;
                margin-right: 8px;
            }

            .top-bar-button:hover {
                opacity: 0.7;
            }

            .top-bar-button .material-design-icon__svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            .add-external-participant-btn .text {
                display: inline;
            }

            .add-external-participant-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                background: none;
                border: none;
                color: var(--color-text, #333);
                cursor: pointer;
                transition: opacity 0.2s;
                padding: 0;
                margin: 0;
            }

            .add-external-participant-btn:hover {
                opacity: 0.5;
            }

            .add-external-participant-btn {
                display: inline-block;
                padding: 8px 12px;
                background: none;
                border: none;
                color: var(--color-text, #333);
                cursor: pointer;
                font-size: 13px;
                transition: opacity 0.2s;
                margin-left: 8px;
            }

            .add-external-participant-btn:hover {
                opacity: 0.7;
            }
        `;

        document.head.appendChild(style);
    }
})();
