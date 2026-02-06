#!/usr/bin/env python3
"""
Script de transcription audio vers texte utilisant faster-whisper.
Supporte les formats: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
"""

import sys
import subprocess
from pathlib import Path

def install_package(package: str):
    """Installe un package pip."""
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])

def check_dependencies():
    """Vérifie et installe les dépendances nécessaires."""
    try:
        from faster_whisper import WhisperModel
        return True
    except ImportError:
        print("Installation de faster-whisper en cours...")
        install_package("faster-whisper")
        return True

def transcribe_audio(audio_path: str, output_path: str = None, model_name: str = "base") -> str:
    """
    Transcrit un fichier audio en texte.
    
    Args:
        audio_path: Chemin vers le fichier audio
        output_path: Chemin de sortie pour le fichier .txt (optionnel)
        model_name: Modèle Whisper à utiliser (tiny, base, small, medium, large-v3)
    
    Returns:
        Le texte transcrit
    """
    from faster_whisper import WhisperModel
    
    audio_file = Path(audio_path)
    
    if not audio_file.exists():
        raise FileNotFoundError(f"Fichier audio introuvable: {audio_path}")
    
    print(f"Chargement du modèle Whisper '{model_name}'...")
    # Utilise CPU par défaut, change en "cuda" si GPU disponible
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    
    print(f"Transcription de: {audio_file.name}")
    segments, info = model.transcribe(str(audio_file), language="fr")
    
    print(f"Langue détectée: {info.language} (probabilité: {info.language_probability:.2%})")
    
    # Assembler tous les segments
    transcription_parts = []
    for segment in segments:
        transcription_parts.append(segment.text)
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
    
    transcription = " ".join(transcription_parts).strip()
    
    # Déterminer le chemin de sortie
    if output_path is None:
        output_path = audio_file.with_suffix(".txt")
    else:
        output_path = Path(output_path)
    
    # Sauvegarder la transcription
    output_path.write_text(transcription, encoding="utf-8")
    print(f"\nTranscription sauvegardée: {output_path}")
    
    return transcription

def main():
    # Fichier audio à transcrire
    audio_file = r"WhatsApp Ptt 2026-02-05 at 20.27.53.ogg"
    
    # Vérifier les dépendances
    check_dependencies()
    
    # Transcrire
    try:
        text = transcribe_audio(
            audio_path=audio_file,
            model_name="base"  # Options: tiny, base, small, medium, large-v3
        )
        print("\n" + "="*50)
        print("TRANSCRIPTION COMPLÈTE:")
        print("="*50)
        print(text)
        print("="*50)
    except Exception as e:
        print(f"Erreur lors de la transcription: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
