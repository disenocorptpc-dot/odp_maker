
document.addEventListener('DOMContentLoaded', () => {
    // defaults
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    document.getElementById('fecha').value = formattedDate;
    updatePreview('fecha', formattedDate);

    // State
    let itemsState = []; // { id, cant, archivo, material, medidas }
    let imagesState = []; // { id, url, name, scale }

    // --- 1. General Info Bindings ---
    const simpleIds = [
        'fecha', 'fechaLimite', 'disenador', 'tareaClever',
        'propiedad', 'nombreTarea', 'rutaArchivo',
        'solicitante', 'fechaEnvio', 'extId', 'transportado'
    ];
    // Init Simple Bindings
    simpleIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                updatePreview(id, e.target.value);
                // Update document title for PDF name
                if (id === 'tareaClever') {
                    document.title = e.target.value || "ODP Maker";
                }
            });
            updatePreview(id, input.value);
        }
    });
    // Observations
    document.getElementById('observaciones').addEventListener('input', (e) => {
        document.querySelector('.display-observaciones').textContent = e.target.value;
    });

    // Processes Checklist Bindings
    const processChecks = ['plotter', 'router', 'laser', 'acabados', 'calidad'];
    processChecks.forEach(proc => {
        const inputId = `input-check-${proc}`;
        const previewId = `preview-check-${proc}`;
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (input && preview) {
            input.addEventListener('change', (e) => {
                // If checked, add 'X' or checkmark. Or toggle a class.
                preview.textContent = e.target.checked ? 'X' : '';
                // Optional: make it bold or styled
                preview.style.textAlign = 'center';
                preview.style.fontWeight = 'bold';
            });
        }
    });

    // --- 2. Dynamic Items Logic ---
    const itemsContainer = document.getElementById('itemsEditorContainer');
    const itemsTableBody = document.getElementById('itemsTableBody');
    const addItemBtn = document.getElementById('addItemBtn');

    // Add initial empty item
    addItem();

    addItemBtn.addEventListener('click', () => {
        addItem();
    });

    function addItem() {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newItem = { id, cant: 1, archivo: '', material: '', medidas: '' };
        itemsState.push(newItem);
        renderEditorItems();
        renderPreviewItems();
    }

    function removeItem(id) {
        if (itemsState.length <= 1) return; // Keep at least one
        itemsState = itemsState.filter(item => item.id !== id);
        renderEditorItems();
        renderPreviewItems();
    }

    function updateItemState(id, field, value) {
        const item = itemsState.find(i => i.id === id);
        if (item) {
            item[field] = value;
            renderPreviewItems(); // Only re-render preview, don't kill focus in editor
        }
    }

    function renderEditorItems() {
        itemsContainer.innerHTML = '';
        itemsState.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'editor-item-row';
            row.innerHTML = `
                <div class="row-header">
                    <small>Item #${index + 1}</small>
                    ${itemsState.length > 1 ? `<button class="delete-btn" data-id="${item.id}">Eliminar</button>` : ''}
                </div>
                <div class="form-grid" style="margin-bottom:0.5rem;">
                    <div style="grid-column: span 2;">
                        <input type="number" placeholder="Cant." value="${item.cant}" data-id="${item.id}" data-field="cant" style="width: 25%">
                    </div>
                </div>
                <!-- Description Construction -->
                <input type="text" placeholder="Nombre Archivo" value="${item.archivo}" data-id="${item.id}" data-field="archivo" style="margin-bottom:0.5rem">
                <input type="text" placeholder="Material/Técnica" value="${item.material}" data-id="${item.id}" data-field="material" style="margin-bottom:0.5rem">
                <input type="text" placeholder="Medidas Finales" value="${item.medidas}" data-id="${item.id}" data-field="medidas">
            `;
            itemsContainer.appendChild(row);
        });

        // Re-attach listeners to new DOM inputs
        itemsContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                updateItemState(e.target.dataset.id, e.target.dataset.field, e.target.value);
            });
        });

        // Re-attach delete listeners
        itemsContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeItem(e.target.dataset.id);
            });
        });
    }

    function renderPreviewItems() {
        itemsTableBody.innerHTML = '';
        itemsState.forEach(item => {
            const tr = document.createElement('tr');
            // Logic to build description string
            let descHtml = '';
            if (item.archivo) descHtml += `<strong>Archivo:</strong> ${item.archivo}`;
            if (item.material) descHtml += `${descHtml ? ' | ' : ''}${item.material}`;
            if (item.medidas) descHtml += `${descHtml ? ' | ' : ''}<strong>medidas finales:</strong> ${item.medidas}`;

            tr.innerHTML = `
                <td class="display-cantidad text-center">${item.cant}</td>
                <td class="desc-cell">${descHtml}</td>
            `;
            itemsTableBody.appendChild(tr);
        });
    }


    // --- 3. Dynamic Images Logic ---
    const imageUpload = document.getElementById('imageUpload');
    const imagesListEl = document.getElementById('imagesEditorList');
    const imagesPreviewEl = document.getElementById('imagesPreviewContainer');
    const dropZone = document.querySelector('.file-drop-zone');

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--border-color)'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });

    imageUpload.addEventListener('change', (e) => {
        if (e.target.files) handleFiles(e.target.files);
    });

    function handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                addImage(e.target.result, file.name);
            };
            reader.readAsDataURL(file);
        });
    }

    function addImage(url, name) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        // Default scale 100%
        imagesState.push({ id, url, name, scale: 100 });
        renderEditorImages();
        renderPreviewImages();
    }

    function removeImage(id) {
        imagesState = imagesState.filter(img => img.id !== id);
        renderEditorImages();
        renderPreviewImages();
    }

    function updateImageScale(id, scale) {
        const img = imagesState.find(i => i.id === id);
        if (img) {
            img.scale = scale;
            renderPreviewImages();
        }
    }

    function renderEditorImages() {
        imagesListEl.innerHTML = '';
        imagesState.forEach(img => {
            const div = document.createElement('div');
            div.className = 'editor-image-control';
            div.innerHTML = `
                <img src="${img.url}" class="thumbs-prev">
                <div class="img-control-details">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="img-name" title="${img.name}">${img.name}</span>
                        <button class="delete-btn" data-id="${img.id}">X</button>
                    </div>
                    <input type="range" class="img-slider" min="20" max="100" value="${img.scale}" data-id="${img.id}">
                </div>
            `;
            imagesListEl.appendChild(div);
        });

        // Listeners
        imagesListEl.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => removeImage(e.target.dataset.id)));
        imagesListEl.querySelectorAll('.img-slider').forEach(range => {
            range.addEventListener('input', (e) => updateImageScale(e.target.dataset.id, e.target.value));
        });
    }

    function renderPreviewImages() {
        imagesPreviewEl.innerHTML = '';
        imagesState.forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
            // Set scale via width style on wrapper
            wrapper.style.width = `${img.scale}%`; // relative to the flex item capability, might need tuning based on parent
            // Actually, if we want them to flow, width is tricky.
            // Requirement: "ajustando automaticamente en el espacio que este disponible"
            // But user also wants to edit size.
            // Let's interpret slider as "MaxSize" or Flex basis relative to page width?
            // Let's just use width relative to the page (100% = full A4 width).
            wrapper.style.width = `${img.scale}%`;

            wrapper.innerHTML = `
                <img src="${img.url}" alt="${img.name}">
                <div class="img-caption">${img.name}</div>
            `;
            imagesPreviewEl.appendChild(wrapper);
        });
    }

    // --- Helpers ---
    function updatePreview(fieldId, value) {
        const displays = document.querySelectorAll(`.display-${fieldId}`);
        displays.forEach(el => {
            el.textContent = value;
        });
    }

    // Print Zoom
    let currentScale = 1;
    const paper = document.getElementById('odpPaper');
    const zoomIn = document.querySelector('.zoom-controls button:nth-child(3)');
    const zoomOut = document.querySelector('.zoom-controls button:nth-child(1)');
    const subLabel = document.querySelector('.zoom-controls span');

    zoomIn.addEventListener('click', () => { if (currentScale < 1.5) { currentScale += 0.1; applyScale(); } });
    zoomOut.addEventListener('click', () => { if (currentScale > 0.5) { currentScale -= 0.1; applyScale(); } });

    function applyScale() {
        paper.style.transform = `scale(${currentScale})`;
        paper.style.marginBottom = `${(currentScale - 1) * 297}mm`;
        subLabel.textContent = `${Math.round(currentScale * 100)}%`;
    }

    // PDF/Print
    document.getElementById('printBtn').addEventListener('click', () => { window.print(); });
});
