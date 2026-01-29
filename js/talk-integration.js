/**
 * Talk integration - Add "Create External Conversation" button to Talk sidebar
 */

(function() {
    'use strict';

    // Notification system
    function showNotification(message, type = 'info', duration = 3000) {
        // Create notification container if it doesn't exist
        let notificationContainer = document.getElementById('external-conversation-notifications');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'external-conversation-notifications';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }

        // Create notification element
        const notification = document.createElement('div');
        
        let backgroundColor, textColor, icon;
        if (type === 'success') {
            backgroundColor = '#28a745';
            textColor = 'white';
            icon = '✓';
        } else if (type === 'error') {
            backgroundColor = '#e74c3c';
            textColor = 'white';
            icon = '✕';
        } else if (type === 'info') {
            backgroundColor = '#0082c9';
            textColor = 'white';
            icon = 'ℹ';
        }

        notification.style.cssText = `
            padding: 12px 16px;
            background: ${backgroundColor};
            color: ${textColor};
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-weight: 500;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            word-wrap: break-word;
            word-break: break-word;
        `;

        notification.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${message}`;
        notificationContainer.appendChild(notification);

        // Auto-remove notification after duration
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                    // Remove container if empty
                    if (notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            }, duration);
        }

        return notification;
    }

    // Add CSS animations
    function addNotificationStyles() {
        if (!document.getElementById('external-conversation-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'external-conversation-notification-styles';
            style.innerHTML = `
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Call this when page loads
    addNotificationStyles();

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

        // Periodically check if participant button should be added
        // This handles cases where top-bar__wrapper loads after initial check
        const participantButtonWatcher = setInterval(() => {
            addParticipantButton();
        }, 2000);

        // Watch for DOM changes to re-add button if it gets removed or changed
        try {
            const observer = new MutationObserver(() => {
                addParticipantButton();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
        } catch (e) {
            console.log('[CreateExternalConversation] MutationObserver not available');
        }
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
            max-width: 600px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Add Participant to External Conversation</h2>
                <button type="button" class="modal-close-btn" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #333;
                    padding: 0;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: opacity 0.2s ease;
                " title="Close">
                    ×
                </button>
            </div>
            <form id="add-participant-form" style="display: flex; flex-direction: column; flex: 1; overflow: hidden; min-height: 0;">
                <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden; min-height: 0;">
                    <label for="participant-search" style="display: block; font-weight: 500; margin-bottom: 8px; flex-shrink: 0;">Search users</label>
                    <input type="text" id="participant-search" placeholder="Search users..." autocomplete="off" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.2s ease;
                        flex-shrink: 0;
                    ">
                    <div id="participant-search-results" class="search-results" style="
                        display: none;
                        margin-top: 8px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        overflow-y: auto;
                        background: #f5f5f5;
                        flex: 1;
                        min-height: 0;
                    "></div>
                    <div id="selected-participants" class="selected-participants" style="
                        margin-top: 16px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        min-height: 0;
                        flex-shrink: 0;
                    "></div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px; flex-shrink: 0;">
                    <button type="submit" class="btn btn-primary" id="add-btn" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--color-primary, #0082c9);
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                        transition: opacity 0.2s ease, background 0.2s ease;
                    ">Add</button>
                </div>
            </form>
            <div id="result-container" style="display: none; margin-top: 20px; flex-shrink: 0;">
                <div class="result-success" style="padding: 12px; background: #28a745; border-radius: 6px; color: white;">
                    <p style="margin: 0 0 8px 0;"><strong>✓ Success!</strong></p>
                    <p style="margin: 0;">Participant added: <span id="added-participant"></span></p>
                </div>
            </div>
            <div id="error-container" style="display: none; margin-top: 20px; flex-shrink: 0;">
                <div style="padding: 12px; background: var(--color-error-light, #fff5f5); border-radius: 6px; color: var(--color-error, #e74c3c);">
                    <p id="error-message" style="margin: 0;"></p>
                </div>
            </div>
            <div id="info-container" style="display: none; margin-top: 20px; flex-shrink: 0;">
                <div style="padding: 12px; background: #e7f3ff; border-radius: 6px; color: #0082c9; border-left: 4px solid #0082c9;">
                    <p id="info-message" style="margin: 0; font-weight: 500;"></p>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close button handler
        const closeBtn = modalContent.querySelector('.modal-close-btn');
        const closeModal = () => {
            modal.remove();
        };
        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

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
                searchLocalUsers(query, searchResults, selectedParticipants, selectedContainer, searchInput);
            }, 300);
        });

        // Add focus/blur styling to search input
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = '#0082c9';
            searchInput.style.boxShadow = '0 0 0 3px rgba(0, 130, 201, 0.1)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = 'var(--color-border, #ddd)';
            searchInput.style.boxShadow = 'none';
        });

        // Handle close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Handle form submit
        const form = modalContent.querySelector('#add-participant-form');
        const addBtn = modalContent.querySelector('#add-btn');
        let isProcessing = false;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Prevent multiple submissions
            if (isProcessing || addBtn.disabled) {
                return;
            }
            
            if (selectedParticipants.size === 0) {
                const errorContainer = modalContent.querySelector('#error-container');
                errorContainer.style.display = 'block';
                modalContent.querySelector('#error-message').textContent = 'Please select a participant';
                return;
            }
            
            // Disable Add button during submission
            isProcessing = true;
            addBtn.disabled = true;
            addBtn.style.opacity = '0.6';
            addBtn.style.cursor = 'not-allowed';
            addBtn.style.pointerEvents = 'none';
            
            const participants = Array.from(selectedParticipants);
            if (participants.length === 1) {
                handleAddParticipant(modal, participants[0], addBtn, () => {
                    isProcessing = false;
                });
            } else {
                handleAddParticipants(modal, participants, addBtn, () => {
                    isProcessing = false;
                });
            }
        });
    }

    function handleAddParticipant(modal, federatedId, addBtn, onComplete) {
        // Get local conversation token
        const localToken = getConversationToken();

        if (!localToken) {
            modal.querySelector('#error-container').style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: Could not find conversation token. Please reload the page.';
            // Re-enable button on error
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
            addBtn.style.pointerEvents = 'auto';
            if (onComplete) onComplete();
            return;
        }

        console.log('[CreateExternalConversation] Looking for external token for local token:', localToken);

        // Try to get remoteToken from local conversation (for federated conversations)
        // This works when the conversation was created externally and user joined via federation
        fetchConversationAndGetExternalToken(localToken, (remoteToken) => {
            if (remoteToken) {
                console.log('[CreateExternalConversation] Got remote token from Talk API, adding participant');
                addParticipantToExternalConversation(modal, federatedId, remoteToken, { closeOnSuccess: true }, addBtn, onComplete);
            } else {
                // No remote token found - ask user to enter external token manually
                console.log('[CreateExternalConversation] No external token found, asking user');
                // Hide current modal temporarily
                modal.style.display = 'none';
                showExternalTokenModal((userToken) => {
                    // Show current modal again
                    modal.style.display = 'flex';
                    
                    if (userToken) {
                        addParticipantToExternalConversation(modal, federatedId, userToken, { closeOnSuccess: true }, addBtn, onComplete);
                    } else {
                        // User cancelled
                        modal.querySelector('#error-container').style.display = 'block';
                        modal.querySelector('#error-message').textContent = 'Operation cancelled. External token required to add participant to external conversation.';
                        // Re-enable button on cancel
                        addBtn.disabled = false;
                        addBtn.style.opacity = '1';
                        addBtn.style.cursor = 'pointer';
                        addBtn.style.pointerEvents = 'auto';
                        if (onComplete) onComplete();
                    }
                });
            }
        });
    }

    function handleAddParticipants(modal, federatedIds, addBtn, onComplete) {
        // Get local conversation token
        const localToken = getConversationToken();

        if (!localToken) {
            modal.querySelector('#error-container').style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: Could not find conversation token. Please reload the page.';
            // Re-enable button on error
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
            addBtn.style.pointerEvents = 'auto';
            if (onComplete) onComplete();
            return;
        }

        const runAdditions = (externalToken) => {
            const infoContainer = modal.querySelector('#info-container');
            const infoMessage = modal.querySelector('#info-message');
            const errorContainer = modal.querySelector('#error-container');
            const errorMessage = modal.querySelector('#error-message');
            const resultContainer = modal.querySelector('#result-container');

            // Show notification instead of modal message
            const addingNotification = showNotification(`Adding ${federatedIds.length} participants...`, 'info', 0);

            let chain = Promise.resolve();
            federatedIds.forEach((id) => {
                chain = chain.then(() => addParticipantToExternalConversation(modal, id, externalToken, { closeOnSuccess: false }, addBtn));
            });

            chain
                .then(() => {
                    // Remove the "Adding..." notification
                    if (addingNotification && addingNotification.parentElement) {
                        addingNotification.style.animation = 'slideOut 0.3s ease';
                        setTimeout(() => {
                            if (addingNotification.parentElement) {
                                addingNotification.remove();
                            }
                        }, 300);
                    }
                    
                    infoContainer.style.display = 'none';
                    resultContainer.style.display = 'none';
                    showNotification(`Successfully added ${federatedIds.length} participants!`, 'success');
                    // Close modal after 2 seconds
                    setTimeout(() => {
                        modal.remove();
                        if (onComplete) onComplete();
                    }, 2000);
                })
                .catch((err) => {
                    // Remove the "Adding..." notification
                    if (addingNotification && addingNotification.parentElement) {
                        addingNotification.style.animation = 'slideOut 0.3s ease';
                        setTimeout(() => {
                            if (addingNotification.parentElement) {
                                addingNotification.remove();
                            }
                        }, 300);
                    }
                    
                    infoContainer.style.display = 'none';
                    errorContainer.style.display = 'none';
                    showNotification('Error: ' + err.message, 'error');
                    // Re-enable button on error
                    addBtn.disabled = false;
                    addBtn.style.opacity = '1';
                    addBtn.style.cursor = 'pointer';
                    addBtn.style.pointerEvents = 'auto';
                    if (onComplete) onComplete();
                });
        };

        // Try to get remoteToken from local conversation (for federated conversations)
        fetchConversationAndGetExternalToken(localToken, (remoteToken) => {
            if (remoteToken) {
                runAdditions(remoteToken);
            } else {
                // No remote token found - ask user to enter external token manually
                modal.style.display = 'none';
                showExternalTokenModal((userToken) => {
                    // Show current modal again
                    modal.style.display = 'flex';

                    if (userToken) {
                        runAdditions(userToken);
                    } else {
                        // User cancelled
                        modal.querySelector('#error-container').style.display = 'block';
                        modal.querySelector('#error-message').textContent = 'Operation cancelled. External token required to add participants to external conversation.';
                        // Re-enable button on cancel
                        addBtn.disabled = false;
                        addBtn.style.opacity = '1';
                        addBtn.style.cursor = 'pointer';
                        addBtn.style.pointerEvents = 'auto';
                        if (onComplete) onComplete();
                    }
                });
            }
        });
    }

    function fetchConversationAndGetExternalToken(localToken, callback) {
        // Fetch local conversation info from Talk API
        fetch(`/ocs/v2.php/apps/spreed/api/v4/room/${encodeURIComponent(localToken)}?format=json`, {
            headers: {
                'OCS-APIRequest': 'true',
                'requesttoken': OC.requestToken,
            },
        })
        .then(response => response.json())
        .then(data => {
            const localConversation = data.ocs?.data;
            if (!localConversation) {
                console.error('[CreateExternalConversation] Could not fetch local conversation');
                callback(null);
                return;
            }

            // Get remoteToken directly from local conversation data
            const remoteToken = localConversation.remoteToken;
            if (remoteToken) {
                console.log('[CreateExternalConversation] Found remote token:', remoteToken);
                callback(remoteToken);
            } else {
                console.log('[CreateExternalConversation] No remote token found in conversation');
                callback(null);
            }
        })
        .catch(error => {
            console.error('[CreateExternalConversation] Error fetching local conversation:', error);
            callback(null);
        });
    }

    function addParticipantToExternalConversation(modal, federatedId, externalToken, options = { closeOnSuccess: true }, addBtn = null, onComplete = null) {
        const form = modal.querySelector('#add-participant-form');
        const resultContainer = modal.querySelector('#result-container');
        const errorContainer = modal.querySelector('#error-container');
        const addedParticipantEl = modal.querySelector('#added-participant');

        // Call existing endpoint that handles adding participants
        const url = `/ocs/v2.php/apps/create_external_conversation/api/v1/conversation/${encodeURIComponent(externalToken)}/participants?format=json`;
        console.log('[CreateExternalConversation] Adding participant to external conversation:', url);

        // Prepare form data (same as when creating conversation)
        const formData = new FormData();
        formData.append('federatedId', federatedId);

        // Make request to add participant
        return fetch(url, {
            method: 'POST',
            headers: {
                'OCS-APIRequest': 'true',
                'requesttoken': OC.requestToken,
            },
            body: formData,
        })
        .then(response => {
            console.log('[CreateExternalConversation] Response status:', response.status);
            console.log('[CreateExternalConversation] Response headers:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.text().then(text => {
                console.log('[CreateExternalConversation] Response text:', text.substring(0, 500));
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('[CreateExternalConversation] Failed to parse JSON:', e);
                    throw new Error('Invalid JSON response: ' + text.substring(0, 200));
                }
            });
        })
        .then(data => {
            console.log('[CreateExternalConversation] Response data:', data);
            
            // Check if response has expected structure
            const success = data?.ocs?.data?.success;
            const hasError = data?.ocs?.data?.error;
            
            if (success) {
                errorContainer.style.display = 'none';

                if (options.closeOnSuccess) {
                    showNotification(`Participant ${federatedId} added successfully!`, 'success');

                    // Close modal after 2 seconds
                    setTimeout(() => {
                        modal.remove();
                        if (onComplete) onComplete();
                    }, 2000);
                } else {
                    // Append participant to list in-place
                    const current = addedParticipantEl.textContent.trim();
                    addedParticipantEl.textContent = current ? `${current}, ${federatedId}` : federatedId;
                    
                    // Re-enable button after all participants are added
                    if (addBtn) {
                        addBtn.disabled = false;
                        addBtn.style.opacity = '1';
                        addBtn.style.cursor = 'pointer';
                        addBtn.style.pointerEvents = 'auto';
                    }
                }
            } else if (hasError) {
                throw new Error(data.ocs.data.error);
            } else {
                console.error('[CreateExternalConversation] Unexpected response structure:', data);
                throw new Error('Unexpected response structure from server');
            }
        })
        .catch(error => {
            console.error('[CreateExternalConversation] Error:', error);
            errorContainer.style.display = 'none';
            showNotification('Error: ' + error.message, 'error');
            
            // Re-enable button on error
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
                addBtn.style.cursor = 'pointer';
                addBtn.style.pointerEvents = 'auto';
            }
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
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">External Conversation ID</h2>
                <button type="button" class="modal-close-btn" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #333;
                    padding: 0;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: opacity 0.2s ease;
                " title="Close">
                    ×
                </button>
            </div>
            <form id="external-token-form" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                <div class="form-group" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                    <p style="margin: 0 0 16px 0; color: var(--color-text-lighter, #666); font-size: 14px; flex-shrink: 0;">
                        This conversation was created externally. Please enter the conversation ID from the external Nextcloud server (the ID in the URL after /call/)
                    </p>
                    <label for="external-token-input" style="display: block; font-weight: 500; margin-bottom: 8px; flex-shrink: 0;">External Conversation ID</label>
                    <input type="text" id="external-token-input" placeholder="e.g. iioe3kww" autocomplete="off" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.2s ease;
                        flex-shrink: 0;
                    ">
                    <p style="margin: 8px 0 0 0; color: var(--color-text-lighter, #666); font-size: 12px; flex-shrink: 0;">
                        You can find this in the external server URL: ext.example.com/call/<strong>iioe3kww</strong>
                    </p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 24px; flex-shrink: 0;">
                    <button type="submit" class="btn btn-primary" id="use-token-btn" style="
                        flex: 1;
                        padding: 10px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--color-primary, #0082c9);
                        color: white;
                        cursor: pointer;
                        font-weight: 500;
                        transition: opacity 0.2s ease;
                    ">Use</button>
                </div>
            </form>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close button handler
        const closeBtn = modalContent.querySelector('.modal-close-btn');
        const closeModal = () => {
            modal.remove();
            callback(null);
        };
        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Handle form submit
        const form = modalContent.querySelector('#external-token-form');
        const useBtn = modalContent.querySelector('#use-token-btn');
        const tokenInput = modalContent.querySelector('#external-token-input');
        
        // Add focus/blur styling to input
        tokenInput.addEventListener('focus', () => {
            tokenInput.style.borderColor = '#0082c9';
            tokenInput.style.boxShadow = '0 0 0 3px rgba(0, 130, 201, 0.1)';
        });
        
        tokenInput.addEventListener('blur', () => {
            tokenInput.style.borderColor = 'var(--color-border, #ddd)';
            tokenInput.style.boxShadow = 'none';
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const token = tokenInput.value.trim();
            if (token) {
                useBtn.disabled = true;
                useBtn.style.opacity = '0.6';
                useBtn.style.cursor = 'not-allowed';
                modal.remove();
                callback(token);
            }
        });

        // Focus input field
        tokenInput.focus();
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
        modal.className = 'create-external-conversation-modal-overlay';
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
        modalContent.className = 'create-external-conversation-modal-content';
        modalContent.style.cssText = `
            background: var(--color-main-background, white);
            border-radius: 12px;
            padding: 24px;
            max-width: 650px;
            width: 95%;
            max-height: 95vh;
            display: flex;
            flex-direction: column;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Create External Conversation</h2>
                <button type="button" class="modal-close-btn" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #333;
                    padding: 0;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: opacity 0.2s ease;
                " title="Close">
                    ×
                </button>
            </div>
            <form id="create-external-conversation-form" style="display: flex; flex-direction: column; flex: 1; gap: 16px;">
                <div>
                    <label for="conversation-name" style="display: block; font-weight: 500; margin-bottom: 8px;">Conversation Name</label>
                    <input type="text" id="conversation-name" name="conversationName" required placeholder="Enter conversation name" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.2s ease;
                    ">
                </div>
                
                <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
                    <label for="conv-participant-search" style="display: block; font-weight: 500; margin-bottom: 8px;">Add Participants (optional)</label>
                    <input type="text" id="conv-participant-search" placeholder="Search users..." autocomplete="off" style="
                        width: 100%;
                        padding: 10px 12px;
                        border: 2px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        font-size: 14px;
                        box-sizing: border-box;
                        transition: border-color 0.2s ease;
                    ">
                    <div id="conv-participant-search-results" class="search-results" style="
                        display: none;
                        margin-top: 8px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 6px;
                        max-height: 250px;
                        overflow-y: auto;
                        background: #f5f5f5;
                        width: 100%;
                        box-sizing: border-box;
                    "></div>
                    <div id="conv-selected-participants" class="selected-participants" style="
                        margin-top: 12px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    "></div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary" style="
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
            </form>
            <div id="result-container" style="display: none; margin-top: 16px;">
                <div class="result-success" style="padding: 12px; background: #28a745; border-radius: 6px; color: white;">
                    <p style="margin: 0 0 8px 0;"><strong>✓ Success!</strong></p>
                    <p style="margin: 0 0 12px 0;">Conversation created with <span id="participants-count">0</span> participant(s)</p>
                    <input type="text" id="result-link" readonly class="result-link" style="
                        width: 100%;
                        padding: 8px;
                        border: 1px solid rgba(255,255,255,0.3);
                        border-radius: 4px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                        box-sizing: border-box;
                        margin: 8px 0;
                    ">
                    <div class="result-actions" style="display: flex; gap: 10px;">
                        <button type="button" class="btn btn-primary" id="copy-link-btn" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.3);
                            border-radius: 4px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Copy Link</button>
                        <button type="button" class="btn btn-secondary" id="open-link-btn" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: rgba(255,255,255,0.2);
                            color: white;
                            border: 1px solid rgba(255,255,255,0.3);
                            border-radius: 4px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Open</button>
                    </div>
                </div>
            </div>
            <div id="error-container" style="display: none; margin-top: 16px;">
                <div style="padding: 12px; background: #fff5f5; border-radius: 6px; color: #e74c3c; border-left: 4px solid #e74c3c;">
                    <p id="error-message" style="margin: 0;"></p>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Store selected participants
        const selectedParticipants = new Set();

        // Close button handler
        const closeBtn = modalContent.querySelector('.modal-close-btn');
        const closeModal = () => {
            modal.remove();
        };
        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Handle participant search
        const searchInput = modalContent.querySelector('#conv-participant-search');
        const searchResults = modalContent.querySelector('#conv-participant-search-results');
        const selectedContainer = modalContent.querySelector('#conv-selected-participants');
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchLocalUsers(query, searchResults, selectedParticipants, selectedContainer, searchInput);
            }, 300);
        });

        // Add focus/blur styling to inputs
        const nameInput = modalContent.querySelector('#conversation-name');
        nameInput.addEventListener('focus', () => {
            nameInput.style.borderColor = '#0082c9';
            nameInput.style.boxShadow = '0 0 0 3px rgba(0, 130, 201, 0.1)';
        });
        
        nameInput.addEventListener('blur', () => {
            nameInput.style.borderColor = 'var(--color-border, #ddd)';
            nameInput.style.boxShadow = 'none';
        });
        
        searchInput.addEventListener('focus', () => {
            searchInput.style.borderColor = '#0082c9';
            searchInput.style.boxShadow = '0 0 0 3px rgba(0, 130, 201, 0.1)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchInput.style.borderColor = 'var(--color-border, #ddd)';
            searchInput.style.boxShadow = 'none';
        });

        // Handle form submit
        const form = modalContent.querySelector('#create-external-conversation-form');
        const createBtn = form.querySelector('button[type="submit"]');
        let isProcessing = false;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Prevent multiple submissions
            if (isProcessing || createBtn.disabled) {
                return;
            }
            
            isProcessing = true;
            createBtn.disabled = true;
            createBtn.style.opacity = '0.6';
            createBtn.style.cursor = 'not-allowed';
            createBtn.style.pointerEvents = 'none';
            
            handleCreateConversation(modal, Array.from(selectedParticipants), createBtn, () => {
                isProcessing = false;
            });
        });

        // Handle result actions
        modalContent.querySelector('#copy-link-btn').addEventListener('click', () => {
            const link = modalContent.querySelector('#result-link');
            link.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        });

        modalContent.querySelector('#open-link-btn').addEventListener('click', () => {
            const link = modalContent.querySelector('#result-link').value;
            window.open(link, '_blank');
        });
    }

    function handleCreateConversation(modal, participants = [], createBtn = null, onComplete = null) {
        const conversationName = modal.querySelector('#conversation-name').value.trim();
        const form = modal.querySelector('#create-external-conversation-form');
        const resultContainer = modal.querySelector('#result-container');
        const errorContainer = modal.querySelector('#error-container');

        if (!conversationName) {
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Please enter a conversation name';
            // Re-enable button on error
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.style.opacity = '1';
                createBtn.style.cursor = 'pointer';
                createBtn.style.pointerEvents = 'auto';
            }
            if (onComplete) onComplete();
            return;
        }

        // Show creating notification
        const creatingNotification = showNotification('Creating conversation...', 'info', 0);

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
                // Remove the "Creating..." notification
                if (creatingNotification && creatingNotification.parentElement) {
                    creatingNotification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (creatingNotification.parentElement) {
                            creatingNotification.remove();
                        }
                    }, 300);
                }

                errorContainer.style.display = 'none';
                showNotification('Conversation created successfully!', 'success');

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
                
                // Close modal after 2 seconds
                setTimeout(() => modal.remove(), 2000);

                // Try to refresh Talk conversations without full page reload
                refreshTalkList();
                
                if (onComplete) onComplete();
            } else {
                throw new Error(data.ocs.data.error || 'Unknown error');
            }
        })
        .catch(error => {
            // Remove the "Creating..." notification
            if (creatingNotification && creatingNotification.parentElement) {
                creatingNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (creatingNotification.parentElement) {
                        creatingNotification.remove();
                    }
                }, 300);
            }

            console.error('[CreateExternalConversation] Error:', error);
            errorContainer.style.display = 'block';
            modal.querySelector('#error-message').textContent = 'Error: ' + error.message;
            
            // Re-enable button on error
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.style.opacity = '1';
                createBtn.style.cursor = 'pointer';
                createBtn.style.pointerEvents = 'auto';
            }
            if (onComplete) onComplete();
        });
    }

    function searchLocalUsers(query, resultsContainer, selectedParticipants, selectedContainer, searchInput = null) {
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
                    displaySearchResults(mapped, resultsContainer, selectedParticipants, selectedContainer, searchInput);
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
                    displaySearchResults(data.users, resultsContainer, selectedParticipants, selectedContainer, searchInput);
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
                            displaySearchResults(users, resultsContainer, selectedParticipants, selectedContainer, searchInput);
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

    function displaySearchResults(users, resultsContainer, selectedParticipants, selectedContainer, searchInput = null) {
        resultsContainer.innerHTML = '';

        if (!users || users.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: #666;">No users found</div>';
            resultsContainer.style.display = 'block';
            return;
        }
        users.forEach(user => {
            if (selectedParticipants.has(user.federatedId)) {
                return; // Skip already selected
            }

            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `<div style="font-weight: 500;">${user.displayName}</div><div style="font-size: 12px; color: #666;">${user.id}</div>`;
            item.dataset.federatedId = user.federatedId;
            item.dataset.displayName = user.displayName;
            
            item.style.cssText = `
                padding: 10px 12px;
                border-bottom: 1px solid #ddd;
                cursor: pointer;
                transition: background 0.15s ease;
                user-select: none;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#e8e8e8';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedParticipants.add(user.federatedId);
                addSelectedParticipant(user, selectedParticipants, selectedContainer);
                // Hide this user from results
                item.style.display = 'none';
                // Clear input field after selection
                if (searchInput) {
                    searchInput.value = '';
                    resultsContainer.style.display = 'none';
                }
            });

            resultsContainer.appendChild(item);
        });

        resultsContainer.style.display = 'block';
    }

    function addSelectedParticipant(user, selectedParticipants, selectedContainer) {
        const chip = document.createElement('div');
        chip.className = 'participant-chip';
        chip.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: #0082c9;
            color: white;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        `;
        chip.innerHTML = `
            <span title="${user.federatedId}">${user.displayName}</span>
            <button type="button" class="remove-participant" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                margin: 0;
                opacity: 0.8;
                transition: opacity 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
            ">&times;</button>
        `;
        
        chip.addEventListener('mouseenter', () => {
            chip.style.background = '#006aa3';
        });
        
        chip.addEventListener('mouseleave', () => {
            chip.style.background = '#0082c9';
        });
        
        const removeBtn = chip.querySelector('.remove-participant');
        removeBtn.addEventListener('mouseenter', () => {
            removeBtn.style.opacity = '1';
        });
        
        removeBtn.addEventListener('mouseleave', () => {
            removeBtn.style.opacity = '0.8';
        });
        
        chip.querySelector('.remove-participant').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectedParticipants.delete(user.federatedId);
            chip.remove();
            // Show removed user back in results if search is still visible
            const resultsContainer = chip.closest('[id*="participant"]')?.parentElement?.querySelector('#participant-search-results');
            if (resultsContainer && resultsContainer.style.display !== 'none') {
                const userItems = resultsContainer.querySelectorAll(`[data-federated-id="${user.federatedId}"]`);
                userItems.forEach(item => item.style.display = 'block');
            }
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

            .create-external-conversation-modal-overlay {
                /* Inline styled in JavaScript */
            }

            .create-external-conversation-modal-content {
                /* Inline styled in JavaScript */
            }

            .add-participant-modal-overlay {
                /* Inline styled in JavaScript */
            }

            .add-participant-modal-content {
                /* Inline styled in JavaScript */
            }


            .search-results {
                position: relative;
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
