/**
 * Admin settings for Create External Conversation
 */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const settingsContainer = document.getElementById('create-external-conversation-admin-settings');
        
        if (!settingsContainer) {
            return;
        }

        // Get initial state from Nextcloud
        const initialState = OCP.InitialState.loadState('create_external_conversation', 'admin-settings');
        
        // Create settings form
        const form = document.createElement('div');
        form.className = 'section';
        form.innerHTML = `
            <h2>External Nextcloud Talk Server</h2>
            <p class="settings-hint">
                Configure connection to external Nextcloud server for creating conversations.
            </p>
            
            <div class="settings-form">
                <p>
                    <label for="external-server-url">External Server URL:</label>
                    <input type="text" id="external-server-url" 
                           value="${initialState.externalServerUrl || ''}" 
                           placeholder="https://example.com"
                           style="width: 400px;">
                </p>
                
                <p>
                    <label for="username">Username:</label>
                    <input type="text" id="username" 
                           value="${initialState.username || ''}" 
                           placeholder="admin"
                           style="width: 400px;">
                </p>
                
                <p>
                    <label for="password">Password:</label>
                    <input type="password" id="password" 
                           placeholder="${initialState.hasPassword ? '••••••••' : 'Enter password'}"
                           style="width: 400px;">
                    <em style="display: block; margin-top: 5px; color: #888;">
                        Leave empty to keep current password
                    </em>
                </p>
                
                <p>
                    <button id="save-settings" class="button primary">Save Settings</button>
                    <button id="test-connection" class="button" style="margin-left: 10px;">Test Connection</button>
                    <span id="save-status" style="margin-left: 10px;"></span>
                </p>
            </div>
        `;
        
        settingsContainer.appendChild(form);
        
        // Create Conversation section
        const createConvSection = document.createElement('div');
        createConvSection.className = 'section';
        createConvSection.innerHTML = `
            <h2>
                <svg class="material-design-icon__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; fill: currentColor;">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39Z"/>
                </svg>
                Create Conversation
            </h2>
            <p class="settings-hint">
                Create a new conversation on the external server. You will be invited as a federated user.
            </p>
            
            <div class="create-conversation-form" style="
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 20px;
                margin-top: 16px;
            ">
                <div style="margin-bottom: 16px;">
                    <label for="conv-name" style="display: block; font-weight: 500; margin-bottom: 8px;">Conversation Name</label>
                    <input type="text" id="conv-name" 
                           placeholder="e.g., Team Meeting"
                           style="
                               width: 100%;
                               padding: 10px 12px;
                               border: 2px solid #ddd;
                               border-radius: 6px;
                               font-size: 14px;
                               box-sizing: border-box;
                               transition: border-color 0.2s ease;
                           ">
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 24px;">
                    <button id="create-conversation" class="button primary" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--color-primary, #0082c9);
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                        transition: opacity 0.2s ease;
                    ">Create</button>
                </div>
                
                <div id="info-container" style="display: none; margin-top: 20px;">
                    <div style="padding: 12px; background: #e7f3ff; border-radius: 6px; color: #0082c9; border-left: 4px solid #0082c9;">
                        <p id="info-message" style="margin: 0; font-weight: 500;"></p>
                    </div>
                </div>
                
                <div id="error-container" style="display: none; margin-top: 20px;">
                    <div style="padding: 12px; background: #fff5f5; border-radius: 6px; color: #e74c3c; border-left: 4px solid #e74c3c;">
                        <p id="error-message" style="margin: 0; font-weight: 500;"></p>
                    </div>
                </div>
                
                <div id="conversation-result" style="display: none; margin-top: 20px; padding: 12px; background: #28a745; border-radius: 6px; color: white;">
                    <p style="margin: 0 0 8px 0;"><strong>✓ Room created!</strong></p>
                    <p style="margin: 0 0 12px 0;">
                        <label style="display: block; font-weight: 500; margin-bottom: 8px;">Room URL:</label>
                        <input type="text" id="result-url" readonly style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid rgba(255,255,255,0.3);
                            border-radius: 4px;
                            background: rgba(255,255,255,0.1);
                            color: white;
                            box-sizing: border-box;
                        " />
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <button id="copy-url" class="button" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.3);
                            border-radius: 4px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Copy URL</button>
                        <a id="open-url" target="_blank" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.3);
                            border-radius: 4px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: 500;
                            cursor: pointer;
                        ">Open in new tab</a>
                    </div>
                </div>
            </div>
        `;
        
        settingsContainer.appendChild(createConvSection);
        
        // Create conversation handler
        document.getElementById('create-conversation').addEventListener('click', function() {
            const convName = document.getElementById('conv-name').value.trim();
            const infoContainer = document.getElementById('info-container');
            const errorContainer = document.getElementById('error-container');
            const infoMessage = document.getElementById('info-message');
            const errorMessage = document.getElementById('error-message');
            const createBtn = document.getElementById('create-conversation');
            
            if (!convName) {
                errorContainer.style.display = 'block';
                infoContainer.style.display = 'none';
                errorMessage.textContent = 'Please enter conversation name';
                return;
            }
            
            // Disable button and show info
            createBtn.disabled = true;
            createBtn.style.opacity = '0.6';
            createBtn.style.cursor = 'not-allowed';
            infoContainer.style.display = 'block';
            errorContainer.style.display = 'none';
            infoMessage.textContent = 'Creating conversation...';
            
            fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation?format=json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken
                },
                body: JSON.stringify({
                    conversationName: convName,
                    participants: []  // You will be added automatically by the API
                })
            })
            .then(async response => {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + text.substring(0, 200));
                }
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error('Non-JSON response: ' + text.substring(0, 200));
                }
            })
            .then(result => {
                if (result.ocs && result.ocs.data && result.ocs.data.success) {
                    infoContainer.style.display = 'none';
                    
                    // Show result with URL
                    const url = result.ocs.data.link;
                    document.getElementById('result-url').value = url;
                    document.getElementById('open-url').href = url;
                    document.getElementById('conversation-result').style.display = 'block';
                    
                    // Clear form
                    document.getElementById('conv-name').value = '';
                    
                    // Re-enable button after 3 seconds
                    setTimeout(() => {
                        createBtn.disabled = false;
                        createBtn.style.opacity = '1';
                        createBtn.style.cursor = 'pointer';
                    }, 3000);
                    
                    console.log('Conversation created:', result.ocs.data);
                } else {
                    throw new Error(result.ocs?.data?.error || 'Failed to create conversation');
                }
            })
            .catch(error => {
                infoContainer.style.display = 'none';
                errorContainer.style.display = 'block';
                errorMessage.textContent = 'Error: ' + error.message;
                createBtn.disabled = false;
                createBtn.style.opacity = '1';
                createBtn.style.cursor = 'pointer';
                console.error('Failed to create conversation:', error);
            });
        });
        
        // Add focus/blur styling to conversation name input
        const convNameInput = document.getElementById('conv-name');
        convNameInput.addEventListener('focus', () => {
            convNameInput.style.borderColor = '#0082c9';
            convNameInput.style.boxShadow = '0 0 0 3px rgba(0, 130, 201, 0.1)';
        });
        
        convNameInput.addEventListener('blur', () => {
            convNameInput.style.borderColor = '#ddd';
            convNameInput.style.boxShadow = 'none';
        });
        
        // Copy URL handler
        document.getElementById('copy-url').addEventListener('click', function() {
            const urlInput = document.getElementById('result-url');
            urlInput.select();
            document.execCommand('copy');
            alert('URL copied to clipboard!');
        });
        
        // Add hover effects to result buttons
        const copyBtn = document.getElementById('copy-url');
        const openBtn = document.getElementById('open-url');
        
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.background = 'rgba(255,255,255,0.3)';
        });
        
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.background = 'rgba(255,255,255,0.2)';
        });
        
        openBtn.addEventListener('mouseenter', () => {
            openBtn.style.background = 'rgba(255,255,255,0.3)';
        });
        
        openBtn.addEventListener('mouseleave', () => {
            openBtn.style.background = 'rgba(255,255,255,0.2)';
        });
        
        // Save settings handler
        document.getElementById('save-settings').addEventListener('click', function() {
            const statusEl = document.getElementById('save-status');
            statusEl.textContent = 'Saving...';
            statusEl.style.color = '#888';
            
            const data = {
                externalServerUrl: document.getElementById('external-server-url').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value || null
            };
            
            fetch(OC.generateUrl('/apps/create_external_conversation/settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'requesttoken': OC.requestToken
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    statusEl.textContent = '✓ Settings saved successfully';
                    statusEl.style.color = '#28a745';
                    
                    // Clear password field after save
                    document.getElementById('password').value = '';
                    document.getElementById('password').placeholder = '••••••••';
                } else {
                    throw new Error(result.error || 'Failed to save settings');
                }
            })
            .catch(error => {
                statusEl.textContent = '✗ Error: ' + error.message;
                statusEl.style.color = '#dc3545';
            });
        });
        
        // Test connection handler
        document.getElementById('test-connection').addEventListener('click', function() {
            const statusEl = document.getElementById('save-status');
            statusEl.textContent = 'Testing connection...';
            statusEl.style.color = '#888';
            
            // Use absolute OCS endpoint (OC.generateUrl adds index.php and breaks OCS)
            fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/test?format=json', {
                headers: {
                    'Accept': 'application/json',
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(result => {
                if (result.ocs && result.ocs.data && result.ocs.data.success) {
                    statusEl.textContent = '✓ Connection successful';
                    statusEl.style.color = '#28a745';
                } else {
                    throw new Error(result.ocs?.data?.error || 'Connection test failed');
                }
            })
            .catch(error => {
                statusEl.textContent = '✗ Connection failed: ' + error.message;
                statusEl.style.color = '#dc3545';
            });
        });
    });
})();
