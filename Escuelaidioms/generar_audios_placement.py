import os
from gtts import gTTS

# Create media directory if it doesn't exist
media_dir = os.path.join("Wil", "Escuelaidioms", "media")
if not os.path.exists(media_dir):
    os.makedirs(media_dir)

# Define the scripts for the placement exam
audios = {
    "listening_01.mp3": "Attention passengers. This is an announcement for flight BA 230 to London. The flight will now depart at 2:30 PM. Please proceed to Gate 14 immediately. I repeat, flight BA 230, departing at 2:30, Gate 14.",
    "listening_02.mp3": "Good morning. Thank you for coming. Why do you want this position? Well, I am very interested in this job because I want to gain international experience. My main strength is team management, as I have led groups of over 20 people in my previous role."
}

print("Generating placement exam audios...")

for filename, text in audios.items():
    path = os.path.join(media_dir, filename)
    print(f"Creating {filename}...")
    tts = gTTS(text=text, lang='en')
    tts.save(path)

print(f"Success! Audios saved in {media_dir}")
