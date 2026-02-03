/**
 * Calendar integration - Add "Create External Conversation" button to Calendar events
 */

(function() {
    'use strict';

    console.log('[CreateExternalConversation] Calendar integration script loaded');

    // Notification system
    function showNotification(message, type = 'info', duration = 3000) {
        const container = document.querySelector('.notification-container') || createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `external-conversation-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-size: 14px;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.background = '#e74c3c';
            notification.style.color = 'white';
        } else {
            notification.style.background = '#0082c9';
            notification.style.color = 'white';
        }

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                    if (container.children.length === 0 && container.parentElement) {
                        container.remove();
                    }
                }, 300);
            }, duration);
        }

        return notification;
    }

    function createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 60px;
            left: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Add CSS animations
    function addNotificationStyles() {
        if (document.getElementById('external-conversation-notification-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'external-conversation-notification-styles';
        style.textContent = `
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

    addNotificationStyles();

    // Create external conversation and add links to event description
    async function createConversationForEvent(eventName, descriptionTextarea) {
        console.log('[CreateExternalConversation] createConversationForEvent called with:', eventName);
        
        if (!eventName) {
            showNotification('Event name is required', 'error');
            return;
        }

        const creatingNotification = showNotification('Creating conversation...', 'info', 0);

        try {
            console.log('[CreateExternalConversation] Creating external conversation...');
            
            // Step 1: Create external conversation
            const externalResponse = await fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation?format=json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken,
                },
                body: JSON.stringify({
                    conversationName: eventName,
                    participants: [],
                }),
            });

            console.log('[CreateExternalConversation] External response status:', externalResponse.status);
            const externalData = await externalResponse.json();
            console.log('[CreateExternalConversation] External data:', externalData);

            if (!externalData.ocs?.data?.success) {
                throw new Error(externalData.ocs?.data?.error || 'Failed to create external conversation');
            }

            const externalLink = externalData.ocs.data.link;
            console.log('[CreateExternalConversation] External link:', externalLink);

            console.log('[CreateExternalConversation] Creating local conversation...');
            
            // Step 2: Create local federated conversation
            const localResponse = await fetch('/ocs/v2.php/apps/spreed/api/v4/room?format=json', {
                method: 'POST',
                headers: {
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    roomType: '2',
                    roomName: eventName,
                }),
            });

            console.log('[CreateExternalConversation] Local response status:', localResponse.status);
            const localData = await localResponse.json();
            console.log('[CreateExternalConversation] Local data:', localData);

            if (!localData.ocs?.data?.token) {
                throw new Error('Failed to create local conversation');
            }

            const localToken = localData.ocs.data.token;
            const localLink = window.location.origin + '/call/' + localToken;
            console.log('[CreateExternalConversation] Local link:', localLink);

            // Remove creating notification
            if (creatingNotification && creatingNotification.parentElement) {
                creatingNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (creatingNotification.parentElement) {
                        creatingNotification.remove();
                    }
                }, 300);
            }

            console.log('[CreateExternalConversation] Adding links to description...');
            
            // Step 3: Add links to event description
            const currentDescription = descriptionTextarea.value || '';
            const newDescription = currentDescription + 
                (currentDescription ? '\n\n' : '') +
                'Talk Links:\n' +
                'External: ' + externalLink + '\n' +
                'Internal: ' + localLink;

            descriptionTextarea.value = newDescription;
            
            console.log('[CreateExternalConversation] New description set:', newDescription);
            
            // Trigger input event to notify Calendar app
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            descriptionTextarea.dispatchEvent(new Event('change', { bubbles: true }));

            showNotification('Conversation created and links added!', 'success');

            console.log('[CreateExternalConversation] Created conversations successfully:', {
                external: externalLink,
                internal: localLink,
            });

        } catch (error) {
            console.error('[CreateExternalConversation] Error in createConversationForEvent:', error);
            
            // Remove creating notification
            if (creatingNotification && creatingNotification.parentElement) {
                creatingNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (creatingNotification.parentElement) {
                        creatingNotification.remove();
                    }
                }, 300);
            }

            showNotification('Error: ' + error.message, 'error');
        }
    }

    /**
     * Add button to .app-full-body__right (Calendar event editor)
     */
    function addButtonToCalendarEvent() {
        console.log('[CreateExternalConversation] Starting to watch for calendar event editor...');
        
        const observer = new MutationObserver(() => {
            const rightPanel = document.querySelector('.app-full-body__right');
            
            if (!rightPanel) return;

            if (rightPanel.querySelector('.create-external-conversation-calendar-btn')) {
                return;
            }

            tryAddButtonToRightPanel(rightPanel);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function tryAddButtonToRightPanel(rightPanel) {
        console.log('[CreateExternalConversation] Trying to add button to right panel...');

        if (rightPanel.querySelector('.create-external-conversation-calendar-btn')) {
            console.log('[CreateExternalConversation] Button already exists');
            return;
        }

        // Find title input
        const titleInputs = rightPanel.querySelectorAll('input[type="text"]');
        let titleInput = null;
        
        // The first text input is usually the title
        if (titleInputs.length > 0) {
            titleInput = titleInputs[0];
            console.log('[CreateExternalConversation] Found title input (first text input)');
        }

        if (!titleInput) {
            console.log('[CreateExternalConversation] Title input not found yet, retrying...');
            setTimeout(() => tryAddButtonToRightPanel(rightPanel), 500);
            return;
        }

        // Find description textarea
        const descriptionTextarea = rightPanel.querySelector('textarea');
        
        if (!descriptionTextarea) {
            console.log('[CreateExternalConversation] Description textarea not found yet, retrying...');
            setTimeout(() => tryAddButtonToRightPanel(rightPanel), 500);
            return;
        }

        console.log('[CreateExternalConversation] Found both title input and description textarea');

        // Find Talk button to locate where to insert our button
        const allButtons = rightPanel.querySelectorAll('button');
        let insertionPoint = null;
        
        // Look for Talk button by text content or class
        let talkButton = null;
        allButtons.forEach(btn => {
            if (btn.textContent.includes('Talk') || btn.title.includes('Talk')) {
                talkButton = btn;
            }
        });

        console.log('[CreateExternalConversation] Talk button found:', !!talkButton);

        // Create button
        const button = document.createElement('button');
        button.className = 'create-external-conversation-calendar-btn';
        button.type = 'button';
        button.title = 'Create external conversation and add links to event';
        button.textContent = '🌐 Create External Conversation';
        button.style.cssText = `
            margin: 8px 0;
            padding: 10px 15px;
            background-color: #0082c9;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
        `;

        button.addEventListener('click', async (e) => {
            console.log('[CreateExternalConversation] Button clicked!');
            e.preventDefault();
            e.stopPropagation();

            const eventName = titleInput.value.trim();
            console.log('[CreateExternalConversation] Event name:', eventName);
            
            if (!eventName) {
                showNotification('Please enter an event title first', 'error');
                return;
            }

            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';

            await createConversationForEvent(eventName, descriptionTextarea);

            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
        });

        // Insert button next to Talk button or append to right panel
        if (talkButton && talkButton.parentElement) {
            talkButton.parentElement.insertBefore(button, talkButton.nextSibling);
            console.log('[CreateExternalConversation] Button inserted after Talk button');
        } else {
            rightPanel.appendChild(button);
            console.log('[CreateExternalConversation] Button appended to right panel');
        }

        console.log('[CreateExternalConversation] Button added successfully!');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButtonToCalendarEvent);
    } else {
        addButtonToCalendarEvent();
    }

})();
