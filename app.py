from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)

# Load your trained models
detection_model = tf.keras.models.load_model('pixelatedimgdetection.h5')
removal_model = tf.keras.models.load_model('pixelationremoval.h5')

def preprocess_image(image, target_size=(500, 500)):
    img = image.resize(target_size)
    img_array = np.array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

def postprocess_image(img_array):
    img_array = np.clip(img_array[0] * 500, 0, 500).astype(np.uint8)
    return Image.fromarray(img_array)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return render_template('result.html', error='No file uploaded')
    
    file = request.files['file']
    action = request.form.get('action')
    
    if file.filename == '':
        return render_template('result.html', error='No file selected')
    
    if file and action:
        img = Image.open(file.stream)
        processed_img = preprocess_image(img)
        
        if action == 'detect':
            # Detect pixelation
            detection = detection_model.predict(processed_img)
            is_pixelated = process_detection(detection)
            
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return render_template('result.html', 
                                   image=img_str, 
                                   is_pixelated=is_pixelated, 
                                   action='detect')
        
        elif action == 'remove':
            # Remove pixelation
            removal = removal_model.predict(processed_img)
            result_img = postprocess_image(removal)
            
            
            buffered = io.BytesIO()
            result_img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return render_template('result.html', 
                                   image=img_str, 
                                   is_pixelated=True, 
                                   action='remove')
    
    return render_template('result.html', error='Invalid request')

def process_detection(detection):
    score = tf.nn.softmax(detection[0])
    if class_names[np.argmax(score)] == 'Non-Pixelated':
        return True 
    else:
        return False

if __name__ == '__main__':
    app.run(debug=True)