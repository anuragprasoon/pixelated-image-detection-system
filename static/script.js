document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBox = document.getElementById('uploadBox');
    const submitButton = document.getElementById('submitButton');
    const removePixelationButton = document.getElementById('removePixelationButton');
    const uploadContainer = document.getElementById('uploadContainer');
    const resultContainer = document.getElementById('resultContainer');
    const uploadForm = document.getElementById('uploadForm');

    let currentFile = null;

    uploadBox.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            currentFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadBox.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
            }
            reader.readAsDataURL(currentFile);
            removePixelationButton.disabled = true;
        }
    });

    submitButton.addEventListener('click', function() {
        if (currentFile) {
            const formData = new FormData(uploadForm);
            formData.append('action', 'detect');

            fetch('/process', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(html => {
                resultContainer.innerHTML = html;
                uploadContainer.style.display = 'none';
                resultContainer.style.display = 'block';
                const imageStatus = document.getElementById('imageStatus');
                removePixelationButton.disabled = !imageStatus.textContent.includes('Pixelated Image Detected');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing the image.');
            });
        } else {
            alert('Please select an image first.');
        }
    });

    removePixelationButton.addEventListener('click', function() {
        if (currentFile) {
            const formData = new FormData(uploadForm);
            formData.append('action', 'remove');

            fetch('/process', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(html => {
                resultContainer.innerHTML = html;
                removePixelationButton.disabled = true;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while removing pixelation.');
            });
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id == 'download') {
            const resultImage = document.getElementById('resultImage');
            const link = document.createElement('a');
            link.href = resultImage.src;
            link.download = 'processed_image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});