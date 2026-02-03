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

    // Add links to event description textarea
    function addLinksToEventDescription(externalLink, localLink) {
        console.log('[CreateExternalConversation] Looking for description textarea...');
        
        // Find the textarea in property-text__input
        const textarea = document.querySelector('.property-text__input textarea');
        
        if (!textarea) {
            console.log('[CreateExternalConversation] Description textarea not found');
            return;
        }

        console.log('[CreateExternalConversation] Found description textarea');

        // Get current content
        const currentContent = textarea.value || '';
        
        // Add links
        const linksText = '\n\nTalk Links:\nExternal: ' + externalLink + '\nInternal: ' + localLink;
        const newContent = currentContent + linksText;
        
        // Set content
        textarea.value = newContent;
        
        // Trigger change events so Calendar detects the change
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('[CreateExternalConversation] Links added to description textarea');
        showNotification('Links added to event description!', 'success', 3000);
    }

    // Create external conversation
    async function createConversationForEvent(eventName) {
        console.log('[CreateExternalConversation] Creating conversation for event:', eventName);
        
        if (!eventName) {
            showNotification('Event name is required', 'error');
            return;
        }

        const creatingNotification = showNotification('Creating conversation...', 'info', 0);

        try {
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

            const externalData = await externalResponse.json();

            if (!externalData.ocs?.data?.success) {
                throw new Error(externalData.ocs?.data?.error || 'Failed to create external conversation');
            }

            const externalLink = externalData.ocs.data.link;

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

            const localData = await localResponse.json();

            if (!localData.ocs?.data?.token) {
                throw new Error('Failed to create local conversation');
            }

            const localToken = localData.ocs.data.token;
            const localLink = window.location.origin + '/call/' + localToken;

            // Remove creating notification
            if (creatingNotification && creatingNotification.parentElement) {
                creatingNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (creatingNotification.parentElement) {
                        creatingNotification.remove();
                    }
                }, 300);
            }

            // Show success with links
            showNotification('✓ Conversations created!', 'success', 5000);
            
            // Show external link
            showNotification('External: ' + externalLink, 'info', 8000);
            
            // Show internal link
            showNotification('Internal: ' + localLink, 'info', 8000);

            // Try to add links to event description textarea
            addLinksToEventDescription(externalLink, localLink);

            console.log('[CreateExternalConversation] Created conversations successfully:', {
                external: externalLink,
                internal: localLink,
            });

        } catch (error) {
            console.error('[CreateExternalConversation] Error:', error);
            
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
     * Add button to .app-full-body__right next to Talk button
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

        // Find "Přidat konverzaci v Talk" button
        const talkButton = rightPanel.querySelector('.property-add-talk__button');
        
        if (!talkButton) {
            console.log('[CreateExternalConversation] Talk button not found yet, retrying...');
            setTimeout(() => tryAddButtonToRightPanel(rightPanel), 500);
            return;
        }

        console.log('[CreateExternalConversation] Found Talk button, creating our button...');

        // Create button with same styling as Talk button
        const button = document.createElement('button');
        button.className = 'create-external-conversation-calendar-btn property-add-talk__button button-vue button-vue--size-normal button-vue--text-only button-vue--vue-secondary';
        button.type = 'button';
        button.title = 'Create external conversation and add links to event';
        button.style.width = '100%';
        button.style.marginTop = '8px';
        
        button.innerHTML = `<span class="button-vue__wrapper"><span class="button-vue__text">
            🌐 Create External Conversation
        </span></span>`;

        button.addEventListener('click', async (e) => {
            console.log('[CreateExternalConversation] Button clicked!');
            e.preventDefault();
            e.stopPropagation();

            try {
                // Get event name from sidebar header
                const eventNameEl = document.querySelector('.app-sidebar-header__mainname');
                let eventName = eventNameEl?.textContent?.trim() || 'Conversation';
                
                console.log('[CreateExternalConversation] Event name:', eventName);
                
                if (!eventName || eventName.length < 2) {
                    showNotification('Could not determine event name. Please try again.', 'error');
                    return;
                }

                button.disabled = true;
                button.style.opacity = '0.6';
                button.style.pointerEvents = 'none';

                await createConversationForEvent(eventName);

                button.disabled = false;
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            } catch (error) {
                console.error('[CreateExternalConversation] Error:', error);
                showNotification('Error: ' + error.message, 'error');
                button.disabled = false;
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto';
            }
        });

        // Insert button after Talk button (in same parent container)
        talkButton.parentElement.insertBefore(button, talkButton.nextSibling);
        console.log('[CreateExternalConversation] Button inserted next to Talk button!');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButtonToCalendarEvent);
    } else {
        addButtonToCalendarEvent();
    }

})();
