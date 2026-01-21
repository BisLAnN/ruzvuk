from flask import Flask, request, jsonify, send_file, send_from_directory, redirect
from flask_cors import CORS
import os
import json
from datetime import datetime
from music_generator import ProMusicGenerator as SimpleMusicGenerator

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

generator = SimpleMusicGenerator()
os.makedirs('generated', exist_ok=True)

# 🔐 SSO ФУНКЦИИ
def load_users():
    if os.path.exists('users.json'):
        with open('users.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"users": [], "sessions": {}}

def save_users(data):
    with open('users.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 🔐 API РЕГИСТРАЦИЯ
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        users = load_users()
        
        # Проверка дубликатов
        for user in users['users']:
            if user['username'] == data['username']:
                return jsonify({'success': False, 'error': 'Пользователь уже существует'}), 400
            if user['email'] == data['email']:
                return jsonify({'success': False, 'error': 'Email уже зарегистрирован'}), 400
        
        new_user = {
            'username': data['username'],
            'email': data['email'],
            'password': data['password'],
            'registered': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        users['users'].append(new_user)
        save_users(users)
        
        return jsonify({'success': True, 'message': 'Регистрация успешна! Теперь войдите.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# 🔐 API ВХОД
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        users = load_users()
        
        for user in users['users']:
            if (user['username'] == data['username'] and 
                user['password'] == data['password']):
                
                session_id = os.urandom(32).hex()
                users['sessions'][session_id] = {
                    'username': user['username'],
                    'email': user['email'],
                    'expires': (datetime.now().timestamp() + 24*60*60)
                }
                save_users(users)
                
                return jsonify({
                    'success': True,
                    'session_id': session_id,
                    'username': user['username']
                })
        
        return jsonify({'success': False, 'error': 'Неверный логин/пароль'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# 🔐 API ПРОВЕРКА СЕССИИ
@app.route('/api/check-session/<session_id>')
def check_session(session_id):
    try:
        users = load_users()
        session = users['sessions'].get(session_id)
        
        if session and session['expires'] > datetime.now().timestamp():
            return jsonify({
                'success': True,
                'username': session['username'],
                'email': session['email']
            })
        return jsonify({'success': False})
    except:
        return jsonify({'success': False})

# 🌐 ОСНОВНЫЕ РОУТЫ
@app.route('/')
@app.route('/index.html')
def tilda_redirect():
    return redirect('http://ruzvuk.tilda.ws', code=301)

@app.route('/app')
@app.route('/music')
@app.route('/generator')
def music_app():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def catch_all(path):
    try:
        return send_from_directory('static', path)
    except FileNotFoundError:
        return send_from_directory('static', 'index.html')

# 🎵 МУЗЫКА
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

@app.route('/api/logout/<session_id>', methods=['POST'])
def logout(session_id):
    try:
        users = load_users()
        if session_id in users['sessions']:
            del users['sessions'][session_id]
            save_users(users)
        return jsonify({'success': True})
    except:
        return jsonify({'success': True})

# 📤 TILDA WEBHOOK
@app.route('/api/webhook', methods=['POST'])
def tilda_webhook():
    data = request.form
    print("🎉 Tilda форма:", dict(data))
    return jsonify({"status": "success"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)