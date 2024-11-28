function createDateInput() {
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';

    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.id = 'dateInput';
    dateInput.value = 'Weather Date';
    
    dateInput.addEventListener('focus', (e) => {
        if (e.target.value === 'Weather Date') {
            e.target.value = '';
        }
        e.target.type = 'date';
    });
    
    dateInput.addEventListener('blur', (e) => {
        if (!e.target.value) {
            e.target.type = 'text';
            e.target.value = 'Weather Date';
        }
    });
    
    dateContainer.appendChild(dateInput);
    
    return dateContainer;
} 

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';

    const header = document.createElement('div');
    header.className = 'settings-modal-header';
    header.innerHTML = '<h2>Settings</h2>';

    const content = document.createElement('div');
    content.className = 'settings-modal-content';
    // Add your settings content here

    const footer = document.createElement('div');
    footer.className = 'settings-modal-footer';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);

    return modal;
} 