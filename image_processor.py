from PIL import Image
import numpy as np
from io import BytesIO
import cv2
from sklearn.cluster import KMeans

def get_dominant_colors(image_array, n_colors=5):
    # Reshape the image to be a list of pixels
    pixels = image_array.reshape(-1, 3)

    # Find dominant colors using K-means clustering
    kmeans = KMeans(n_clusters=n_colors, random_state=42)
    kmeans.fit(pixels)

    # Get the colors and their percentages
    colors = kmeans.cluster_centers_.astype(int)
    labels = kmeans.labels_
    counts = np.bincount(labels)
    percentages = counts / len(pixels) * 100

    return [(color, percentage) for color, percentage in zip(colors, percentages)]

def get_ire_category(value):
    if value <= 1.65:
        return "Too low"
    elif value <= 10:
        return "Underexposed"
    elif value <= 20:
        return "Dark"
    elif value <= 42:
        return "Shadow detail"
    elif value <= 52:
        return "Mid-tones"
    elif value <= 90:
        return "Highlight detail"
    else:
        return "Too high"

def analyze_lighting(image_array):
    # Convert to grayscale for luminance analysis
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)

    # Divide image into regions (key, fill, background)
    h, w = gray.shape
    key_region = gray[:h//2, :w//2]
    fill_region = gray[:h//2, w//2:]
    bg_region = gray[h//2:, :]

    # Calculate average luminance for each region and convert to IRE (0-100)
    key_light = np.mean(key_region) / 255 * 100
    fill_light = np.mean(fill_region) / 255 * 100
    bg_light = np.mean(bg_region) / 255 * 100

    # Calculate lighting ratios
    key_to_fill_ratio = key_light / fill_light if fill_light > 0 else float('inf')
    key_to_bg_ratio = key_light / bg_light if bg_light > 0 else float('inf')

    return {
        'key_light': {
            'value': round(key_light, 2),
            'category': get_ire_category(key_light)
        },
        'fill_light': {
            'value': round(fill_light, 2),
            'category': get_ire_category(fill_light)
        },
        'background_light': {
            'value': round(bg_light, 2),
            'category': get_ire_category(bg_light)
        },
        'key_to_fill_ratio': round(key_to_fill_ratio, 2),
        'key_to_background_ratio': round(key_to_bg_ratio, 2)
    }

def process_image(file):
    # Read image file
    image_data = file.read()
    image = Image.open(BytesIO(image_data))

    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')

    # Get dimensions
    width, height = image.size

    # Convert to numpy array for processing
    np_image = np.array(image)

    # Get dominant colors and their percentages
    color_analysis = get_dominant_colors(np_image)

    # Analyze lighting
    lighting_analysis = analyze_lighting(np_image)

    # Format colors for display
    formatted_colors = []
    for color, percentage in color_analysis:
        hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
        formatted_colors.append({
            'color': hex_color,
            'percentage': round(percentage, 2)
        })

    return {
        'dimensions': {
            'width': width,
            'height': height
        },
        'color_scheme': formatted_colors,
        'lighting_analysis': lighting_analysis
    }