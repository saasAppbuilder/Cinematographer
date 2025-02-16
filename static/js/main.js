document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const results = document.getElementById('results');

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Handle click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        // Validate file type and size
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPG, PNG, or GIF)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);

        // Upload and analyze
        uploadAndAnalyze(file);
    }

    async function uploadAndAnalyze(file) {
        const formData = new FormData();
        formData.append('image', file);

        loadingSpinner.classList.remove('d-none');
        results.classList.add('d-none');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            alert('Error analyzing image: ' + error.message);
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    }

    function displayResults(data) {
        results.classList.remove('d-none');

        // Display dimensions
        document.getElementById('dimensions').textContent = 
            `${data.dimensions.width}px × ${data.dimensions.height}px`;

        // Display color scheme
        const colorScheme = document.getElementById('colorScheme');
        colorScheme.innerHTML = data.color_scheme.map(({color, percentage}) => `
            <div class="color-bar">
                <div class="color-block" style="background-color: ${color}"></div>
                <div class="color-bar-label">${color} (${percentage.toFixed(1)}%)</div>
            </div>
        `).join('');

        // Display lighting analysis
        const lighting = data.lighting_analysis;

        // Update key light
        document.getElementById('keyLight').style.width = `${lighting.key_light.value}%`;
        document.getElementById('keyLightValue').textContent = 
            `IRE: ${lighting.key_light.value} - ${lighting.key_light.category}`;

        // Update fill light
        document.getElementById('fillLight').style.width = `${lighting.fill_light.value}%`;
        document.getElementById('fillLightValue').textContent = 
            `IRE: ${lighting.fill_light.value} - ${lighting.fill_light.category}`;

        // Update background light
        document.getElementById('bgLight').style.width = `${lighting.background_light.value}%`;
        document.getElementById('bgLightValue').textContent = 
            `IRE: ${lighting.background_light.value} - ${lighting.background_light.category}`;

        // Display ratios
        document.getElementById('lightingRatios').innerHTML = `
            Key to Fill Ratio: ${lighting.key_to_fill_ratio}:1<br>
            Key to Background Ratio: ${lighting.key_to_background_ratio}:1
        `;
    }
});