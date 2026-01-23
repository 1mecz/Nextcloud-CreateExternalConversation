/**
 * Main JavaScript file for Create External Conversation
 */

(function(OC, OCA) {
    'use strict';

    if (!OCA.CreateExternalConversation) {
        OCA.CreateExternalConversation = {};
    }

    /**
     * Initialize the app
     */
    OCA.CreateExternalConversation.init = function() {
        // Wait for Talk to be loaded
        if (typeof OCA.Talk === 'undefined') {
            setTimeout(OCA.CreateExternalConversation.init, 500);
            return;
        }

        // Add button to Talk sidebar
        OCA.CreateExternalConversation.addButton();
    };

    /**
     * Add "Create External Conversation" button to Talk
     */
    OCA.CreateExternalConversation.addButton = function() {
        // Try to find the "New conversation" button or Talk's conversation list
        const checkForTalkUI = setInterval(function() {
            // Look for the conversation list container
            const conversationList = document.querySelector('.conversations');
            const newConversationButton = document.querySelector('[aria-label="Create a new conversation"]') || 
                                         document.querySelector('button.new-conversation');
            
            if (conversationList || newConversationButton) {
                clearInterval(checkForTalkUI);
                
                // Create our button
                const button = document.createElement('button');
                button.className = 'external-conversation-button primary';
                button.innerHTML = '<span class="icon-external"></span> Create External Conversation';
                button.onclick = OCA.CreateExternalConversation.showDialog;
                
                // Try to insert after new conversation button
                if (newConversationButton && newConversationButton.parentElement) {
                    newConversationButton.parentElement.insertBefore(button, newConversationButton.nextSibling);
                } else if (conversationList) {
                    // Insert at the top of conversation list
                    conversationList.insertBefore(button, conversationList.firstChild);
                }
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(function() {
            clearInterval(checkForTalkUI);
        }, 10000);
    };

    /**
     * Show dialog for creating external conversation
     */
    OCA.CreateExternalConversation.showDialog = function() {
        const dialogHtml = `
            <div id="external-conversation-dialog">
                <h3>Create External Conversation</h3>
                <div class="dialog-content">
                    <div class="form-group">
                        <label for="conversation-name">Conversation Name:</label>
                        <input type="text" id="conversation-name" placeholder="Enter conversation name" />
                    </div>
                    <div class="form-group">
                        <label for="user-search">Search External User:</label>
                        <input type="text" id="user-search" placeholder="Search for user..." />
                        <div id="user-results"></div>
                    </div>
                    <div class="form-group" id="selected-user-container" style="display: none;">
                        <label>Selected User:</label>
                        <div id="selected-user"></div>
                    </div>
                    <div class="dialog-actions">
                        <button id="create-external-conversation" class="primary" disabled>Create</button>
                        <button id="cancel-external-conversation">Cancel</button>
                    </div>
                    <div id="dialog-message"></div>
                </div>
            </div>
        `;

        // Show dialog using Nextcloud's dialog system
        OC.dialogs.message(
            dialogHtml,
            'Create External Conversation',
            'notice',
            OC.dialogs.OK_BUTTON,
            function() {},
            true,
            true
        );

        // Add event handlers after dialog is created
        setTimeout(function() {
            OCA.CreateExternalConversation.setupDialogHandlers();
        }, 100);
    };

    /**
     * Setup event handlers for the dialog
     */
    OCA.CreateExternalConversation.setupDialogHandlers = function() {
        let selectedUserId = null;
        let searchTimeout = null;

        const conversationNameInput = document.getElementById('conversation-name');
        const userSearchInput = document.getElementById('user-search');
        const userResults = document.getElementById('user-results');
        const selectedUserDiv = document.getElementById('selected-user');
        const selectedUserContainer = document.getElementById('selected-user-container');
        const createButton = document.getElementById('create-external-conversation');
        const cancelButton = document.getElementById('cancel-external-conversation');
        const messageDiv = document.getElementById('dialog-message');

        // User search
        if (userSearchInput) {
            userSearchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const searchTerm = this.value.trim();
                
                if (searchTerm.length < 2) {
                    userResults.innerHTML = '';
                    return;
                }

                searchTimeout = setTimeout(function() {
                    OCA.CreateExternalConversation.searchUsers(searchTerm, function(users) {
                        userResults.innerHTML = '';
                        if (users.length === 0) {
                            userResults.innerHTML = '<div class="no-results">No users found</div>';
                            return;
                        }

                        users.forEach(function(user) {
                            const userDiv = document.createElement('div');
                            userDiv.className = 'user-result';
                            userDiv.textContent = user;
                            userDiv.onclick = function() {
                                selectedUserId = user;
                                selectedUserDiv.textContent = user;
                                selectedUserContainer.style.display = 'block';
                                userResults.innerHTML = '';
                                userSearchInput.value = '';
                                OCA.CreateExternalConversation.updateCreateButton();
                            };
                            userResults.appendChild(userDiv);
                        });
                    });
                }, 500);
            });
        }

        // Conversation name input
        if (conversationNameInput) {
            conversationNameInput.addEventListener('input', function() {
                OCA.CreateExternalConversation.updateCreateButton();
            });
        }

        // Update create button state
        OCA.CreateExternalConversation.updateCreateButton = function() {
            const conversationName = conversationNameInput ? conversationNameInput.value.trim() : '';
            if (createButton) {
                createButton.disabled = !(conversationName && selectedUserId);
            }
        };

        // Create button
        if (createButton) {
            createButton.addEventListener('click', function() {
                const conversationName = conversationNameInput.value.trim();
                
                if (!conversationName || !selectedUserId) {
                    return;
                }

                createButton.disabled = true;
                messageDiv.innerHTML = '<span class="icon-loading-small"></span> Creating conversation...';

                OCA.CreateExternalConversation.createConversation(
                    conversationName,
                    selectedUserId,
                    function(response) {
                        if (response.success) {
                            messageDiv.innerHTML = '<div class="success">✓ Conversation created successfully!</div>';
                            setTimeout(function() {
                                // Close dialog
                                const dialog = document.querySelector('.oc-dialog');
                                if (dialog) {
                                    dialog.remove();
                                }
                                // Optionally open the external conversation
                                if (response.externalUrl) {
                                    window.open(response.externalUrl, '_blank');
                                }
                            }, 2000);
                        } else {
                            messageDiv.innerHTML = '<div class="error">✗ ' + (response.error || 'Failed to create conversation') + '</div>';
                            createButton.disabled = false;
                        }
                    }
                );
            });
        }

        // Cancel button
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                const dialog = document.querySelector('.oc-dialog');
                if (dialog) {
                    dialog.remove();
                }
            });
        }
    };

    /**
     * Search for users on external Nextcloud
     */
    OCA.CreateExternalConversation.searchUsers = function(searchTerm, callback) {
        $.ajax({
            url: OC.generateUrl('/apps/create_external_conversation/api/v1/users'),
            type: 'GET',
            data: { search: searchTerm },
            success: function(response) {
                callback(response.users || []);
            },
            error: function() {
                callback([]);
            }
        });
    };

    /**
     * Create conversation on external Nextcloud
     */
    OCA.CreateExternalConversation.createConversation = function(conversationName, federatedUserId, callback) {
        $.ajax({
            url: OC.generateUrl('/apps/create_external_conversation/api/v1/conversation'),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                conversationName: conversationName,
                federatedUserId: federatedUserId
            }),
            success: function(response) {
                callback(response);
            },
            error: function(xhr) {
                const response = xhr.responseJSON || { error: 'Unknown error' };
                callback(response);
            }
        });
    };

    // Initialize when document is ready
    $(document).ready(function() {
        OCA.CreateExternalConversation.init();
    });

})(OC, OCA);
