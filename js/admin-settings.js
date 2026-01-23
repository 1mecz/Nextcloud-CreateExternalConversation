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
            
            fetch(OC.generateUrl('/ocs/v2.php/apps/create_external_conversation/api/v1/test'), {
                headers: {
                    'Accept': 'application/json',
                    'requesttoken': OC.requestToken
                }
            })
            .then(response => response.json())
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
