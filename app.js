
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
    // Theme Logic
    function applyTheme(propiedadName) {
        let logoSrc = 'assets/logo_tpc.webp'; // Default
        let logoHeight = '40px';
        let themeClass = '';

        if (propiedadName.includes('Jamaica')) {
            themeClass = 'theme-jamaica';
            logoSrc = 'assets/logo_tpc.webp';
            logoHeight = '40px';
        } else if (propiedadName.includes('Los Cabos')) {
            themeClass = 'theme-lbcab';
            logoSrc = 'assets/logo_lbcab.webp';
            logoHeight = '50px';
        } else if (propiedadName.includes('Cancun') && propiedadName.includes('Le Blanc')) {
            themeClass = 'theme-lbcun';
            logoSrc = 'assets/logo_lbcun.webp';
            logoHeight = '50px';
        } else if (propiedadName.includes('Punta Cana') && propiedadName.includes('Moon Palace')) {
            themeClass = 'theme-mppc';
            logoSrc = 'assets/logo_mppc.webp';
            logoHeight = '50px';
        }

        // Apply to ALL pages (Main + Dynamic)
        const allPages = document.querySelectorAll('.paper-a4');
        allPages.forEach(page => {
            // Preserve 'dynamic-page' class but reset theme
            const isDynamic = page.classList.contains('dynamic-page');
            page.className = 'paper-a4' + (isDynamic ? ' dynamic-page' : '');

            if (themeClass) {
                page.classList.add(themeClass);
            }

            // Update Footer Logo
            const logoImg = page.querySelector('.odp-footer img');
            if (logoImg) {
                logoImg.src = logoSrc;
                logoImg.style.height = logoHeight;
            }
        });
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
                <input type="text" placeholder="Material/Técnica" list="materialOptions" value="${item.material}" data-id="${item.id}" data-field="material" style="margin-bottom:0.5rem">
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
    const odpPage2 = document.getElementById('odpPage2');
    const imagesPreviewPage2 = document.getElementById('imagesPreviewContainerPage2');

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
        // Default scale 100%, dims empty, page 1
        imagesState.push({ id, url, name, scale: 100, dimW: '', dimH: '', page: 1 });
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
            // If page changed, we might need to update theme on page 2 just in case it wasn't visible
            if (key === 'page') {
                const prop = document.getElementById('propiedad').value;
                applyTheme(prop);
            }
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
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom: 5px;">
                        <input type="text" placeholder="Ancho (mm)" value="${img.dimW || ''}" data-id="${img.id}" data-key="dimW" style="font-size:0.7rem; padding:2px;">
                        <input type="text" placeholder="Alto (mm)" value="${img.dimH || ''}" data-id="${img.id}" data-key="dimH" style="font-size:0.7rem; padding:2px;">
                    </div>
                    <!-- Page 2 Checkbox -->
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="page2-${img.id}" ${img.page === 2 ? 'checked' : ''} data-id="${img.id}" data-key="page" style="width:auto;">
                        <label for="page2-${img.id}" style="font-size:0.7rem; color:#ccc; margin:0; cursor:pointer;">Mover a Hoja 2</label>
                    </div>
                </div>
            `;
            imagesListEl.appendChild(div);
        });

        // Listeners
        imagesListEl.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => removeImage(e.target.dataset.id)));

        // Inputs
        imagesListEl.querySelectorAll('input[type="range"], input[type="text"]').forEach(input => {
            input.addEventListener('input', (e) => updateImageState(e.target.dataset.id, e.target.dataset.key, e.target.value));
        });

        // Checkboxes
        imagesListEl.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', (e) => updateImageState(e.target.dataset.id, 'page', e.target.checked ? 2 : 1));
        });
    }

    function renderPreviewImages() {
        // Clear both
        imagesPreviewEl.innerHTML = '';
        if (imagesPreviewPage2) imagesPreviewPage2.innerHTML = '';

        let hasPage2 = false;

        imagesState.forEach(img => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
            wrapper.style.width = `${img.scale}%`;

            const dimH_HTML = img.dimW ? `<div class="dim-line dim-h"><span class="dim-label">${img.dimW}</span></div>` : '';
            const dimV_HTML = img.dimH ? `<div class="dim-line dim-v"><span class="dim-label">${img.dimH}</span></div>` : '';

            wrapper.innerHTML = `
                <div class="img-caption">${img.name}</div>
                <div class="preview-image-container">
                    <img src="${img.url}" alt="${img.name}">
                    ${dimH_HTML}
                    ${dimV_HTML}
                </div>
            `;

            // Distribute
            if (img.page === 2 && imagesPreviewPage2) {
                imagesPreviewPage2.appendChild(wrapper);
                hasPage2 = true;
            } else {
                imagesPreviewEl.appendChild(wrapper);
            }
        });

        // Toggle Page 2 Display
        if (odpPage2) {
            odpPage2.style.display = hasPage2 ? 'flex' : 'none';
        }
    }
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
        // Prevent accidental duplicates (same name)
        if (imagesState.some(img => img.name === name)) {
            return;
        }

        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        // Default scale 100%, dims empty, page 1 (default)
        imagesState.push({ id, url, name, scale: 100, dimW: '', dimH: '', page: 1 });
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

            // Ensure page is set
            if (!img.page) img.page = 1;

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
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-bottom: 5px;">
                        <input type="text" placeholder="Ancho (mm)" value="${img.dimW || ''}" data-id="${img.id}" data-key="dimW" style="font-size:0.7rem; padding:2px;">
                        <input type="text" placeholder="Alto (mm)" value="${img.dimH || ''}" data-id="${img.id}" data-key="dimH" style="font-size:0.7rem; padding:2px;">
                    </div>
                    <!-- Page Number Input -->
                     <div style="display:flex; align-items:center; gap:5px;">
                        <label style="font-size:0.7rem; color:#ccc; margin:0;">Hoja:</label>
                        <input type="number" min="1" value="${img.page}" data-id="${img.id}" data-key="page" style="width:50px; padding:2px; font-size:0.7rem;">
                    </div>
                </div>
            `;
            imagesListEl.appendChild(div);
        });

        // Listeners
        imagesListEl.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => removeImage(e.target.dataset.id)));

        // Inputs
        imagesListEl.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => updateImageState(e.target.dataset.id, e.target.dataset.key, e.target.value));
        });
    }

    function renderPreviewImages() {
        // 1. Clear Page 1
        imagesPreviewEl.innerHTML = '';

        // 2. Remove any previously created Dynamic Pages
        document.querySelectorAll('.dynamic-page').forEach(el => el.remove());

        // Also hide or remove the old hardcoded Page 2 if it exists
        const oldPage2 = document.getElementById('odpPage2');
        if (oldPage2) oldPage2.style.display = 'none';

        // 3. Group images by page
        const pages = {};
        imagesState.forEach(img => {
            const p = parseInt(img.page) || 1;
            if (!pages[p]) pages[p] = [];
            pages[p].push(img);
        });

        // 4. Get Current Theme Info from Page 1
        const mainPaper = document.getElementById('odpPaper');
        const themeClasses = Array.from(mainPaper.classList).filter(c => c.startsWith('theme-'));
        const footerLogo = document.getElementById('footerLogo');
        const logoSrc = footerLogo ? footerLogo.src : '';
        const logoHeight = footerLogo ? footerLogo.style.height : '40px';

        // 5. Render Each Page
        Object.keys(pages).sort((a, b) => a - b).forEach(pageNum => {
            const p = parseInt(pageNum);
            const imgs = pages[p];

            let targetContainer;

            if (p === 1) {
                targetContainer = imagesPreviewEl;
            } else {
                // Create New Page
                const newPage = document.createElement('div');
                newPage.className = 'paper-a4 dynamic-page';
                newPage.id = `odpPage-dynamic-${p}`;

                // Apply Theme
                themeClasses.forEach(c => newPage.classList.add(c));

                // Structure
                newPage.innerHTML = `
                    <div class="odp-header">
                        <h2>Referencia Visual (Pág. ${p})</h2>
                    </div>
                    <div class="visual-reference-area" style="flex: 1;">
                        <div class="images-preview-grid"></div>
                    </div>
                    <footer class="odp-footer">
                        <div class="footer-center" style="width: 100%; text-align: center;">
                            <img src="${logoSrc}" style="height: ${logoHeight}; object-fit: contain;">
                        </div>
                    </footer>
                `;

                // Append to Preview Panel
                mainPaper.parentElement.appendChild(newPage);
                targetContainer = newPage.querySelector('.images-preview-grid');
            }

            // Render Images into container
            imgs.forEach(img => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-image-wrapper';
                wrapper.style.width = `${img.scale}%`;

                const dimH_HTML = img.dimW ? `<div class="dim-line dim-h"><span class="dim-label">${img.dimW}</span></div>` : '';
                const dimV_HTML = img.dimH ? `<div class="dim-line dim-v"><span class="dim-label">${img.dimH}</span></div>` : '';

                wrapper.innerHTML = `
                    <div class="img-caption">${img.name}</div>
                    <div class="preview-image-container">
                        <img src="${img.url}" alt="${img.name}">
                        ${dimH_HTML}
                        ${dimV_HTML}
                    </div>
                `;
                targetContainer.appendChild(wrapper);
            });
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
