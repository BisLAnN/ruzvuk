import numpy as np
from scipy.io.wavfile import write
import os
import random
import math

class ProMusicGenerator:
    def __init__(self):
        self.sample_rate = 44100
        self.scales = {
            'классика': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            'поп': ['C', 'D', 'E', 'F', 'G', 'A', 'B'], 
            'рок': ['E', 'G', 'A', 'B', 'C', 'D', 'E'],
            'джаз': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
            'ambient': ['C', 'Eb', 'F', 'G', 'Bb']
        }
        self.note_freqs = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30,
            'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
        }
    
    def adsr_envelope(self, t, attack=0.01, decay=0.1, sustain=0.7, release=0.2):
        """Реалистичная ADSR огибающая"""
        env = np.ones_like(t)
        
        attack_samples = int(attack * self.sample_rate)
        decay_samples = int(decay * self.sample_rate)
        release_samples = int(release * self.sample_rate)
        
        if attack_samples > 0:
            env[:attack_samples] = np.linspace(0, 1, attack_samples)
        if decay_samples > 0:
            env[attack_samples:attack_samples+decay_samples] = np.linspace(1, sustain, decay_samples)
        if release_samples > 0 and len(env) > release_samples:
            env[-release_samples:] = np.linspace(sustain, 0, release_samples)
            
        return env
    
    def get_instrument(self, instr_type):
        """Характеристики инструментов"""
        return {
            'электронные': {'waveform': 'sawtooth', 'harmonics': [1, 0.5, 0.3], 'attack': 0.001, 'decay': 0.05},
            'акустические': {'waveform': 'triangle', 'harmonics': [1, 0.7, 0.3], 'attack': 0.02, 'decay': 0.15},
            'оркестровые': {'waveform': 'square', 'harmonics': [1, 0.4, 0.2, 0.1], 'attack': 0.01, 'decay': 0.2}
        }.get(instr_type.lower(), {'waveform': 'sine', 'harmonics': [1], 'attack': 0.01, 'decay': 0.1})
    
    def generate_note(self, freq, duration, instrument, volume=0.4):
        """Многослойная нота с гармониками"""
        t = np.linspace(0, duration, int(self.sample_rate * duration), False)
        note = np.zeros_like(t)
        
        instr = self.get_instrument(instrument)
        env = self.adsr_envelope(t, instr['attack'], instr['decay'])
        

        for i, harmonic_vol in enumerate(instr['harmonics'][:3]):
            harmonic_freq = freq * (i + 1)
            wave = self.get_waveform(t, harmonic_freq, instr['waveform'])
            note += wave * harmonic_vol * env
        
        return (note * volume * 0.3).astype(np.float32)
    
    def get_waveform(self, t, freq, waveform='sine'):
        """Формы волн"""
        if waveform == 'square':
            return np.sign(np.sin(2 * np.pi * freq * t))
        elif waveform == 'sawtooth':
            return 2 * (freq * t - np.floor(freq * t + 0.5))
        elif waveform == 'triangle':
            return 2 * np.abs(2 * (freq * t - np.floor(freq * t + 0.5))) - 1
        return np.sin(2 * np.pi * freq * t)
    
    def generate_drums(self, duration, tempo_bpm):
        """Реалистичные барабаны"""
        beat_duration = 60.0 / tempo_bpm
        total_samples = int(self.sample_rate * duration)
        drums = np.zeros(total_samples)
        
        beats = int(duration / beat_duration)
        for beat in range(beats):

            if beat % 1 == 0:
                start = int(beat * beat_duration * self.sample_rate)
                kick_t = np.linspace(0, 0.2, int(0.2 * self.sample_rate))
                kick_freq = 60 + beat * 5  # падает
                kick = np.sin(2 * np.pi * kick_freq * kick_t) * np.exp(-kick_t * 8)
                if start + len(kick) < total_samples:
                    drums[start:start+len(kick)] += kick * 0.4
            

            if beat % 2 == 0:
                snare_start = int((beat + 0.5) * beat_duration * self.sample_rate)
                snare_t = np.linspace(0, 0.15, int(0.15 * self.sample_rate))
                snare = np.sin(2 * np.pi * 200 * snare_t) * np.exp(-snare_t * 10) * 0.3
                if snare_start + len(snare) < total_samples:
                    drums[snare_start:snare_start+len(snare)] += snare
        
        return drums
    
    def generate_bassline(self, scale, duration, tempo_bpm):

        beat_duration = 60.0 / tempo_bpm
        total_samples = int(self.sample_rate * duration)
        bass = np.zeros(total_samples)
        
        beats = int(duration / beat_duration)
        bass_pattern = [0, 0, 1, 0, 1, 0, 0, 1]
        
        for beat in range(beats):
            if bass_pattern[beat % len(bass_pattern)]:
                freq = random.choice(scale) * 0.5 
                start = int(beat * beat_duration * self.sample_rate)
                note = self.generate_note(freq, beat_duration * 0.7, 'электронные', 0.35)
                if start + len(note) < total_samples:
                    bass[start:start+len(note)] += note
        
        return bass
    
    def generate_melody(self, scale, duration, instrument, complexity=0.6):

        beat_duration = 0.5
        total_samples = int(self.sample_rate * duration)
        melody = np.zeros(total_samples)
        
        beats = int(duration / beat_duration)
        chord_progression = [0, 3, 4, 5]
        
        for beat in range(0, beats, 2):

            root = scale[chord_progression[beat % 4 % len(chord_progression)]]
            freq = root * random.choice([1, 1.5, 2])
            
            start = int(beat * beat_duration * self.sample_rate)
            note_dur = beat_duration * random.choice([0.8, 1.2, 1.6]) * (1 + complexity)
            note = self.generate_note(freq, note_dur, instrument, 0.45)
            
            if start + len(note) < total_samples:
                melody[start:start+len(note)] += note
        
        return melody
    
    def generate_music(self, genre, mood, instrument, length_min, tempo_bpm, description=""):
        print(f"🎵 🎼 СУПЕР ПРО: {genre} | {mood} | {tempo_bpm} BPM")
        
        duration = length_min * 60
        total_samples = int(self.sample_rate * duration)
        

        scale_notes = self.scales.get(genre.lower(), self.scales['поп'])
        scale = [self.note_freqs[note] for note in scale_notes]
        

        drums = self.generate_drums(duration, tempo_bpm)
        bass = self.generate_bassline(scale, duration, tempo_bpm)
        melody = self.generate_melody(scale, duration, instrument)
        

        mix = melody * 0.5 + bass * 0.4 + drums * 0.35
        

        reverb = np.roll(mix * 0.2, int(0.1 * self.sample_rate))
        mix += reverb * np.linspace(1, 0.2, len(mix))
        

        left = mix * np.linspace(0.8, 1.0, len(mix))
        right = mix * np.linspace(1.0, 0.8, len(mix))
        stereo = np.stack((left, right), axis=1).flatten()
        

        stereo = stereo / np.max(np.abs(stereo)) * 0.92
        audio = (stereo * 32767).astype(np.int16)
        

        os.makedirs('generated', exist_ok=True)
        filename = f"master_{genre}_{mood}_{length_min}min_{tempo_bpm}bpm.wav"
        filepath = os.path.join('generated', filename)
        write(filepath, self.sample_rate, audio)
        
        print(f"✅ 🎵 МАСТЕР ТРЕК: {filename}")
        return filename