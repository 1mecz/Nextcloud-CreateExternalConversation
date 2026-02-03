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

    // Add participants from calendar to conversation
    async function addParticipantsToConversation(externalToken, eventName) {
        console.log('[CreateExternalConversation] Looking for participants in calendar...');
        
        // Find right panel
        const rightPanel = document.querySelector('.app-full-body__right');
        if (!rightPanel) {
            console.log('[CreateExternalConversation] Right panel not found');
            return;
        }
        
        // Try to find email addresses from all possible sources
        const emails = new Set();
        
        // 1. Try to find email inputs/fields
        const emailInputs = rightPanel.querySelectorAll('input[type="email"], input[type="text"][placeholder*="email"], input[placeholder*="Email"], input[placeholder*="Participant"]');
        console.log('[CreateExternalConversation] Found email inputs:', emailInputs.length);
        emailInputs.forEach(input => {
            if (input.value && input.value.includes('@')) {
                emails.add(input.value.trim().toLowerCase());
            }
        });
        
        // 2. Try to find attendee/participant list items
        const attendeeElements = rightPanel.querySelectorAll('[class*="attendee"], [class*="participant"], [class*="member"]');
        console.log('[CreateExternalConversation] Found attendee elements:', attendeeElements.length);
        attendeeElements.forEach(el => {
            const text = el.textContent || el.innerText || '';
            const match = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (match) {
                emails.add(match[1].toLowerCase());
            }
        });
        
        // 3. Search in all text content for email patterns
        const textContent = rightPanel.innerText || rightPanel.textContent || '';
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const matches = textContent.match(emailRegex);
        if (matches) {
            matches.forEach(email => {
                emails.add(email.toLowerCase());
            });
        }
        
        // Log all found elements for debugging
        console.log('[CreateExternalConversation] Right panel HTML sample:', rightPanel.innerHTML.substring(0, 500));
        
        console.log('[CreateExternalConversation] Found emails:', Array.from(emails));
        
        if (emails.size === 0) {
            console.log('[CreateExternalConversation] No participants found');
            showNotification('No participants found in event', 'info');
            return;
        }
        
        // Add each participant to the external conversation
        let addedCount = 0;
        for (const email of emails) {
            try {
                console.log('[CreateExternalConversation] Adding participant:', email);
                
                const response = await fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation/' + externalToken + '/participants?format=json', {
                    method: 'POST',
                    headers: {
                        'OCS-APIRequest': 'true',
                        'requesttoken': OC.requestToken,
                    },
                    body: new URLSearchParams({
                        federatedId: email,
                    }),
                });
                
                const data = await response.json();
                if (data.ocs?.meta?.statuscode === 200) {
                    console.log('[CreateExternalConversation] Added participant:', email);
                    addedCount++;
                } else {
                    console.log('[CreateExternalConversation] Failed to add participant:', email, data);
                }
            } catch (error) {
                console.error('[CreateExternalConversation] Error adding participant:', email, error);
            }
        }
        
        if (addedCount > 0) {
            showNotification('✓ Added ' + addedCount + ' participant(s)', 'success');
        }
        
        console.log('[CreateExternalConversation] Finished adding participants:', addedCount);
    }

    // Add link to event description textarea
    function addLinksToEventDescription(externalLink) {
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
        
        // Check if link is already in the textarea (prevent duplicates)
        if (currentContent.includes(externalLink)) {
            console.log('[CreateExternalConversation] Link already in textarea, skipping');
            return;
        }
        
        // Add link
        const linkText = '\n\nTalk Link:\n' + externalLink;
        const newContent = currentContent + linkText;
        
        // Set content
        textarea.value = newContent;
        
        // Trigger change events so Calendar detects the change
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('[CreateExternalConversation] Link added to description textarea');
        showNotification('Link added to event description!', 'success', 3000);
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
            const externalToken = externalData.ocs.data.token;

            // Add current user to the conversation automatically
            console.log('[CreateExternalConversation] Adding current user to conversation...');
            try {
                const currentUser = OC.getCurrentUser();
                if (currentUser && currentUser.uid) {
                    const userResponse = await fetch('/ocs/v2.php/apps/create_external_conversation/api/v1/conversation/' + externalToken + '/participants?format=json', {
                        method: 'POST',
                        headers: {
                            'OCS-APIRequest': 'true',
                            'requesttoken': OC.requestToken,
                        },
                        body: new URLSearchParams({
                            federatedId: currentUser.uid,
                        }),
                    });
                    
                    const userData = await userResponse.json();
                    if (userData.ocs?.meta?.statuscode === 200) {
                        console.log('[CreateExternalConversation] Current user added successfully');
                    }
                }
            } catch (userError) {
                console.error('[CreateExternalConversation] Error adding current user:', userError);
                // Continue even if adding current user fails
            }

            // Remove creating notification
            if (creatingNotification && creatingNotification.parentElement) {
                creatingNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (creatingNotification.parentElement) {
                        creatingNotification.remove();
                    }
                }, 300);
            }

            // Show success with link
            showNotification('✓ Conversation created!', 'success', 5000);
            
            // Show external link
            showNotification('External: ' + externalLink, 'info', 8000);

            // Try to add link to event description textarea
            addLinksToEventDescription(externalLink);

            // Try to add event participants to the conversation
            addParticipantsToConversation(externalToken, eventName);

            console.log('[CreateExternalConversation] Created conversation successfully:', {
                external: externalLink,
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
                // Get event name from title input
                const titleInput = document.querySelector('.property-title__input input');
                let eventName = titleInput?.value?.trim() || '';
                
                // If empty, use default name
                if (!eventName) {
                    eventName = 'Nepojmenovaná událost';
                }
                
                console.log('[CreateExternalConversation] Event name:', eventName);

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
