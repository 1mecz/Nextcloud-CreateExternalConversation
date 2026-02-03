/**
 * Calendar integration - Add "Create External Conversation" button to Calendar events
 */

(function() {
    'use strict';

    console.log('[CreateExternalConversation] Calendar integration script loaded');
    console.log('[CreateExternalConversation] Current page:', window.location.href);
    console.log('[CreateExternalConversation] OC object:', window.OC ? 'available' : 'NOT available');

    // Notification system (same as in talk-integration.js)
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

        // Set colors based on type
        if (type === 'success') {
            notification.style.background = '#28a745';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.background = '#e74c3c';
            notification.style.color = 'white';
        } else { // info
            notification.style.background = '#0082c9';
            notification.style.color = 'white';
        }

        container.appendChild(notification);

        // Auto remove after duration (unless duration is 0)
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                    // Remove container if empty
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

    /**
     * Create external conversation and add links to event description
     */
    async function createConversationForEvent(eventName, descriptionTextarea) {
        console.log('[CreateExternalConversation] createConversationForEvent called');
        console.log('[CreateExternalConversation] Event name:', eventName);
        console.log('[CreateExternalConversation] Description textarea:', descriptionTextarea);
        
        if (!eventName) {
            showNotification('Event name is required', 'error');
            return;
        }

        const creatingNotification = showNotification('Creating conversation...', 'info', 0);

        try {
            console.log('[CreateExternalConversation] Starting external conversation creation...');
            
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
            const externalToken = externalData.ocs.data.token;
            console.log('[CreateExternalConversation] External link:', externalLink);

            console.log('[CreateExternalConversation] Starting local conversation creation...');
            
            // Step 2: Create local federated conversation
            const localResponse = await fetch('/ocs/v2.php/apps/spreed/api/v4/room?format=json', {
                method: 'POST',
                headers: {
                    'OCS-APIRequest': 'true',
                    'requesttoken': OC.requestToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    roomType: '2', // Group conversation
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
     * Add button to calendar event modal
     */
    function addButtonToCalendarEvent() {
        console.log('[CreateExternalConversation] Starting to watch for calendar modals...');
        
        // Wait for Calendar event modal to appear
        const observer = new MutationObserver((mutations) => {
            // Look for Calendar event editor modal
            const eventModal = document.querySelector('.event-popover, .modal-wrapper, [class*="event-editor"], .modal-container, .app-sidebar');
            
            if (!eventModal) return;

            console.log('[CreateExternalConversation] Found modal element:', eventModal.className);

            // Check if button already exists
            if (eventModal.querySelector('.create-external-conversation-calendar-btn')) {
                return;
            }

            console.log('[CreateExternalConversation] Button not found, trying to add...');

            // Debug: List all inputs and textareas in modal
            const allInputs = eventModal.querySelectorAll('input');
            const allTextareas = eventModal.querySelectorAll('textarea');
            console.log('[CreateExternalConversation] All inputs in modal:', allInputs.length);
            allInputs.forEach((input, idx) => {
                console.log(`  Input ${idx}:`, {
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    className: input.className,
                    id: input.id,
                });
            });
            console.log('[CreateExternalConversation] All textareas in modal:', allTextareas.length);
            allTextareas.forEach((textarea, idx) => {
                console.log(`  Textarea ${idx}:`, {
                    name: textarea.name,
                    placeholder: textarea.placeholder,
                    className: textarea.className,
                    id: textarea.id,
                });
            });

            // Find the event name/title input
            const titleInput = eventModal.querySelector('input[type="text"][placeholder*="title"], input[type="text"][placeholder*="Title"], input.event-title, [class*="title"] input, input[name="title"]');
            
            console.log('[CreateExternalConversation] Title input found:', !!titleInput);
            if (titleInput) {
                console.log('[CreateExternalConversation] Title input:', titleInput);
            }
            
            if (!titleInput) {
                console.log('[CreateExternalConversation] Title input not found in modal');
                return;
            }

            // Find the description textarea
            const descriptionTextarea = eventModal.querySelector('textarea[placeholder*="description"], textarea[placeholder*="Description"], textarea.event-description, [class*="description"] textarea, textarea[name="description"]');
            
            console.log('[CreateExternalConversation] Description textarea found:', !!descriptionTextarea);
            if (descriptionTextarea) {
                console.log('[CreateExternalConversation] Description textarea:', descriptionTextarea);
            }
            
            if (!descriptionTextarea) {
                console.log('[CreateExternalConversation] Description textarea not found in modal');
                return;
            }

            // Find the "Add Talk conversation" button or similar area
            const talkButton = eventModal.querySelector('button[class*="talk"], button:has(.icon-talk), [class*="talk-button"]');
            let insertionPoint = null;

            console.log('[CreateExternalConversation] Talk button found:', !!talkButton);

            if (talkButton) {
                // Insert after Talk button
                insertionPoint = talkButton.parentElement;
            } else {
                // Insert after description or in actions area
                insertionPoint = descriptionTextarea.closest('.property, .form-group, [class*="description"]');
                if (!insertionPoint) {
                    insertionPoint = eventModal.querySelector('.event-actions, .modal-buttons, [class*="actions"], .app-sidebar-tabs__content');
                }
            }

            if (!insertionPoint) {
                console.log('[CreateExternalConversation] Could not find insertion point, using modal as fallback');
                insertionPoint = eventModal;
            }

            console.log('[CreateExternalConversation] Insertion point found:', insertionPoint.className);

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
                display: flex;
                align-items: center;
                gap: 8px;
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

                await createConversationForEvent(eventName, descriptionTextarea);

                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            });

            // Insert button
            if (talkButton) {
                insertionPoint.insertBefore(button, talkButton.nextSibling);
            } else {
                insertionPoint.appendChild(button);
            }

            console.log('[CreateExternalConversation] Button added to calendar event successfully!');
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButtonToCalendarEvent);
    } else {
        addButtonToCalendarEvent();
    }

})();
