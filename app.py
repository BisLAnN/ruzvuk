from flask import Flask, request, jsonify, send_file, send_from_directory, redirect
from flask_cors import CORS
import os
from music_generator import ProMusicGenerator as SimpleMusicGenerator

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

generator = SimpleMusicGenerator()
os.makedirs('generated', exist_ok=True)

@app.route('/')
@app.route('/index.html')
def tilda_redirect():
    return redirect('http://ruzvuk.tilda.ws/page111879746.html', code=301)

@app.route('/app')
@app.route('/music')
@app.route('/generator')
def music_app():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)


@app.route('/<path:path>')
def catch_all(path):
    try:
        return send_from_directory('static', path)
    except FileNotFoundError:
        return send_from_directory('static', 'index.html')

@app.route('/generate_music', methods=['POST'])
def generate_music():
    try:
        data = request.json
        print(f"Получены параметры: {data}")
        
        filename = generator.generate_music(
            data.get('genre', 'Поп'),
            data.get('mood', 'Радость'),
            data.get('instrument', 'Электронные'),
            int(data.get('length', 2)),
            int(data.get('tempo', 120)),
            data.get('description', '')
        )
        
        return jsonify({
            'success': True, 
            'filename': filename,
            'download_url': f'/download/{filename}'
        })
    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/download/<filename>')
def download(filename):
    filepath = os.path.join('generated', filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return "Файл не найден", 404


@app.route('/api/webhook', methods=['POST'])
def tilda_webhook():
    data = request.form
    print("🎉 Tilda форма:", dict(data))
    return jsonify({"status": "success"})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)