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
            <h2>Create Conversation</h2>
            <p class="settings-hint">
                Create a new conversation on the external server. You will be invited as a federated user.
            </p>
            
            <div class="create-conversation-form">
                <p>
                    <label for="conv-name">Conversation Name:</label>
                    <input type="text" id="conv-name" 
                           placeholder="e.g., Team Meeting"
                           style="width: 400px;">
                </p>
                
                <p>
                    <button id="create-conversation" class="button primary">Create Conversation</button>
                    <span id="create-status" style="margin-left: 10px;"></span>
                </p>
                
                <div id="conversation-result" style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 3px; display: none;">
                    <p><strong>Room created!</strong></p>
                    <p>
                        <label>Room URL:</label>
                        <input type="text" id="result-url" readonly style="width: 100%; margin: 5px 0; padding: 8px;" />
                    </p>
                    <button id="copy-url" class="button" style="margin-top: 10px;">Copy URL</button>
                    <a id="open-url" target="_blank" class="button" style="margin-left: 5px; margin-top: 10px; text-decoration: none; display: inline-block;">Open in new tab</a>
                </div>
            </div>
        `;
        
        settingsContainer.appendChild(createConvSection);
        
        // Create conversation handler
        document.getElementById('create-conversation').addEventListener('click', function() {
            const convName = document.getElementById('conv-name').value.trim();
            const statusEl = document.getElementById('create-status');
            
            if (!convName) {
                statusEl.textContent = '✗ Please enter conversation name';
                statusEl.style.color = '#dc3545';
                return;
            }
            
            statusEl.textContent = 'Creating conversation...';
            statusEl.style.color = '#888';
            
            fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation?format=json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken
                },
                body: JSON.stringify({
                    conversationName: convName
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.ocs && result.ocs.data && result.ocs.data.success) {
                    statusEl.textContent = '✓ Conversation created successfully!';
                    statusEl.style.color = '#28a745';
                    
                    // Show result with URL
                    const url = result.ocs.data.link;
                    document.getElementById('result-url').value = url;
                    document.getElementById('open-url').href = url;
                    document.getElementById('conversation-result').style.display = 'block';
                    
                    // Clear form
                    document.getElementById('conv-name').value = '';
                } else {
                    throw new Error(result.ocs?.data?.error || 'Failed to create conversation');
                }
            })
            .catch(error => {
                statusEl.textContent = '✗ Error: ' + error.message;
                statusEl.style.color = '#dc3545';
            });
        });
        
        // Copy URL handler
        document.getElementById('copy-url').addEventListener('click', function() {
            const urlInput = document.getElementById('result-url');
            urlInput.select();
            document.execCommand('copy');
            alert('URL copied to clipboard!');
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
