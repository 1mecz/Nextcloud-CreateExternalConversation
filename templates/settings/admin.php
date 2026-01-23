<div id="create_external_conversation" class="section">
    <h2><?php p($l->t('Create External Conversation')); ?></h2>
    <p class="settings-hint"><?php p($l->t('Configure connection to external Nextcloud instance for creating Talk conversations. All users will be able to use this configuration.')); ?></p>
    
    <p>
        <label for="external-url"><?php p($l->t('External Nextcloud URL')); ?></label>
        <input type="text" 
               id="external-url" 
               name="external_url" 
               value="<?php p($_['external_url']); ?>" 
               placeholder="https://nextcloud.example.com" />
    </p>
    
    <p>
        <label for="external-username"><?php p($l->t('Username')); ?></label>
        <input type="text" 
               id="external-username" 
               name="external_username" 
               value="<?php p($_['external_username']); ?>" 
               placeholder="<?php p($l->t('Username for external Nextcloud')); ?>" />
    </p>
    
    <p>
        <label for="external-password"><?php p($l->t('Password')); ?></label>
        <input type="password" 
               id="external-password" 
               name="external_password" 
               value="<?php p($_['external_password']); ?>" 
               placeholder="<?php p($l->t('Password or app password')); ?>" />
        <br />
        <em><?php p($l->t('Create app password in external Nextcloud: Settings → Security → Devices & sessions')); ?></em>
    </p>
    
    <button id="save-external-conversation-settings"><?php p($l->t('Save')); ?></button>
    <span id="external-conversation-settings-msg"></span>
</div>

<script>
(function() {
    $('#save-external-conversation-settings').click(function() {
        var external_url = $('#external-url').val();
        var external_username = $('#external-username').val();
        var external_password = $('#external-password').val();
        
        $.ajax({
            url: OC.generateUrl('/apps/create_external_conversation/settings'),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                external_url: external_url,
                external_username: external_username,
                external_password: external_password
            }),
            success: function() {
                $('#external-conversation-settings-msg')
                    .text('<?php p($l->t('Settings saved')); ?>')
                    .addClass('success')
                    .removeClass('error');
                setTimeout(function() {
                    $('#external-conversation-settings-msg').text('');
                }, 3000);
            },
            error: function() {
                $('#external-conversation-settings-msg')
                    .text('<?php p($l->t('Error saving settings')); ?>')
                    .addClass('error')
                    .removeClass('success');
            }
        });
    });
})();
</script>

<style>
#create_external_conversation input[type="text"],
#create_external_conversation input[type="password"] {
    width: 400px;
}

#external-conversation-settings-msg {
    padding-left: 10px;
}

#external-conversation-settings-msg.success {
    color: #28a745;
}

#external-conversation-settings-msg.error {
    color: #dc3545;
}
</style>
