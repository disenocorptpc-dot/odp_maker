
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
            // Event listener
            input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', (e) => {
                const val = e.target.value;
                updatePreview(id, val);

                // Special handling for Propiedad Theme
                if (id === 'propiedad') {
                    applyTheme(val);
                }
                // Update document title for PDF name
                if (id === 'tareaClever') {
                    document.title = e.target.value || "ODP Maker";
                }
            });
            // Initial sync
            updatePreview(id, input.value);
            if (id === 'propiedad') applyTheme(input.value);
        }
    });

    // Theme Logic
    function applyTheme(propiedadName) {
        const paper = document.getElementById('odpPaper');
        const footerLogo = document.getElementById('footerLogo');
        let logoSrc = 'assets/logo_tpc.webp'; // Default
        let logoHeight = '40px'; // Default height

        // Reset classes but keep base
        paper.className = 'paper-a4';

        if (propiedadName.includes('Jamaica')) {
            paper.classList.add('theme-jamaica');
            logoSrc = 'assets/logo_tpc.webp'; // Explicitly assign TPC logo
            logoHeight = '40px';
        } else if (propiedadName.includes('Los Cabos')) {
            paper.classList.add('theme-lbcab');
            logoSrc = 'assets/logo_lbcab.webp';
            logoHeight = '80px'; // Double size for Le Blanc
        } else if (propiedadName.includes('Cancun') && propiedadName.includes('Le Blanc')) {
            paper.classList.add('theme-lbcun');
            logoSrc = 'assets/logo_lbcun.webp';
            logoHeight = '80px'; // Double size for Le Blanc
        } else if (propiedadName.includes('Punta Cana') && propiedadName.includes('Moon Palace')) {
            paper.classList.add('theme-mppc');
            logoSrc = 'assets/logo_mppc.webp';
            logoHeight = '80px'; // Double size for MPPC
        }

        if (footerLogo) {
            footerLogo.src = logoSrc;
            footerLogo.style.height = logoHeight;
        }
    }
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
        // Default scale 100%, dims empty
        imagesState.push({ id, url, name, scale: 100, dimW: '', dimH: '' });
        renderEditorImages();
        renderPreviewImages();
    }

    function removeImage(id) {
        imagesState = imagesState.filter(img => img.id !== id);
        renderEditorImages();
        renderPreviewImages();
    }

    function updateImageState(id, key, value) {
        const img = imagesState.find(i => i.id === id);
        if (img) {
            img[key] = value;
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
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span class="img-name" title="${img.name}">${img.name}</span>
                        <button class="delete-btn" data-id="${img.id}">X</button>
                    </div>
                    <!-- Zoom Slider -->
                    <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                         <span style="font-size:0.7rem; color:#888;">Tamaño:</span>
                         <input type="range" class="img-slider" min="5" max="100" value="${img.scale}" data-id="${img.id}" data-key="scale" style="flex:1;">
                    </div>
                    <!-- Dimensions Inputs -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                        <input type="text" placeholder="Ancho (mm)" value="${img.dimW || ''}" data-id="${img.id}" data-key="dimW" style="font-size:0.7rem; padding:2px;">
                        <input type="text" placeholder="Alto (mm)" value="${img.dimH || ''}" data-id="${img.id}" data-key="dimH" style="font-size:0.7rem; padding:2px;">
                    </div>
                </div>
            `;
            imagesListEl.appendChild(div);
        });

        // Listeners
        imagesListEl.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => removeImage(e.target.dataset.id)));

        // Universal Input Listener for image controls
        imagesListEl.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => updateImageState(e.target.dataset.id, e.target.dataset.key, e.target.value));
        });
    }

    function renderPreviewImages() {
        imagesPreviewEl.innerHTML = '';
        imagesState.forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
            wrapper.style.width = `${img.scale}%`;

            // Dim Lines Logic
            const dimH_HTML = img.dimW ? `
                <div class="dim-line dim-h">
                    <span class="dim-label">${img.dimW}</span>
                </div>` : '';

            const dimV_HTML = img.dimH ? `
                <div class="dim-line dim-v">
                    <span class="dim-label">${img.dimH}</span>
                </div>` : '';

            wrapper.innerHTML = `
                <div class="img-caption">${img.name}</div>
                <div class="preview-image-container">
                    <img src="${img.url}" alt="${img.name}">
                    ${dimH_HTML}
                    ${dimV_HTML}
                </div>
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
