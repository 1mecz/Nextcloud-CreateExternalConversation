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

        // Add button to Talk sidebar
        addTalkSidebarButton();
    }

    function addTalkSidebarButton() {
        // Look for the "New conversation" button in Talk sidebar
        const sidebarContainer = document.querySelector('[data-testid="talk-sidebar"]') 
            || document.querySelector('.talk-sidebar')
            || document.querySelector('#talk-sidebar');

        if (!sidebarContainer) {
            console.log('[CreateExternalConversation] Talk sidebar not found, retrying...');
            setTimeout(addTalkSidebarButton, 500);
            return;
        }

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'create-external-conversation-button-container';
        buttonContainer.innerHTML = `
            <button class="create-external-conversation-btn" title="Create external conversation">
                <span class="icon icon-add"></span>
                <span class="text">Create external conversation</span>
            </button>
        `;

        // Add styles
        addStyles();

        // Find parent of new conversation button
        const newConvButton = sidebarContainer.querySelector('[data-testid="new-conversation"]')
            || sidebarContainer.querySelector('[title*="New conversation"]')
            || sidebarContainer.querySelector('.button-new-conversation');

        if (newConvButton) {
            newConvButton.parentNode.insertAdjacentElement('afterend', buttonContainer);
        } else {
            // Fallback: add at top of sidebar
            const sidebarButtons = sidebarContainer.querySelector('.talk-sidebar__buttons');
            if (sidebarButtons) {
                sidebarButtons.appendChild(buttonContainer);
            }
        }

        // Add event listener
        const btn = buttonContainer.querySelector('.create-external-conversation-btn');
        if (btn) {
            btn.addEventListener('click', showCreateConversationModal);
        }
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
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Create</button>
                            <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                        </div>
                    </form>
                    <div id="result-container" style="display: none;" class="result-container">
                        <div class="result-success">
                            <p><strong>Success!</strong></p>
                            <p>Conversation created:</p>
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

        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());

        // Handle form submit
        const form = modal.querySelector('#create-external-conversation-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateConversation(modal);
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

    function handleCreateConversation(modal) {
        const conversationName = modal.querySelector('#conversation-name').value.trim();
        const form = modal.querySelector('#create-external-conversation-form');
        const resultContainer = modal.querySelector('#result-container');
        const errorContainer = modal.querySelector('#error-container');

        if (!conversationName) {
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Please enter a conversation name';
            return;
        }

        // Get current user's federated ID
        const userId = OC.currentUser;
        const serverName = window.location.hostname;
        const federatedId = userId + '@' + serverName;

        // Make request to create conversation
        fetch(OC.generateUrl('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation?format=json'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'OCS-APIRequest': 'true',
                'requesttoken': OC.requestToken,
            },
            body: JSON.stringify({
                conversationName: conversationName,
                federatedId: federatedId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.ocs.meta.statuscode === 200 && data.ocs.data.success) {
                form.style.display = 'none';
                resultContainer.style.display = 'block';
                errorContainer.style.display = 'none';
                modal.querySelector('#result-link').value = data.ocs.data.link;
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

    function addStyles() {
        // Check if styles already added
        if (document.getElementById('create-external-conversation-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'create-external-conversation-styles';
        style.textContent = `
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

            .create-external-conversation-btn .icon {
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 8px;
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>');
                background-size: contain;
                background-repeat: no-repeat;
            }

            .create-external-conversation-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                cursor: pointer;
            }

            .modal-content {
                position: relative;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
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
        `;

        document.head.appendChild(style);
    }
})();
